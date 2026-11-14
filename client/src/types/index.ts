export type TokenStatus = 'WAITING' | 'SERVING' | 'COMPLETED' | 'CANCELLED';
export type QueueStatus = 'ACTIVE' | 'PAUSED';

export interface User {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  createdAt: string;
}

export interface Queue {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  prefix: string;
  status: QueueStatus;
  createdAt: string;
  updatedAt: string;
  waitingCount?: number;
  completedCount?: number;
  cancelledCount?: number;
  totalTokens?: number;
  servingToken?: {
    id: string;
    tokenNumber: string;
    customerName: string;
    servedAt: string;
  } | null;
  waitingTokens?: Token[];
}

export interface Token {
  id: string;
  queueId: string;
  tokenNumber: string;
  sequenceNumber: number;
  customerName: string;
  customerPhone: string | null;
  notes: string | null;
  status: TokenStatus;
  position: number;
  createdAt: string;
  servedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  queue?: {
    name: string;
    prefix: string;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  queueId: string | null;
  action: string;
  details: string | null;
  createdAt: string;
  queue?: {
    name: string;
    prefix: string;
  } | null;
}

export interface AnalyticsMetrics {
  totalServed: number;
  currentWaiting: number;
  currentlyServing: number;
  totalCancelled: number;
  totalCreated: number;
  queueLength: number;
  avgWaitTimeSeconds: number;
  formattedAvgWaitTime: string;
  avgServiceDurationSeconds: number;
  formattedAvgServiceDuration: string;
}

export interface DailyTrend {
  date: string;
  displayDate: string;
  created: number;
  served: number;
  cancelled: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  statusDistribution: StatusDistribution[];
  dailyTrends: DailyTrend[];
  recentActivity: ActivityLog[];
  queuesList: { id: string; name: string; prefix: string; status: QueueStatus }[];
}
