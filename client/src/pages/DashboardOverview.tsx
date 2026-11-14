import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Queue, AnalyticsData } from '../types/index.js';
import { queueApi, analyticsApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
import {
  Users,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [queuesRes, analyticsRes] = await Promise.all([
        queueApi.getQueues(),
        analyticsApi.getAnalytics('ALL'),
      ]);

      if (queuesRes.success && queuesRes.queues) {
        setQueues(queuesRes.queues);
      }
      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 15 seconds to keep queue counts fresh
    const interval = setInterval(fetchData, 15000);
    const handleQueueCreated = () => fetchData();
    window.addEventListener('queue:created', handleQueueCreated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('queue:created', handleQueueCreated);
    };
  }, [fetchData]);

  const metrics = analytics?.metrics || {
    totalServed: 0,
    currentWaiting: 0,
    currentlyServing: 0,
    totalCancelled: 0,
    queueLength: 0,
    formattedAvgWaitTime: '0s',
    formattedAvgServiceDuration: '0s',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-md border border-border p-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight">
            Welcome back, {user?.name || 'Manager'}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            {user?.organization
              ? `Real-time status for ${user.organization}`
              : 'Real-time queue operations and service status'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/queues">
            <Button variant="secondary" size="sm">
              View All Queues
            </Button>
          </Link>
          <Link to="/analytics">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Full Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Served */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
              Total Served
            </span>
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-mono">
              {metrics.totalServed}
            </span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            Completed customer sessions
          </p>
        </Card>

        {/* Current Waiting */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
              Waiting in Line
            </span>
            <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-mono">
              {metrics.currentWaiting}
            </span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">
            Across {queues.filter((q) => q.status === 'ACTIVE').length} active queues
          </p>
        </Card>

        {/* Average Wait Time */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
              Avg Wait Time
            </span>
            <div className="w-8 h-8 rounded bg-coral-50 text-coral-600 border border-coral-200/60 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-mono">
              {metrics.formattedAvgWaitTime}
            </span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">From token issue to service call</p>
        </Card>

        {/* Avg Service Duration */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
              Avg Service Time
            </span>
            <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-mono">
              {metrics.formattedAvgServiceDuration}
            </span>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">Duration spent at counter</p>
        </Card>
      </div>

      {/* Live Queues Overview Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-charcoal-900">Live Queues Status</h2>
            <p className="text-xs text-charcoal-500">
              Active queues ready for customer intake and calling
            </p>
          </div>
          <Link
            to="/queues"
            className="text-xs font-semibold text-coral-600 hover:text-coral-700 flex items-center gap-1"
          >
            Manage All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-md border border-border p-8 text-center text-xs text-charcoal-500">
            Loading queues...
          </div>
        ) : queues.length === 0 ? (
          <div className="bg-white rounded-md border border-dashed border-border p-8 text-center">
            <Layers className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-charcoal-800">No queues created yet</p>
            <p className="text-xs text-charcoal-500 mt-1">
              Create your first queue to start generating tokens and serving customers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queues.map((q) => (
              <Card key={q.id} hoverEffect className="p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded bg-canvas-subtle border border-border font-mono font-bold text-xs flex items-center justify-center text-charcoal-800">
                        {q.prefix}
                      </span>
                      <h3 className="font-bold text-sm text-charcoal-900">{q.name}</h3>
                    </div>
                    <Badge status={q.status} />
                  </div>

                  {q.description && (
                    <p className="text-xs text-charcoal-500 mt-2 line-clamp-2">
                      {q.description}
                    </p>
                  )}
                </div>

                {/* Queue snapshot metrics */}
                <div className="bg-canvas-subtle p-3 rounded border border-border/70 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">
                      Waiting
                    </span>
                    <span className="font-mono font-bold text-charcoal-900 text-sm">
                      {q.waitingCount || 0}
                    </span>
                  </div>

                  <div className="border-l border-border pl-3">
                    <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">
                      Currently Serving
                    </span>
                    {q.servingToken ? (
                      <span className="font-mono font-bold text-coral-600 text-sm">
                        {q.servingToken.tokenNumber}
                      </span>
                    ) : (
                      <span className="text-charcoal-400 italic text-[11px]">Idle</span>
                    )}
                  </div>
                </div>

                <Link to={`/queues/${q.id}`} className="w-full">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Open Queue Console
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
      {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-coral-500" />
              Recent Operations Log
            </h3>
            <span className="text-[11px] text-charcoal-500">Live operational events</span>
          </div>

          <div className="divide-y divide-border/60 mt-2">
            {analytics.recentActivity.slice(0, 5).map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-500"></span>
                  <span className="font-medium text-charcoal-800">{act.details || act.action}</span>
                </div>
                <span className="text-charcoal-400 font-mono text-[11px]">
                  {new Date(act.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

