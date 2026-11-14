import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../db.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organization: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  organization: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await prisma.user.create({
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase(),
        passwordHash,
        organization: validated.organization?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        createdAt: true,
      },
    });

    // Create a default demo queue so the new manager can test immediately!
    const defaultQueue = await prisma.queue.create({
      data: {
        userId: user.id,
        name: 'General Service',
        description: 'Primary customer service and check-in queue',
        prefix: 'A',
        status: 'ACTIVE',
      },
    });

    // Create an activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        queueId: defaultQueue.id,
        action: 'QUEUE_CREATED',
        details: 'Default primary queue initialized',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        createdAt: true,
        _count: {
          select: {
            queues: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validated = updateProfileSchema.parse(req.body);

    const updateData: {
      name?: string;
      organization?: string | null;
      passwordHash?: string;
    } = {};

    if (validated.name) updateData.name = validated.name.trim();
    if (validated.organization !== undefined) {
      updateData.organization = validated.organization.trim() || null;
    }

    if (validated.newPassword) {
      if (!validated.currentPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password',
        });
        return;
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!currentUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isMatch = await bcrypt.compare(validated.currentPassword, currentUser.passwordHash);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Current password does not match',
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(validated.newPassword, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

