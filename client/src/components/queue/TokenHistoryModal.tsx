import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Badge } from '../common/Badge.js';
import { Token } from '../../types/index.js';
import { tokenApi } from '../../services/api.js';
import { Clock, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';

interface TokenHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueId: string;
  queueName: string;
}

export const TokenHistoryModal: React.FC<TokenHistoryModalProps> = ({
  isOpen,
  onClose,
  queueId,
  queueName,
}) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && queueId) {
      loadHistory();
    }
  }, [isOpen, queueId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const res = await tokenApi.getTokenHistory(queueId);
      if (res.success && res.tokens) {
        setTokens(res.tokens);
      }
    } catch (err) {
      console.error('Failed to load token history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTokens = tokens.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.tokenNumber.toLowerCase().includes(q) ||
        (t.customerPhone && t.customerPhone.includes(q))
      );
    }
    return true;
  });

  const formatDuration = (startStr: string | null, endStr: string | null) => {
    if (!startStr || !endStr) return '—';
    const diff = Math.floor(
      (new Date(endStr).getTime() - new Date(startStr).getTime()) / 1000
    );
    if (diff <= 0) return '0s';
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Token History"
      subtitle={`Service log and past activity for "${queueName}"`}
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-canvas-subtle rounded-md border border-border">
            {['ALL', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                  filterStatus === st
                    ? 'bg-white text-charcoal-900 shadow-subtle'
                    : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                {st === 'ALL' ? 'All History' : st === 'COMPLETED' ? 'Completed' : 'Cancelled'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              placeholder="Search token or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded bg-white border border-border focus:outline-none focus:border-coral-500"
            />
          </div>
        </div>

        {/* History Table / List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-charcoal-500">Loading history...</div>
          ) : filteredTokens.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-500">
              No historical tokens found for this criteria.
            </div>
          ) : (
            filteredTokens.map((t) => (
              <div key={t.id} className="py-3 px-1 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm bg-canvas-subtle px-2 py-0.5 rounded border border-border text-charcoal-900">
                    {t.tokenNumber}
                  </span>
                  <div>
                    <div className="font-semibold text-charcoal-900">{t.customerName}</div>
                    <div className="text-[11px] text-charcoal-500">
                      Created: {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {t.status === 'COMPLETED' && (
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] text-charcoal-500">Service Time</div>
                      <div className="font-mono font-semibold text-charcoal-800">
                        {formatDuration(t.servedAt, t.completedAt)}
                      </div>
                    </div>
                  )}

                  <Badge status={t.status} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

