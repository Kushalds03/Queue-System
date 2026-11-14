import React from 'react';
import { Token } from '../../types/index.js';
import { Button } from '../common/Button.js';
import { ChevronUp, ChevronDown, X, Clock, User, Phone, Users } from 'lucide-react';

interface WaitingListProps {
  tokens: Token[];
  onMoveToken: (tokenId: string, direction: 'UP' | 'DOWN') => Promise<void>;
  onCancelToken: (tokenId: string) => Promise<void>;
  movingTokenId?: string | null;
  cancellingTokenId?: string | null;
}

export const WaitingList: React.FC<WaitingListProps> = ({
  tokens,
  onMoveToken,
  onCancelToken,
  movingTokenId = null,
  cancellingTokenId = null,
}) => {
  if (tokens.length === 0) {
    return (
      <div className="bg-white rounded-md border border-border p-8 text-center shadow-subtle">
        <div className="w-12 h-12 rounded-full bg-canvas-subtle border border-border/80 flex items-center justify-center mx-auto text-charcoal-400 mb-3">
          <Users className="w-6 h-6 text-charcoal-400" />
        </div>
        <h4 className="text-sm font-semibold text-charcoal-800">No Customers Waiting</h4>
        <p className="text-xs text-charcoal-500 max-w-sm mx-auto mt-1">
          The waiting queue is currently empty. Use the "Add Customer" button above to issue a new token.
        </p>
      </div>
    );
  }

  // Calculate elapsed waiting time
  const getElapsedWait = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diffMins = Math.max(0, Math.floor((now - created) / 60000));
    if (diffMins < 1) return 'Just joined';
    if (diffMins === 1) return '1 min ago';
    if (diffMins >= 60) {
      const hrs = Math.floor(diffMins / 60);
      const remaining = diffMins % 60;
      return `${hrs}h ${remaining}m ago`;
    }
    return `${diffMins} mins ago`;
  };

  return (
    <div className="bg-white rounded-md border border-border shadow-subtle overflow-hidden">
      <div className="divide-y divide-border/70">
        {tokens.map((token, index) => {
          const isFirst = index === 0;
          const isLast = index === tokens.length - 1;
          const isMoving = movingTokenId === token.id;
          const isCancelling = cancellingTokenId === token.id;

          return (
            <div
              key={token.id}
              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                isFirst
                  ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500'
                  : 'hover:bg-canvas/50'
              }`}
            >
              {/* Left: Position & Token Info */}
              <div className="flex items-center gap-4">
                {/* Position Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
                    isFirst
                      ? 'bg-amber-500 text-white shadow-subtle'
                      : 'bg-canvas-subtle text-charcoal-700 border border-border'
                  }`}
                  title={`Position #${token.position} in queue`}
                >
                  #{token.position}
                </div>

                {/* Token Badge */}
                <div className="bg-canvas-subtle border border-border px-3 py-1.5 rounded font-mono font-bold text-sm text-charcoal-900 tracking-tight">
                  {token.tokenNumber}
                </div>

                {/* Customer Details */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-charcoal-900">
                      {token.customerName}
                    </span>
                    {isFirst && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                        Next Up
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-500 mt-0.5">
                    {token.customerPhone && (
                      <span className="flex items-center gap-1 font-mono text-charcoal-600">
                        <Phone className="w-3 h-3 text-charcoal-400" />
                        {token.customerPhone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-charcoal-500">
                      <Clock className="w-3 h-3 text-charcoal-400" />
                      {getElapsedWait(token.createdAt)}
                    </span>
                    {token.notes && (
                      <span className="text-charcoal-600 truncate max-w-xs italic">
                        "{token.notes}"
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Ordering Controls (Up / Down) & Cancel Action */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {/* Move Up */}
                <button
                  type="button"
                  onClick={() => onMoveToken(token.id, 'UP')}
                  disabled={isFirst || isMoving || isCancelling}
                  className="p-1.5 rounded text-charcoal-600 hover:text-charcoal-900 hover:bg-canvas-subtle border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={isFirst ? 'Already first in queue' : 'Move up (higher priority)'}
                  aria-label="Move token up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  onClick={() => onMoveToken(token.id, 'DOWN')}
                  disabled={isLast || isMoving || isCancelling}
                  className="p-1.5 rounded text-charcoal-600 hover:text-charcoal-900 hover:bg-canvas-subtle border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={isLast ? 'Already last in queue' : 'Move down (lower priority)'}
                  aria-label="Move token down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => onCancelToken(token.id)}
                  disabled={isMoving || isCancelling}
                  className="ml-2 text-xs text-charcoal-500 hover:text-danger hover:bg-red-50 border border-transparent hover:border-red-200 px-2.5 py-1.5 rounded font-medium transition-colors flex items-center gap-1"
                  title="Remove customer from queue"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

