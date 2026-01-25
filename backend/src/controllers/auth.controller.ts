import { Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { actionService } from '../services/action.service';
import { emailService } from '../services/email.service';
import crypto from 'crypto';

const prisma = new PrismaClient();

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

    // Datum-Strings in DateTime konvertieren
    const userData: any = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: assignedRole,
      vacationDays: vacationDays !== undefined ? vacationDays : 30,
      isActive: isActive !== undefined ? isActive : true,
      ...additionalFields
    };
    
    if (userData.dateOfBirth) {
      userData.dateOfBirth = new Date(userData.dateOfBirth);
    }
    if (userData.entryDate) {
      userData.entryDate = new Date(userData.entryDate);
    }
    if (userData.exitDate) {
      userData.exitDate = new Date(userData.exitDate);
    }

    const user = await prisma.user.create({
      data: userData
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

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        vacationDays: user.vacationDays,
        isActive: user.isActive
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
