/**
 * Button 컴포넌트 - Linear 테마 적용
 * Linear.app 스타일의 버튼 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
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
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-small rounded-md',
    md: 'px-4 py-2 text-regular rounded-lg',
    lg: 'px-6 py-3 text-large rounded-xl',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
