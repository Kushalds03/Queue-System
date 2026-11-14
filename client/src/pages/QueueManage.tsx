import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Queue, Token } from '../types/index.js';
import { queueApi, tokenApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { ServingBanner } from '../components/queue/ServingBanner.js';
import { WaitingList } from '../components/queue/WaitingList.js';
import { AddCustomerModal } from '../components/queue/AddCustomerModal.js';
import { TokenHistoryModal } from '../components/queue/TokenHistoryModal.js';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  UserPlus,
  History,
  PhoneCall,
  Pause,
  Play,
  RotateCw,
  Users,
  AlertCircle,
} from 'lucide-react';

export const QueueManage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [queue, setQueue] = useState<Queue | null>(null);
  const [servingToken, setServingToken] = useState<Token | null>(null);
  const [waitingTokens, setWaitingTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Action States
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [movingTokenId, setMovingTokenId] = useState<string | null>(null);
  const [cancellingTokenId, setCancellingTokenId] = useState<string | null>(null);

  // Sound toggle (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('queueflow_sound') !== 'false';
  });

  // Synthesized audio chime for Calling Next Customer
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      // Ding-dong chime frequencies: 587.33Hz (D5) -> 880Hz (A5)
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  }, [soundEnabled]);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('queueflow_sound', String(nextVal));
    if (nextVal) {
      info('Sound notifications enabled');
      playChime();
    } else {
      info('Sound notifications muted');
    }
  };

  // Fetch full queue details
  const fetchQueueData = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await queueApi.getQueueById(id);
      if (res.success && res.queue) {
        setQueue(res.queue);
        setServingToken((res.queue as any).servingToken || null);
        setWaitingTokens((res.queue as any).waitingTokens || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load queue details');
      navigate('/queues');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [id, error, navigate]);

  useEffect(() => {
    fetchQueueData();

    // Auto-refresh every 6 seconds to keep multi-tab / customer displays synchronized
    const interval = setInterval(() => {
      fetchQueueData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchQueueData]);

  // MANDATORY REQUIREMENT: Prominent Call Next button
  const handleCallNext = async () => {
    if (!id) return;

    if (queue?.status === 'PAUSED') {
      error('Queue is currently paused. Please resume the queue before calling customers.');
      return;
    }

    if (servingToken) {
      error(
        `Token #${servingToken.tokenNumber} is currently at the counter. Please complete or cancel their service before calling the next customer.`
      );
      return;
    }

    if (waitingTokens.length === 0) {
      info('There are no customers currently waiting in the queue.');
      return;
    }

    try {
      setIsCallingNext(true);
      const res = await tokenApi.callNext(id);
      if (res.success && res.servingToken) {
        playChime();
        success(res.message || `Now serving Token #${res.servingToken.tokenNumber}!`);
        await fetchQueueData(true);
      }
    } catch (err: any) {
      error(err.message || 'Failed to call next customer');
    } finally {
      setIsCallingNext(false);
    }
  };

  // Complete Service
  const handleCompleteService = async (tokenId: string) => {
    try {
      setIsCompleting(true);
      const res = await tokenApi.completeService(tokenId);
      success(res.message || 'Service completed successfully!');
      await fetchQueueData(true);
    } catch (err: any) {
      error(err.message || 'Failed to complete service');
    } finally {
      setIsCompleting(false);
    }
  };

  // Cancel Currently Serving Customer
  const handleCancelServing = async (tokenId: string) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel the customer currently being served?'
    );
    if (!confirmCancel) return;

    try {
      setIsCancelling(true);
      const res = await tokenApi.cancelToken(tokenId);
      success(res.message || 'Service cancelled.');
      await fetchQueueData(true);
    } catch (err: any) {
      error(err.message || 'Failed to cancel service');
    } finally {
      setIsCancelling(false);
    }
  };

  // Cancel Waiting Customer
  const handleCancelWaitingToken = async (tokenId: string) => {
    try {
      setCancellingTokenId(tokenId);
      const res = await tokenApi.cancelToken(tokenId);
      success(res.message || 'Customer removed from queue.');
      await fetchQueueData(true);
    } catch (err: any) {
      error(err.message || 'Failed to cancel token');
    } finally {
      setCancellingTokenId(null);
    }
  };

  // MANDATORY REQUIREMENT: Move Token UP or DOWN
  const handleMoveToken = async (tokenId: string, direction: 'UP' | 'DOWN') => {
    try {
      setMovingTokenId(tokenId);
      const res = await tokenApi.moveToken(tokenId, direction);
      if (res.success && res.tokens) {
        setWaitingTokens(res.tokens);
        success(res.message || `Token position adjusted`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to reorder token');
      await fetchQueueData(true);
    } finally {
      setMovingTokenId(null);
    }
  };

  // Add Customer Submit
  const handleAddCustomerSubmit = async (data: {
    customerName: string;
    customerPhone?: string;
    notes?: string;
  }) => {
    if (!id) return;
    try {
      const res = await tokenApi.createToken({
        queueId: id,
        ...data,
      });
      success(res.message || 'Token issued successfully!');
      setIsAddCustomerOpen(false);
      await fetchQueueData(true);
    } catch (err: any) {
      error(err.message || 'Failed to issue token');
    }
  };

  // Pause / Resume Toggle
  const handleToggleStatus = async () => {
    if (!id) return;
    try {
      const res = await queueApi.toggleQueueStatus(id);
      success(res.message || 'Queue status updated');
      await fetchQueueData(true);
    } catch (err: any) {
      error(err.message || 'Failed to toggle status');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-md border border-border p-12 text-center text-xs text-charcoal-500">
        Loading queue console...
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="bg-white rounded-md border border-border p-12 text-center">
        <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
        <h3 className="text-sm font-bold text-charcoal-900">Queue Not Found</h3>
        <Link to="/queues" className="mt-3 inline-block">
          <Button variant="secondary" size="sm">
            Back to My Queues
          </Button>
        </Link>
      </div>
    );
  }

  const isPaused = queue.status === 'PAUSED';
  const hasWaiting = waitingTokens.length > 0;
  const isServing = !!servingToken;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            to="/queues"
            className="p-1.5 text-charcoal-600 hover:text-charcoal-900 hover:bg-white rounded border border-border transition-colors shadow-subtle"
            title="Back to all queues"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded bg-charcoal-900 text-white font-mono font-bold text-sm flex items-center justify-center shadow-subtle">
                {queue.prefix}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight">
                {queue.name}
              </h1>
              <Badge status={queue.status} />
            </div>
            {queue.description && (
              <p className="text-xs text-charcoal-500 mt-1 max-w-xl">{queue.description}</p>
            )}
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Notification Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle ${
              soundEnabled
                ? 'bg-white text-charcoal-800 border-border hover:bg-canvas-subtle'
                : 'bg-canvas-subtle text-charcoal-400 border-border line-through'
            }`}
            title={soundEnabled ? 'Mute sound notifications' : 'Enable sound notifications'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-coral-500" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>

          {/* Pause / Resume Queue */}
          <button
            onClick={handleToggleStatus}
            className={`px-3 py-2 rounded border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle ${
              isPaused
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-white text-charcoal-700 border-border hover:bg-canvas-subtle'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-charcoal-500" />}
            {isPaused ? 'Resume Intake' : 'Pause Intake'}
          </button>

          {/* Token History */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            leftIcon={<History className="w-4 h-4 text-charcoal-500" />}
          >
            History
          </Button>

          {/* Add Customer Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddCustomerOpen(true)}
            disabled={isPaused}
            leftIcon={<UserPlus className="w-4 h-4 text-coral-500" />}
          >
            Add Customer
          </Button>

          {/* Refresh button */}
          <button
            onClick={() => fetchQueueData(true)}
            className="p-2 text-charcoal-500 hover:text-charcoal-800 hover:bg-white rounded border border-border shadow-subtle transition-colors"
            title="Refresh queue now"
            aria-label="Refresh queue"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Paused Queue Notice */}
      {isPaused && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-md p-4 flex items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              This queue is currently <strong>PAUSED</strong>. New customers cannot join until you resume intake.
            </span>
          </div>
          <button
            onClick={handleToggleStatus}
            className="font-bold underline text-amber-900 hover:text-amber-950"
          >
            Resume Now
          </button>
        </div>
      )}

      {/* Section 1: Prominent Currently Serving Banner */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
            Counter Desk Status
          </h2>
          {isServing && (
            <span className="text-xs text-coral-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-coral-500 animate-ping"></span>
              Active Customer
            </span>
          )}
        </div>

        <ServingBanner
          token={servingToken}
          onComplete={handleCompleteService}
          onCancel={handleCancelServing}
          isCompleting={isCompleting}
          isCancelling={isCancelling}
        />
      </section>

      {/* Section 2: Prominent Call Next Customer Action Bar */}
      <section className="bg-white rounded-md border border-border p-5 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-coral-50 border border-coral-200/80 flex items-center justify-center text-coral-600 flex-shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal-900">
              Counter Service Dispatch
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              {hasWaiting ? (
                <span>
                  Next customer in line:{' '}
                  <strong className="text-charcoal-900 font-mono">
                    Token #{waitingTokens[0].tokenNumber} ({waitingTokens[0].customerName})
                  </strong>
                </span>
              ) : (
                <span>No customers currently in waiting line</span>
              )}
            </p>
          </div>
        </div>

        {/* The Core "Call Next" Button */}
        <div className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCallNext}
            isLoading={isCallingNext}
            disabled={isPaused || isServing || !hasWaiting}
            leftIcon={<PhoneCall className="w-5 h-5" />}
            className="w-full sm:w-auto px-6 py-3 font-bold text-sm tracking-wide uppercase shadow-elevated"
            title={
              isServing
                ? 'Finish currently serving customer first'
                : !hasWaiting
                ? 'No customers in line'
                : 'Call first waiting customer to the counter'
            }
          >
            Call Next Customer
          </Button>
        </div>
      </section>

      {/* Section 3: Waiting Customer Queue */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-charcoal-900">Waiting Customers</h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-charcoal-100 text-charcoal-800 border border-border">
              {waitingTokens.length}
            </span>
          </div>

          <span className="text-xs text-charcoal-500 hidden sm:inline">
            Use ▲ ▼ buttons to prioritize or reorder waiting customers
          </span>
        </div>

        <WaitingList
          tokens={waitingTokens}
          onMoveToken={handleMoveToken}
          onCancelToken={handleCancelWaitingToken}
          movingTokenId={movingTokenId}
          cancellingTokenId={cancellingTokenId}
        />
      </section>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSubmit={handleAddCustomerSubmit}
        queueName={queue.name}
        prefix={queue.prefix}
      />

      {/* History Modal */}
      <TokenHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        queueId={queue.id}
        queueName={queue.name}
      />
    </div>
  );
};

