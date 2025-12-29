import { Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

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
