/**
 * Badge 컴포넌트
 * 상태, 카테고리, 레이블 표시에 사용되는 작은 라벨 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, Size, Variant } from '@/types/components';

export interface BadgeProps extends BaseComponentProps {
  variant?: Variant | 'default' | 'outline';
  size?: Extract<Size, 'sm' | 'md' | 'lg'>;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className,
  children,
}: BadgeProps) {
  const baseStyles = [
    'inline-flex items-center gap-1.5',
    'font-medium transition-all duration-quick',
    'whitespace-nowrap',
  ].join(' ');

  const variantStyles: Record<string, string> = {
    default: 'bg-background-tertiary text-foreground-primary border border-border-primary',
    outline: 'bg-transparent text-foreground-secondary border border-border-primary hover:border-border-secondary',
    primary: 'bg-brand text-brand-text',
    secondary: 'bg-background-secondary text-foreground-primary',
    ghost: 'bg-transparent text-foreground-tertiary',
    success: 'bg-status-green/10 text-status-green border border-status-green/20',
    warning: 'bg-status-yellow/10 text-status-yellow border border-status-yellow/20',
    danger: 'bg-status-red/10 text-status-red border border-status-red/20',
    info: 'bg-status-blue/10 text-status-blue border border-status-blue/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-micro rounded-md',
    md: 'px-2.5 py-1 text-small rounded-md',
    lg: 'px-3 py-1.5 text-regular rounded-lg',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'inline-block rounded-full',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-2.5 h-2.5',
            variant === 'success' && 'bg-status-green',
            variant === 'warning' && 'bg-status-yellow',
            variant === 'danger' && 'bg-status-red',
            variant === 'info' && 'bg-status-blue',
            variant === 'primary' && 'bg-brand-text',
            !['success', 'warning', 'danger', 'info', 'primary'].includes(variant) &&
              'bg-foreground-tertiary'
          )}
        />
      )}

      {children}

      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'inline-flex items-center justify-center',
            'rounded-full hover:bg-black/10 transition-colors',
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-5 h-5'
          )}
          aria-label="제거"
        >
          <svg
            width={size === 'sm' ? 8 : size === 'md' ? 10 : 12}
            height={size === 'sm' ? 8 : size === 'md' ? 10 : 12}
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3L3 9M3 3L9 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
