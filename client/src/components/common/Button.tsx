import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-coral-500/20 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white shadow-subtle border border-coral-600/30',
    secondary:
      'bg-white hover:bg-canvas-subtle active:bg-canvas-muted text-charcoal-800 border border-border shadow-subtle',
    danger:
      'bg-danger text-white hover:bg-red-700 active:bg-red-800 border border-red-700/30 shadow-subtle',
    success:
      'bg-success text-white hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-700/30 shadow-subtle',
    subtle:
      'bg-transparent hover:bg-canvas-subtle active:bg-canvas-muted text-charcoal-700 border border-transparent',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

