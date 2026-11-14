import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-md border border-border shadow-subtle ${
        hoverEffect ? 'hover:border-charcoal-300 hover:shadow-card transition-all duration-150' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
