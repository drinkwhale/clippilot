import * as React from 'react';

export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const cls = className ? `animate-pulse ${className}` : 'animate-pulse';
    return <div ref={ref} className={cls} {...props} />;
  }
);
Skeleton.displayName = 'Skeleton';
