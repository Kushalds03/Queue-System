import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const queueSchema = z.object({
  name: z.string().min(1, 'Queue name is required').max(100),
  description: z.string().max(500).optional(),
  prefix: z.string().min(1, 'Prefix is required').max(5).default('Q'),
});

const updateQueueSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  prefix: z.string().min(1).max(5).optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});

export const getQueues = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const queues = await prisma.queue.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tokens: true,
          },
        },
      },
    });

    // Fetch live statistics for each queue: waiting count, serving count, completed count
    const enrichedQueues = await Promise.all(
      queues.map(async (q) => {
        const [waitingCount, servingToken, completedCount, cancelledCount] =
          await Promise.all([
            prisma.token.count({
              where: { queueId: q.id, status: 'WAITING' },
            }),
            prisma.token.findFirst({
              where: { queueId: q.id, status: 'SERVING' },
              select: {
                id: true,
                tokenNumber: true,
                customerName: true,
                servedAt: true,
              },
            }),
            prisma.token.count({
              where: { queueId: q.id, status: 'COMPLETED' },
            }),
            prisma.token.count({
              where: { queueId: q.id, status: 'CANCELLED' },
            }),
          ]);

        return {
          ...q,
          waitingCount,
          servingToken,
          completedCount,
          cancelledCount,
          totalTokens: q._count.tokens,
        };
      })
    );

    res.status(200).json({
      success: true,
      queues: enrichedQueues,
    });
  } catch (error) {
    next(error);
  }
};

export const getQueueById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const queue = await prisma.queue.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            tokens: true,
          },
        },
      },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    const [waitingCount, servingToken, completedCount, cancelledCount, waitingTokens] =
      await Promise.all([
        prisma.token.count({
          where: { queueId: queue.id, status: 'WAITING' },
        }),
        prisma.token.findFirst({
          where: { queueId: queue.id, status: 'SERVING' },
        }),
        prisma.token.count({
          where: { queueId: queue.id, status: 'COMPLETED' },
        }),
        prisma.token.count({
          where: { queueId: queue.id, status: 'CANCELLED' },
        }),
        prisma.token.findMany({
          where: { queueId: queue.id, status: 'WAITING' },
          orderBy: { position: 'asc' },
        }),
      ]);

    res.status(200).json({
      success: true,
      queue: {
        ...queue,
        waitingCount,
        servingToken,
        completedCount,
        cancelledCount,
        waitingTokens,
        totalTokens: queue._count.tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createQueue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validated = queueSchema.parse(req.body);

    const queue = await prisma.queue.create({
      data: {
        userId,
        name: validated.name.trim(),
        description: validated.description?.trim(),
        prefix: validated.prefix.trim().toUpperCase(),
        status: 'ACTIVE',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        queueId: queue.id,
        action: 'QUEUE_CREATED',
        details: `Queue "${queue.name}" created with prefix "${queue.prefix}"`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      queue,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQueue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const validated = updateQueueSchema.parse(req.body);

    const existing = await prisma.queue.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    const updated = await prisma.queue.update({
      where: { id },
      data: {
        ...(validated.name ? { name: validated.name.trim() } : {}),
        ...(validated.description !== undefined ? { description: validated.description?.trim() } : {}),
        ...(validated.prefix ? { prefix: validated.prefix.trim().toUpperCase() } : {}),
        ...(validated.status ? { status: validated.status } : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        queueId: id,
        action: 'QUEUE_UPDATED',
        details: `Queue "${updated.name}" updated`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Queue updated successfully',
      queue: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleQueueStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const queue = await prisma.queue.findFirst({
      where: { id, userId },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    const nextStatus = queue.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    const updated = await prisma.queue.update({
      where: { id },
      data: { status: nextStatus },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        queueId: id,
        action: nextStatus === 'ACTIVE' ? 'QUEUE_RESUMED' : 'QUEUE_PAUSED',
        details: `Queue "${updated.name}" is now ${nextStatus}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Queue has been ${nextStatus === 'ACTIVE' ? 'activated' : 'paused'}`,
      queue: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQueue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const queue = await prisma.queue.findFirst({
      where: { id, userId },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    await prisma.queue.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'QUEUE_DELETED',
        details: `Queue "${queue.name}" was deleted`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Queue and all its associated tokens deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
