import React, { useState, useEffect } from 'react';
import { Token } from '../../types/index.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';
import { CheckCircle2, XCircle, Clock, User, Phone, Sparkles } from 'lucide-react';

interface ServingBannerProps {
  token: Token | null;
  onComplete: (tokenId: string) => Promise<void>;
  onCancel: (tokenId: string) => Promise<void>;
  isCompleting?: boolean;
  isCancelling?: boolean;
}

export const ServingBanner: React.FC<ServingBannerProps> = ({
  token,
  onComplete,
  onCancel,
  isCompleting = false,
  isCancelling = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!token || !token.servedAt) {
      setElapsedSeconds(0);
      return;
    }

    const servedTime = new Date(token.servedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - servedTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!token) {
    return (
      <div className="bg-white rounded-md border border-dashed border-border p-6 text-center shadow-subtle">
        <div className="w-12 h-12 rounded-full bg-canvas-subtle border border-border/80 flex items-center justify-center mx-auto text-charcoal-400 mb-3">
          <Sparkles className="w-6 h-6 text-coral-400" />
        </div>
        <h4 className="text-sm font-semibold text-charcoal-800">Counter is Currently Idle</h4>
        <p className="text-xs text-charcoal-500 max-w-sm mx-auto mt-1">
          No customer is currently being served at this desk. Click "Call Next Customer" to begin service.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border-2 border-coral-500/80 shadow-elevated overflow-hidden">
      {/* Banner Top Strip */}
      <div className="bg-coral-500 text-white px-5 py-2 flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span>Currently Serving at Counter</span>
        </div>
        <Badge status="SERVING" className="bg-white/20 text-white border-white/30" />
      </div>

      {/* Main Serving Info */}
      <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          {/* Big Token Number Display */}
          <div className="bg-coral-50 text-coral-700 border-2 border-coral-200/90 rounded-md px-4 py-3 flex flex-col items-center justify-center min-w-[110px] shadow-subtle">
            <span className="text-[10px] font-bold uppercase tracking-wider text-coral-500">
              Token Number
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-coral-700">
              {token.tokenNumber}
            </span>
          </div>

          {/* Customer Details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-charcoal-400" />
              <h3 className="text-lg sm:text-xl font-bold text-charcoal-900">
                {token.customerName}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-600">
              {token.customerPhone && (
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                  {token.customerPhone}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-canvas-subtle px-2 py-0.5 rounded border border-border font-mono text-charcoal-700">
                <Clock className="w-3.5 h-3.5 text-coral-500" />
                Duration: <strong className="font-bold text-charcoal-900">{formatTimer(elapsedSeconds)}</strong>
              </span>
            </div>

            {token.notes && (
              <p className="text-xs text-charcoal-600 bg-canvas-subtle/80 px-2.5 py-1 rounded border border-border/60 mt-1 max-w-md">
                <span className="font-semibold text-charcoal-700">Note:</span> {token.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons: Complete & Cancel */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onCancel(token.id)}
            isLoading={isCancelling}
            disabled={isCompleting}
            leftIcon={<XCircle className="w-4 h-4 text-charcoal-500" />}
            title="Cancel this customer's service"
          >
            Cancel
          </Button>

          <Button
            variant="success"
            size="md"
            onClick={() => onComplete(token.id)}
            isLoading={isCompleting}
            disabled={isCancelling}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="shadow-subtle"
            title="Mark this customer's service as successfully completed"
          >
            Complete Service
          </Button>
        </div>
      </div>
    </div>
  );
};

