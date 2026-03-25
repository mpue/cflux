import { Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { actionService } from '../services/action.service';
import { emailService } from '../services/email.service';
import crypto from 'crypto';


// --- Login Throttling (Brute Force Protection) ---
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // cleanup every 10 minutes

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, attempt] of loginAttempts.entries()) {
    if (attempt.lockedUntil && attempt.lockedUntil < now) {
      loginAttempts.delete(key);
    } else if (now - attempt.firstAttempt > LOCKOUT_DURATION_MS) {
      loginAttempts.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

function getThrottleKey(email: string, ip: string): string {
  return `${email.toLowerCase()}::${ip}`;
}

function checkThrottle(key: string): { blocked: boolean; remainingSeconds: number; attempts: number } {
  const attempt = loginAttempts.get(key);
  if (!attempt) return { blocked: false, remainingSeconds: 0, attempts: 0 };

  const now = Date.now();
  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    return { blocked: true, remainingSeconds: Math.ceil((attempt.lockedUntil - now) / 1000), attempts: attempt.count };
  }

  // Reset if lock expired
  if (attempt.lockedUntil && attempt.lockedUntil <= now) {
    loginAttempts.delete(key);
    return { blocked: false, remainingSeconds: 0, attempts: 0 };
  }

  return { blocked: false, remainingSeconds: 0, attempts: attempt.count };
}

function recordFailedAttempt(key: string): { locked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, firstAttempt: now, lockedUntil: null };

  attempt.count += 1;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(key, attempt);
    return { locked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000), attemptsLeft: 0 };
  }

  loginAttempts.set(key, attempt);
  return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS - attempt.count };
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}
// --- End Login Throttling ---

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, vacationDays, isActive, ...additionalFields } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Sicherheit: Nur Admins können Benutzer mit Admin-Rolle erstellen
    let assignedRole = 'USER';
    if (role && role === 'ADMIN') {
      // Prüfe ob der anfragende Benutzer Admin ist
      if (req.user && req.user.role === 'ADMIN') {
        assignedRole = 'ADMIN';
      } else {
        return res.status(403).json({ error: 'Only admins can create admin users' });
      }
    }

    // Separate employee fields from user fields
    const employeeFieldsList = [
      'dateOfBirth', 'placeOfBirth', 'nationality', 'phone', 'mobile',
      'street', 'streetNumber', 'zipCode', 'postalCode', 'city', 'country',
      'employeeNumber', 'startDate', 'entryDate', 'exitDate', 'probationEndDate',
      'iban', 'bankName', 'bic', 'civilStatus', 'religion',
      'ahvNumber', 'healthInsurance', 'isCrossBorderCommuter', 'taxId', 'taxClass',
      'socialSecurityNumber', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
      'department', 'position', 'supervisorId', 'salaryEncrypted',
      'weeklyHours', 'contractHours', 'hourlyRate', 'canton', 'exemptFromTracking', 'vacationDays'
    ];

    const employeeData: any = {};
    for (const field of employeeFieldsList) {
      if (additionalFields[field] !== undefined) {
        employeeData[field] = additionalFields[field];
      }
    }

    // Add default vacationDays if provided
    if (vacationDays !== undefined) {
      employeeData.vacationDays = vacationDays;
    } else {
      employeeData.vacationDays = 30;
    }

    // Create user (without employee fields)
    const userData: any = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: assignedRole,
      isActive: isActive !== undefined ? isActive : true
    };

    const user = await prisma.user.create({
      data: userData
    });

    // Convert date strings to Date objects for employee data
    if (employeeData.dateOfBirth) {
      employeeData.dateOfBirth = new Date(employeeData.dateOfBirth);
    }
    if (employeeData.entryDate) {
      employeeData.entryDate = new Date(employeeData.entryDate);
    }
    if (employeeData.startDate) {
      employeeData.startDate = new Date(employeeData.startDate);
    }
    if (employeeData.exitDate) {
      employeeData.exitDate = new Date(employeeData.exitDate);
    }
    if (employeeData.probationEndDate) {
      employeeData.probationEndDate = new Date(employeeData.probationEndDate);
    }

    // Create employee profile
    await prisma.employee.create({
      data: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        ...employeeData
      }
    });

    const jwtOptions: SignOptions = {
      expiresIn: '7d'
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      jwtOptions
    );

    // Trigger user.created action
    try {
      await actionService.triggerAction('user.created', {
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: new Date().toISOString()
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger user.created:', actionError);
    }

    // Fetch employee profile for vacation days
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        employeeProfile: {
          select: {
            vacationDays: true
          }
        }
      }
    });

    res.status(201).json({
      user: {
        id: userWithProfile!.id,
        email: userWithProfile!.email,
        firstName: userWithProfile!.firstName,
        lastName: userWithProfile!.lastName,
        role: userWithProfile!.role,
        vacationDays: userWithProfile!.employeeProfile?.vacationDays || 30,
        isActive: userWithProfile!.isActive
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const throttleKey = getThrottleKey(email, clientIp);

    // Check if this email+IP combination is throttled
    const throttle = checkThrottle(throttleKey);
    if (throttle.blocked) {
      const minutes = Math.ceil(throttle.remainingSeconds / 60);
      return res.status(429).json({
        error: `Zu viele fehlgeschlagene Anmeldeversuche. Bitte warten Sie ${minutes} Minute${minutes > 1 ? 'n' : ''}.`,
        lockedUntil: throttle.remainingSeconds,
        throttled: true
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const result = recordFailedAttempt(throttleKey);
      if (result.locked) {
        return res.status(429).json({
          error: `Zu viele fehlgeschlagene Anmeldeversuche. Konto für 15 Minuten gesperrt.`,
          lockedUntil: result.remainingSeconds,
          throttled: true
        });
      }
      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsLeft: result.attemptsLeft
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const result = recordFailedAttempt(throttleKey);
      if (result.locked) {
        return res.status(429).json({
          error: `Zu viele fehlgeschlagene Anmeldeversuche. Konto für 15 Minuten gesperrt.`,
          lockedUntil: result.remainingSeconds,
          throttled: true
        });
      }
      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsLeft: result.attemptsLeft
      });
    }

    // Successful login — clear throttle counter
    clearAttempts(throttleKey);

    const jwtOptions: SignOptions = {
      expiresIn: '7d'
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      jwtOptions
    );

    // Trigger user.login action
    try {
      await actionService.triggerAction('user.login', {
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString()
      });
    } catch (actionError) {
      console.error('[Action] Failed to trigger user.login:', actionError);
      // Don't fail the request if action fails
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        requiresPasswordChange: user.requiresPasswordChange || false
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Request password reset - generates token and sends email
export const requestPasswordReset = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Save hashed token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry
      }
    });

    // Send email with unhashed token
    await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName
    );

    // Log action
    try {
      await actionService.triggerAction('user.password_reset_requested', {
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        email: user.email,
        requestedAt: new Date().toISOString()
      });
    } catch (actionError) {
      console.error('[Action] Failed to log password reset request:', actionError);
    }

    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// Verify reset token validity
export const verifyResetToken = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date()
        },
        isActive: true
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ 
      valid: true,
      email: user.email 
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
};

// Reset password with token
export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date()
        },
        isActive: true
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        requiresPasswordChange: false
      }
    });

    // Log action
    try {
      await actionService.triggerAction('user.password_reset_completed', {
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        email: user.email,
        completedAt: new Date().toISOString()
      });
    } catch (actionError) {
      console.error('[Action] Failed to log password reset completion:', actionError);
    }

    res.json({ 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
