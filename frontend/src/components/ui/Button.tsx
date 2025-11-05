/**
 * Button 컴포넌트 - Linear 테마 적용
 * Linear.app 스타일의 버튼 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-quick',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');

  const variantStyles = {
    primary: [
      'bg-brand text-brand-text',
      'hover:bg-accent-hover',
      'focus-visible:outline-brand',
    ].join(' '),
    secondary: [
      'bg-background-secondary text-foreground-primary',
      'border border-border-primary',
      'hover:bg-background-tertiary hover:border-border-secondary',
      'focus-visible:outline-border-tertiary',
    ].join(' '),
    ghost: [
      'bg-transparent text-foreground-secondary',
      'hover:bg-background-secondary hover:text-foreground-primary',
      'focus-visible:outline-border-primary',
    ].join(' '),
    danger: [
      'bg-status-red text-white',
      'hover:opacity-90',
      'focus-visible:outline-status-red',
    ].join(' '),
    outline: [
      'bg-transparent text-foreground-primary',
      'border border-border-primary',
      'hover:bg-background-secondary',
      'focus-visible:outline-border-primary',
    ].join(' '),
  };

  const sizeStyles = {
    xs: 'px-2 py-1 text-micro rounded',
    sm: 'px-3 py-1.5 text-small rounded-md',
    md: 'px-4 py-2 text-regular rounded-lg',
    lg: 'px-6 py-3 text-large rounded-xl',
    xl: 'px-8 py-4 text-title4 rounded-xl',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
