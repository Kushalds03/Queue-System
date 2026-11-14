import { Response, NextFunction } from 'express';
import prisma from '../db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const rawQueueId = req.query.queueId;
    const queueId = typeof rawQueueId === 'string' && rawQueueId !== 'ALL' ? rawQueueId : undefined;

    // Build queue filter ensuring ownership
    let queueFilter: { userId: string; id?: string } = { userId };
    if (queueId) {
      // Validate that this queue belongs to user
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
      queueFilter = { userId, id: queueId };
    }

    // Get all queue IDs belonging to this user (filtered if queueId specified)
    const userQueues = await prisma.queue.findMany({
      where: queueFilter,
      select: { id: true, name: true, prefix: true, status: true },
    });

    const queueIds = userQueues.map((q) => q.id);

    if (queueIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalServed: 0,
            currentWaiting: 0,
            currentlyServing: 0,
            totalCancelled: 0,
            totalCreated: 0,
            queueLength: 0,
            avgWaitTimeSeconds: 0,
            formattedAvgWaitTime: '0m',
            avgServiceDurationSeconds: 0,
            formattedAvgServiceDuration: '0m',
          },
          statusDistribution: [],
          dailyTrends: [],
          recentActivity: [],
          queuesList: [],
        },
      });
      return;
    }

    const tokenWhere = {
      queueId: { in: queueIds },
    };

    // 1. Fetch counts by status
    const [
      waitingCount,
      servingCount,
      completedCount,
      cancelledCount,
      totalCount,
    ] = await Promise.all([
      prisma.token.count({ where: { ...tokenWhere, status: 'WAITING' } }),
      prisma.token.count({ where: { ...tokenWhere, status: 'SERVING' } }),
      prisma.token.count({ where: { ...tokenWhere, status: 'COMPLETED' } }),
      prisma.token.count({ where: { ...tokenWhere, status: 'CANCELLED' } }),
      prisma.token.count({ where: tokenWhere }),
    ]);

    // 2. Calculate Average Waiting Time (from creation to service start)
    // Query tokens that have both servedAt and createdAt
    const servedTokens = await prisma.token.findMany({
      where: {
        ...tokenWhere,
        servedAt: { not: null },
      },
      select: {
        createdAt: true,
        servedAt: true,
      },
    });

    let totalWaitSeconds = 0;
    servedTokens.forEach((t) => {
      if (t.servedAt && t.createdAt) {
        const diffMs = t.servedAt.getTime() - t.createdAt.getTime();
        if (diffMs > 0) {
          totalWaitSeconds += Math.floor(diffMs / 1000);
        }
      }
    });

    const avgWaitTimeSeconds =
      servedTokens.length > 0 ? Math.round(totalWaitSeconds / servedTokens.length) : 0;

    // 3. Calculate Average Service Duration (from service start to completion)
    const completedTokens = await prisma.token.findMany({
      where: {
        ...tokenWhere,
        status: 'COMPLETED',
        servedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        servedAt: true,
        completedAt: true,
      },
    });

    let totalServiceSeconds = 0;
    completedTokens.forEach((t) => {
      if (t.completedAt && t.servedAt) {
        const diffMs = t.completedAt.getTime() - t.servedAt.getTime();
        if (diffMs > 0) {
          totalServiceSeconds += Math.floor(diffMs / 1000);
        }
      }
    });

    const avgServiceDurationSeconds =
      completedTokens.length > 0
        ? Math.round(totalServiceSeconds / completedTokens.length)
        : 0;

    // Format seconds into clean human-readable strings (e.g. "4m 12s" or "32s")
    const formatDuration = (sec: number) => {
      if (sec <= 0) return '0s';
      const mins = Math.floor(sec / 60);
      const remainingSecs = sec % 60;
      if (mins === 0) return `${remainingSecs}s`;
      if (remainingSecs === 0) return `${mins}m`;
      return `${mins}m ${remainingSecs}s`;
    };

    // 4. Token Status Distribution (for Recharts Pie / Donut)
    const statusDistribution = [
      { name: 'Completed', value: completedCount, color: '#2D8A56' },
      { name: 'Waiting', value: waitingCount, color: '#E05A47' },
      { name: 'Serving', value: servingCount, color: '#2575A7' },
      { name: 'Cancelled', value: cancelledCount, color: '#8A929A' },
    ];

    // 5. Daily Queue Activity Trends (last 7 days from actual records)
    const daysToShow = 7;
    const now = new Date();
    const dailyTrendsMap: Record<
      string,
      { date: string; displayDate: string; created: number; served: number; cancelled: number }
    > = {};

    // Initialize 7 calendar days up to today
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      dailyTrendsMap[isoKey] = {
        date: isoKey,
        displayDate,
        created: 0,
        served: 0,
        cancelled: 0,
      };
    }

    // Query tokens in this date window
    const earliestDate = new Date(now);
    earliestDate.setDate(earliestDate.getDate() - (daysToShow - 1));
    earliestDate.setHours(0, 0, 0, 0);

    const periodTokens = await prisma.token.findMany({
      where: {
        ...tokenWhere,
        createdAt: { gte: earliestDate },
      },
      select: {
        status: true,
        createdAt: true,
        completedAt: true,
        cancelledAt: true,
      },
    });

    periodTokens.forEach((t) => {
      const createdKey = t.createdAt.toISOString().split('T')[0];
      if (dailyTrendsMap[createdKey]) {
        dailyTrendsMap[createdKey].created += 1;
      }
      if (t.completedAt) {
        const completedKey = t.completedAt.toISOString().split('T')[0];
        if (dailyTrendsMap[completedKey]) {
          dailyTrendsMap[completedKey].served += 1;
        }
      }
      if (t.cancelledAt) {
        const cancelledKey = t.cancelledAt.toISOString().split('T')[0];
        if (dailyTrendsMap[cancelledKey]) {
          dailyTrendsMap[cancelledKey].cancelled += 1;
        }
      }
    });

    const dailyTrends = Object.values(dailyTrendsMap);

    // 6. Recent Activity Log for this user/queue
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        userId,
        ...(queueId ? { queueId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        queue: {
          select: { name: true, prefix: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalServed: completedCount,
          currentWaiting: waitingCount,
          currentlyServing: servingCount,
          totalCancelled: cancelledCount,
          totalCreated: totalCount,
          queueLength: waitingCount + servingCount,
          avgWaitTimeSeconds,
          formattedAvgWaitTime: formatDuration(avgWaitTimeSeconds),
          avgServiceDurationSeconds,
          formattedAvgServiceDuration: formatDuration(avgServiceDurationSeconds),
        },
        statusDistribution,
        dailyTrends,
        recentActivity,
        queuesList: userQueues,
      },
    });
  } catch (error) {
    next(error);
  }
};
