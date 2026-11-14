import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsData } from '../types/index.js';
import { analyticsApi } from '../services/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  Users,
  Clock,
  Activity,
  XCircle,
  Layers,
  RotateCw,
  TrendingUp,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [selectedQueueId, setSelectedQueueId] = useState<string>('ALL');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await analyticsApi.getAnalytics(selectedQueueId);
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedQueueId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const metrics = analytics?.metrics || {
    totalServed: 0,
    currentWaiting: 0,
    currentlyServing: 0,
    totalCancelled: 0,
    totalCreated: 0,
    queueLength: 0,
    avgWaitTimeSeconds: 0,
    formattedAvgWaitTime: '0s',
    avgServiceDurationSeconds: 0,
    formattedAvgServiceDuration: '0s',
  };

  const statusData = analytics?.statusDistribution || [];
  const dailyTrends = analytics?.dailyTrends || [];
  const queuesList = analytics?.queuesList || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Queue Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight">
            Analytics & Queue Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Real-time calculations computed directly from verified database records
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Queue Filter Dropdown */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-xs font-semibold text-charcoal-500 hidden sm:inline">
              Filter:
            </span>
            <select
              value={selectedQueueId}
              onChange={(e) => setSelectedQueueId(e.target.value)}
              className="bg-white border border-border text-charcoal-900 text-xs font-medium rounded px-3 py-2 focus:outline-none focus:border-coral-500 shadow-subtle cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Queues Combined</option>
              {queuesList.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name} ({q.prefix}-series)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 text-charcoal-500 hover:text-charcoal-800 hover:bg-white rounded border border-border shadow-subtle transition-colors"
            title="Refresh analytics data"
            aria-label="Refresh analytics"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Key Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Customers Served */}
        <Card className="p-4">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
            Total Served
          </span>
          <span className="text-2xl font-extrabold text-charcoal-900 font-mono block mt-1">
            {metrics.totalServed}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        </Card>

        {/* Current Waiting */}
        <Card className="p-4">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
            Waiting Count
          </span>
          <span className="text-2xl font-extrabold text-charcoal-900 font-mono block mt-1">
            {metrics.currentWaiting}
          </span>
          <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-1">
            <Users className="w-3 h-3" />
            In line now
          </span>
        </Card>

        {/* Queue Length */}
        <Card className="p-4">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
            Queue Length
          </span>
          <span className="text-2xl font-extrabold text-charcoal-900 font-mono block mt-1">
            {metrics.queueLength}
          </span>
          <span className="text-[10px] text-charcoal-500 font-medium flex items-center gap-1 mt-1">
            <Layers className="w-3 h-3" />
            Waiting + Serving
          </span>
        </Card>

        {/* Average Waiting Time */}
        <Card className="p-4">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
            Avg Wait Time
          </span>
          <span className="text-2xl font-extrabold text-coral-600 font-mono block mt-1">
            {metrics.formattedAvgWaitTime}
          </span>
          <span className="text-[10px] text-charcoal-500 font-medium flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            Creation to call
          </span>
        </Card>

        {/* Average Service Duration */}
        <Card className="p-4">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
            Avg Service Time
          </span>
          <span className="text-2xl font-extrabold text-charcoal-900 font-mono block mt-1">
            {metrics.formattedAvgServiceDuration}
          </span>
          <span className="text-[10px] text-charcoal-500 font-medium flex items-center gap-1 mt-1">
            <Activity className="w-3 h-3" />
            At counter
          </span>
        </Card>

        {/* Cancelled Tokens */}
        <Card className="p-4">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
            Cancelled
          </span>
          <span className="text-2xl font-extrabold text-charcoal-600 font-mono block mt-1">
            {metrics.totalCancelled}
          </span>
          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
            <XCircle className="w-3 h-3" />
            Abandons / cancellations
          </span>
        </Card>
      </div>

      {/* Charts Section: Daily Activity Trends & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Queue Activity Trends (2 columns) */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-coral-500" />
                Daily Queue Activity Trends (Past 7 Days)
              </h3>
              <p className="text-[11px] text-charcoal-500">
                Number of tokens created, served, and cancelled per day
              </p>
            </div>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D8" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#687077' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E0D8' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#687077' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E0D8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E0D8',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar dataKey="created" name="Tokens Created" fill="#E05A47" radius={[4, 4, 0, 0]} />
                <Bar dataKey="served" name="Customers Served" fill="#2D8A56" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#8A929A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Token Status Distribution (1 column) */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-coral-500" />
                Token Status Distribution
              </h3>
              <p className="text-[11px] text-charcoal-500">
                Breakdown of all tickets in selected scope
              </p>
            </div>
          </div>

          <div className="h-72 mt-2 flex flex-col items-center justify-center">
            {metrics.totalCreated === 0 ? (
              <div className="text-center text-xs text-charcoal-400">
                No tokens available to display distribution.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E0D8',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Operational Efficiency Insights */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-charcoal-900 mb-2">Service Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-charcoal-700">
          <div className="p-3 bg-canvas-subtle rounded border border-border">
            <span className="font-bold block text-charcoal-900 mb-0.5">Throughput Rate</span>
            <span>
              {metrics.totalCreated > 0
                ? `${Math.round((metrics.totalServed / metrics.totalCreated) * 100)}% of issued tokens completed service successfully.`
                : 'No intake data recorded yet.'}
            </span>
          </div>

          <div className="p-3 bg-canvas-subtle rounded border border-border">
            <span className="font-bold block text-charcoal-900 mb-0.5">Abandonment / Cancel Rate</span>
            <span>
              {metrics.totalCreated > 0
                ? `${Math.round((metrics.totalCancelled / metrics.totalCreated) * 100)}% cancellation rate observed.`
                : 'Zero cancellations recorded.'}
            </span>
          </div>

          <div className="p-3 bg-canvas-subtle rounded border border-border">
            <span className="font-bold block text-charcoal-900 mb-0.5">Average Turnaround</span>
            <span>
              A typical customer spends{' '}
              <strong>
                {metrics.formattedAvgWaitTime} waiting + {metrics.formattedAvgServiceDuration} at counter
              </strong>
              .
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
