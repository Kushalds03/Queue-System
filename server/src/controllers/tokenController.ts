import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const createTokenSchema = z.object({
  queueId: z.string().min(1, 'Queue ID is required'),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  customerPhone: z.string().max(20).optional(),
  notes: z.string().max(300).optional(),
});

const moveTokenSchema = z.object({
  direction: z.enum(['UP', 'DOWN']),
});

const reorderSchema = z.object({
  queueId: z.string().min(1),
  orderedTokenIds: z.array(z.string().min(1)),
});

export const createToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validated = createTokenSchema.parse(req.body);

    const queue = await prisma.queue.findFirst({
      where: { id: validated.queueId, userId },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    if (queue.status === 'PAUSED') {
      res.status(400).json({
        success: false,
        message: 'Queue is currently paused. Please activate the queue before adding customers.',
      });
      return;
    }

    // Determine sequence number for today / total for this queue
    const highestToken = await prisma.token.findFirst({
      where: { queueId: queue.id },
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });

    const nextSeq = (highestToken?.sequenceNumber || 0) + 1;
    // Format token number, e.g. "A-101", "Q-005"
    const formattedTokenNumber = `${queue.prefix}-${String(nextSeq).padStart(3, '0')}`;

    // Calculate position in the waiting line
    const waitingCount = await prisma.token.count({
      where: { queueId: queue.id, status: 'WAITING' },
    });
    const position = waitingCount + 1;

    const token = await prisma.token.create({
      data: {
        queueId: queue.id,
        tokenNumber: formattedTokenNumber,
        sequenceNumber: nextSeq,
        customerName: validated.customerName.trim(),
        customerPhone: validated.customerPhone?.trim() || null,
        notes: validated.notes?.trim() || null,
        status: 'WAITING',
        position,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        queueId: queue.id,
        action: 'TOKEN_CREATED',
        details: `Token #${token.tokenNumber} created for ${token.customerName} (Position ${position})`,
      },
    });

    res.status(201).json({
      success: true,
      message: `Token #${token.tokenNumber} generated successfully`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getWaitingTokens = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { queueId } = req.params;
    const userId = req.user!.id;

    const queue = await prisma.queue.findFirst({
      where: { id: queueId, userId },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    const tokens = await prisma.token.findMany({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: tokens.length,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentlyServing = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { queueId } = req.params;
    const userId = req.user!.id;

    const queue = await prisma.queue.findFirst({
      where: { id: queueId, userId },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    const servingToken = await prisma.token.findFirst({
      where: { queueId, status: 'SERVING' },
    });

    res.status(200).json({
      success: true,
      servingToken,
    });
  } catch (error) {
    next(error);
  }
};

export const callNext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { queueId } = req.body;
    const userId = req.user!.id;

    if (!queueId) {
      res.status(400).json({ success: false, message: 'Queue ID is required' });
      return;
    }

    const queue = await prisma.queue.findFirst({
      where: { id: queueId, userId },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    if (queue.status === 'PAUSED') {
      res.status(400).json({
        success: false,
        message: 'Cannot call next customer while queue is paused. Please resume the queue first.',
      });
      return;
    }

    // MANDATORY REQUIREMENT: Prevent multiple simultaneous service assignments
    const currentServing = await prisma.token.findFirst({
      where: { queueId, status: 'SERVING' },
    });

    if (currentServing) {
      res.status(400).json({
        success: false,
        message: `Token #${currentServing.tokenNumber} (${currentServing.customerName}) is currently being served. Complete or cancel this customer before calling the next one.`,
        currentServing,
      });
      return;
    }

    // Find the first waiting customer (position 1 or lowest position)
    const nextWaiting = await prisma.token.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'asc' },
    });

    if (!nextWaiting) {
      res.status(400).json({
        success: false,
        message: 'No customers currently waiting in this queue.',
      });
      return;
    }

    const now = new Date();

    // In a transaction: assign nextWaiting to SERVING and adjust remaining positions
    const [updatedServing] = await prisma.$transaction([
      prisma.token.update({
        where: { id: nextWaiting.id },
        data: {
          status: 'SERVING',
          servedAt: now,
          position: 0,
        },
      }),
      // Decrement position for all other waiting tokens in this queue
      prisma.token.updateMany({
        where: {
          queueId,
          status: 'WAITING',
          id: { not: nextWaiting.id },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          queueId,
          action: 'TOKEN_CALLED',
          details: `Called Token #${nextWaiting.tokenNumber} (${nextWaiting.customerName}) to Counter`,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Now serving Token #${updatedServing.tokenNumber} (${updatedServing.customerName})`,
      servingToken: updatedServing,
    });
  } catch (error) {
    next(error);
  }
};

export const completeService = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const token = await prisma.token.findFirst({
      where: { id },
      include: { queue: true },
    });

    if (!token || token.queue.userId !== userId) {
      res.status(404).json({
        success: false,
        message: 'Token not found or unauthorized',
      });
      return;
    }

    if (token.status !== 'SERVING') {
      res.status(400).json({
        success: false,
        message: `Only currently serving tokens can be completed. Current status: ${token.status}`,
      });
      return;
    }

    const completedAt = new Date();

    const [updatedToken] = await prisma.$transaction([
      prisma.token.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt,
          position: 0,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          queueId: token.queueId,
          action: 'TOKEN_COMPLETED',
          details: `Service completed for Token #${token.tokenNumber} (${token.customerName})`,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Service completed for Token #${updatedToken.tokenNumber}`,
      token: updatedToken,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const token = await prisma.token.findFirst({
      where: { id },
      include: { queue: true },
    });

    if (!token || token.queue.userId !== userId) {
      res.status(404).json({
        success: false,
        message: 'Token not found or unauthorized',
      });
      return;
    }

    if (token.status === 'COMPLETED' || token.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        message: `Token is already ${token.status.toLowerCase()}`,
      });
      return;
    }

    const wasWaiting = token.status === 'WAITING';
    const oldPosition = token.position;

    // Transaction to update token and readjust remaining waiting positions if necessary
    const [cancelledToken] = await prisma.$transaction([
      prisma.token.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          position: 0,
        },
      }),
      ...(wasWaiting
        ? [
            prisma.token.updateMany({
              where: {
                queueId: token.queueId,
                status: 'WAITING',
                position: { gt: oldPosition },
              },
              data: {
                position: {
                  decrement: 1,
                },
              },
            }),
          ]
        : []),
      prisma.activityLog.create({
        data: {
          userId,
          queueId: token.queueId,
          action: 'TOKEN_CANCELLED',
          details: `Token #${token.tokenNumber} (${token.customerName}) was cancelled`,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Token #${cancelledToken.tokenNumber} cancelled successfully`,
      token: cancelledToken,
    });
  } catch (error) {
    next(error);
  }
};

// MANDATORY REQUIREMENT: Reorder tokens (Move UP / DOWN & Persist in PostgreSQL)
export const moveToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { direction } = moveTokenSchema.parse(req.body);

    const token = await prisma.token.findFirst({
      where: { id },
      include: { queue: true },
    });

    if (!token || token.queue.userId !== userId) {
      res.status(404).json({
        success: false,
        message: 'Token not found or unauthorized',
      });
      return;
    }

    if (token.status !== 'WAITING') {
      res.status(400).json({
        success: false,
        message: 'Only waiting tokens can be reordered in the queue.',
      });
      return;
    }

    const currentPosition = token.position;

    // Total waiting tokens
    const totalWaiting = await prisma.token.count({
      where: { queueId: token.queueId, status: 'WAITING' },
    });

    if (direction === 'UP') {
      if (currentPosition <= 1) {
        res.status(400).json({
          success: false,
          message: 'Customer is already at the front of the queue (Position 1). Cannot move up.',
        });
        return;
      }

      // Find token right above this one
      const targetToken = await prisma.token.findFirst({
        where: {
          queueId: token.queueId,
          status: 'WAITING',
          position: currentPosition - 1,
        },
      });

      if (!targetToken) {
        // Fallback: repair positions sequentially
        await repairQueuePositions(token.queueId);
        res.status(400).json({
          success: false,
          message: 'Positions were re-synchronized. Please try again.',
        });
        return;
      }

      // Swap positions in transaction (use temporary -1 to avoid unique constraint if any)
      await prisma.$transaction([
        prisma.token.update({
          where: { id: token.id },
          data: { position: -999 },
        }),
        prisma.token.update({
          where: { id: targetToken.id },
          data: { position: currentPosition },
        }),
        prisma.token.update({
          where: { id: token.id },
          data: { position: currentPosition - 1 },
        }),
        prisma.activityLog.create({
          data: {
            userId,
            queueId: token.queueId,
            action: 'TOKENS_REORDERED',
            details: `Moved Token #${token.tokenNumber} up to position ${currentPosition - 1}`,
          },
        }),
      ]);
    } else {
      // Direction: DOWN
      if (currentPosition >= totalWaiting) {
        res.status(400).json({
          success: false,
          message: 'Customer is already at the end of the queue. Cannot move down.',
        });
        return;
      }

      // Find token right below this one
      const targetToken = await prisma.token.findFirst({
        where: {
          queueId: token.queueId,
          status: 'WAITING',
          position: currentPosition + 1,
        },
      });

      if (!targetToken) {
        await repairQueuePositions(token.queueId);
        res.status(400).json({
          success: false,
          message: 'Positions were re-synchronized. Please try again.',
        });
        return;
      }

      // Swap positions in transaction
      await prisma.$transaction([
        prisma.token.update({
          where: { id: token.id },
          data: { position: -999 },
        }),
        prisma.token.update({
          where: { id: targetToken.id },
          data: { position: currentPosition },
        }),
        prisma.token.update({
          where: { id: token.id },
          data: { position: currentPosition + 1 },
        }),
        prisma.activityLog.create({
          data: {
            userId,
            queueId: token.queueId,
            action: 'TOKENS_REORDERED',
            details: `Moved Token #${token.tokenNumber} down to position ${currentPosition + 1}`,
          },
        }),
      ]);
    }

    // Fetch refreshed waiting tokens
    const refreshedTokens = await prisma.token.findMany({
      where: { queueId: token.queueId, status: 'WAITING' },
      orderBy: { position: 'asc' },
    });

    res.status(200).json({
      success: true,
      message: `Token #${token.tokenNumber} moved ${direction.toLowerCase()} successfully`,
      tokens: refreshedTokens,
    });
  } catch (error) {
    next(error);
  }
};

// Batch reorder endpoint (e.g. for drag-and-drop or explicit sequence update)
export const batchReorderTokens = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { queueId, orderedTokenIds } = reorderSchema.parse(req.body);

    const queue = await prisma.queue.findFirst({
      where: { id: queueId, userId },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    // Verify all IDs belong to this queue and are WAITING
    const tokens = await prisma.token.findMany({
      where: {
        id: { in: orderedTokenIds },
        queueId,
        status: 'WAITING',
      },
    });

    if (tokens.length !== orderedTokenIds.length) {
      res.status(400).json({
        success: false,
        message: 'Invalid list of token IDs provided for reordering',
      });
      return;
    }

    // Update positions sequentially
    const updateOperations = orderedTokenIds.map((id, index) =>
      prisma.token.update({
        where: { id },
        data: { position: index + 1 },
      })
    );

    await prisma.$transaction([
      ...updateOperations,
      prisma.activityLog.create({
        data: {
          userId,
          queueId,
          action: 'TOKENS_REORDERED',
          details: `Reordered ${orderedTokenIds.length} waiting tokens`,
        },
      }),
    ]);

    const updatedTokens = await prisma.token.findMany({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'asc' },
    });

    res.status(200).json({
      success: true,
      message: 'Tokens reordered successfully',
      tokens: updatedTokens,
    });
  } catch (error) {
    next(error);
  }
};

export const getTokenHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { queueId } = req.params;
    const userId = req.user!.id;
    const status = req.query.status as string | undefined;

    const queue = await prisma.queue.findFirst({
      where: { id: queueId, userId },
    });

    if (!queue) {
      res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
      return;
    }

    const whereClause: any = {
      queueId,
      status: status ? status : { in: ['COMPLETED', 'CANCELLED', 'SERVING', 'WAITING'] },
    };

    const tokens = await prisma.token.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    res.status(200).json({
      success: true,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to repair sequence numbers if needed
async function repairQueuePositions(queueId: string) {
  const waiting = await prisma.token.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

  for (let i = 0; i < waiting.length; i++) {
    await prisma.token.update({
      where: { id: waiting[i].id },
      data: { position: i + 1 },
    });
  }
}

