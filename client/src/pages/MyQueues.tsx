import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Queue } from '../types/index.js';
import { queueApi, tokenApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Card } from '../components/common/Card.js';
import { QueueFormModal } from '../components/queue/QueueFormModal.js';
import { AddCustomerModal } from '../components/queue/AddCustomerModal.js';
import {
  Layers,
  PlusCircle,
  Pause,
  Play,
  Edit2,
  Trash2,
  ArrowRight,
  UserPlus,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';

export const MyQueues: React.FC = () => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [customerModalQueue, setCustomerModalQueue] = useState<Queue | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { success, error } = useToast();

  const fetchQueues = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await queueApi.getQueues();
      if (res.success && res.queues) {
        setQueues(res.queues);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load queues');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  // Create or Update Queue
  const handleSaveQueue = async (data: { name: string; description?: string; prefix: string }) => {
    try {
      setIsActionLoading(true);
      if (editingQueue) {
        await queueApi.updateQueue(editingQueue.id, data);
        success(`Queue "${data.name}" updated successfully`);
        setEditingQueue(null);
      } else {
        await queueApi.createQueue(data);
        success(`Queue "${data.name}" created successfully`);
        setCreateModalOpen(false);
      }
      fetchQueues();
    } catch (err: any) {
      error(err.message || 'Failed to save queue');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle status (ACTIVE <-> PAUSED)
  const handleToggleStatus = async (queue: Queue) => {
    try {
      const res = await queueApi.toggleQueueStatus(queue.id);
      success(res.message || 'Queue status updated');
      fetchQueues();
    } catch (err: any) {
      error(err.message || 'Failed to toggle queue status');
    }
  };

  // Delete Queue
  const handleDeleteQueue = async (queue: Queue) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${queue.name}"? All associated tokens and queue history will be permanently deleted.`
    );
    if (!confirmDelete) return;

    try {
      await queueApi.deleteQueue(queue.id);
      success(`Queue "${queue.name}" deleted successfully`);
      fetchQueues();
    } catch (err: any) {
      error(err.message || 'Failed to delete queue');
    }
  };

  // Add Customer directly from MyQueues
  const handleAddCustomer = async (data: { customerName: string; customerPhone?: string; notes?: string }) => {
    if (!customerModalQueue) return;
    try {
      setIsActionLoading(true);
      const res = await tokenApi.createToken({
        queueId: customerModalQueue.id,
        ...data,
      });
      success(res.message || 'Token generated successfully');
      setCustomerModalQueue(null);
      fetchQueues();
    } catch (err: any) {
      error(err.message || 'Failed to add customer');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight">
            My Queues
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
            Configure, monitor and control all service desks and waiting lines
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Create New Queue
        </Button>
      </div>

      {/* Queues List */}
      {isLoading ? (
        <div className="bg-white rounded-md border border-border p-12 text-center text-xs text-charcoal-500">
          Loading queues...
        </div>
      ) : queues.length === 0 ? (
        <div className="bg-white rounded-md border border-dashed border-border p-12 text-center shadow-subtle">
          <Layers className="w-10 h-10 text-charcoal-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-charcoal-800">No Service Queues Found</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto mt-1 mb-4">
            You haven't set up any service queues yet. Create a queue to begin managing customer waitlists.
          </p>
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Create First Queue
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queues.map((queue) => {
            const isPaused = queue.status === 'PAUSED';

            return (
              <Card
                key={queue.id}
                className={`p-6 flex flex-col justify-between transition-all ${
                  isPaused ? 'bg-canvas-subtle/50 opacity-90' : 'bg-white'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-charcoal-900 text-white font-mono font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-subtle">
                        {queue.prefix}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-charcoal-900">{queue.name}</h3>
                        <p className="text-[11px] text-charcoal-500 font-mono">
                          Token format: {queue.prefix}-XXX
                        </p>
                      </div>
                    </div>

                    <Badge status={queue.status} />
                  </div>

                  {queue.description && (
                    <p className="text-xs text-charcoal-600 mt-3">{queue.description}</p>
                  )}

                  {/* Operational Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded bg-canvas-subtle border border-border/80 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                        Waiting
                      </span>
                      <span className="text-lg font-bold font-mono text-charcoal-900">
                        {queue.waitingCount || 0}
                      </span>
                    </div>

                    <div className="border-x border-border">
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                        Serving
                      </span>
                      {queue.servingToken ? (
                        <span className="text-base font-bold font-mono text-coral-600 truncate block">
                          {queue.servingToken.tokenNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-charcoal-400 italic block mt-1">Idle</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
                        Served
                      </span>
                      <span className="text-lg font-bold font-mono text-emerald-700">
                        {queue.completedCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-5 mt-5 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Status Toggle & Edit/Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(queue)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
                        isPaused
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                      title={isPaused ? 'Resume queue operations' : 'Pause queue temporarily'}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      {isPaused ? 'Activate' : 'Pause'}
                    </button>

                    <button
                      onClick={() => setEditingQueue(queue)}
                      className="p-1.5 text-charcoal-600 hover:text-charcoal-900 hover:bg-canvas-subtle rounded border border-border transition-colors"
                      title="Edit queue details"
                      aria-label="Edit queue"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteQueue(queue)}
                      className="p-1.5 text-charcoal-400 hover:text-danger hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                      title="Delete queue"
                      aria-label="Delete queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add Customer & Manage Console */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCustomerModalQueue(queue)}
                      disabled={isPaused}
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                      title="Add customer to this queue"
                    >
                      Add Token
                    </Button>

                    <Link to={`/queues/${queue.id}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <QueueFormModal
        isOpen={createModalOpen || !!editingQueue}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingQueue(null);
        }}
        onSubmit={handleSaveQueue}
        initialData={editingQueue}
        isLoading={isActionLoading}
      />

      {/* Add Customer Modal */}
      {customerModalQueue && (
        <AddCustomerModal
          isOpen={!!customerModalQueue}
          onClose={() => setCustomerModalQueue(null)}
          onSubmit={handleAddCustomer}
          queueName={customerModalQueue.name}
          prefix={customerModalQueue.prefix}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
};

