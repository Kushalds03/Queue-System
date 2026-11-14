import React from 'react';
import { TokenStatus, QueueStatus } from '../../types/index.js';

interface BadgeProps {
  status: TokenStatus | QueueStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const normalized = status.toUpperCase();

  const styles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    WAITING: {
      bg: 'bg-amber-50 border-amber-200/80',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
      label: 'Waiting',
    },
    SERVING: {
      bg: 'bg-coral-50 border-coral-200/90',
      text: 'text-coral-800 font-semibold',
      dot: 'bg-coral-500 animate-ping',
      label: 'Serving',
    },
    COMPLETED: {
      bg: 'bg-emerald-50 border-emerald-200/80',
      text: 'text-emerald-800',
      dot: 'bg-emerald-600',
      label: 'Completed',
    },
    CANCELLED: {
      bg: 'bg-slate-100 border-slate-200',
      text: 'text-slate-600',
      dot: 'bg-slate-400',
      label: 'Cancelled',
    },
    ACTIVE: {
      bg: 'bg-emerald-50 border-emerald-200/80',
      text: 'text-emerald-800',
      dot: 'bg-emerald-600',
      label: 'Active',
    },
    PAUSED: {
      bg: 'bg-amber-50 border-amber-200/80',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
      label: 'Paused',
    },
  };

  const style = styles[normalized] || {
    bg: 'bg-canvas-subtle border-border',
    text: 'text-charcoal-700',
    dot: 'bg-charcoal-400',
    label: status,
  };

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClass} ${style.bg} ${style.text} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {normalized === 'SERVING' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`}></span>
      </span>
      {style.label}
    </span>
  );
};
