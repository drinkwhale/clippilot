import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, children, variant, className, ...props }, ref) => {
    if (asChild) {
      return <>{children}</>;
    }
    return (
      <button ref={ref} data-variant={variant} className={className} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
