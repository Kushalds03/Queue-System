import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-charcoal-700 tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-white border text-charcoal-900 text-sm rounded px-3 py-2 transition-colors placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 disabled:bg-canvas-subtle disabled:text-charcoal-400 disabled:cursor-not-allowed ${
          error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger font-medium">{error}</span>}
      {!error && helperText && <span className="text-xs text-charcoal-500">{helperText}</span>}
    </div>
  );
};

