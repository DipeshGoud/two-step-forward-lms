import React from 'react';

export function Card({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-slate-200/80 bg-white p-4 shadow-none transition-shadow hover:shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
