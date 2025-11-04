/**
 * Spinner 컴포넌트
 * 로딩 인디케이터
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, Size } from '@/types/components';

export interface SpinnerProps extends BaseComponentProps {
  size?: Size;
  variant?: 'default' | 'brand' | 'white';
  label?: string;
}

export function Spinner({
  size = 'md',
  variant = 'default',
  label,
  className,
}: SpinnerProps) {
  const sizeStyles = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-[3px]',
  };

  const variantStyles = {
    default: 'border-foreground-quaternary border-t-foreground-primary',
    brand: 'border-brand/20 border-t-brand',
    white: 'border-white/20 border-t-white',
  };

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full animate-spin',
          sizeStyles[size],
          variantStyles[variant]
        )}
        role="status"
        aria-label={label || '로딩 중'}
      >
        <span className="sr-only">{label || '로딩 중'}</span>
      </div>

      {label && (
        <span className="text-small text-foreground-tertiary">{label}</span>
      )}
    </div>
  );
}

/**
 * Dots Spinner (점 3개 애니메이션)
 */
export interface DotsSpinnerProps extends BaseComponentProps {
  size?: Extract<Size, 'sm' | 'md' | 'lg'>;
  variant?: 'default' | 'brand';
}

export function DotsSpinner({
  size = 'md',
  variant = 'default',
  className,
}: DotsSpinnerProps) {
  const dotSizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const variantStyles = {
    default: 'bg-foreground-tertiary',
    brand: 'bg-brand',
  };

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full',
            dotSizeStyles[size],
            variantStyles[variant],
            'animate-bounce'
          )}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Pulse Spinner (맥박 효과)
 */
export interface PulseSpinnerProps extends BaseComponentProps {
  size?: Size;
  variant?: 'default' | 'brand';
}

export function PulseSpinner({
  size = 'md',
  variant = 'default',
  className,
}: PulseSpinnerProps) {
  const sizeStyles = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variantStyles = {
    default: 'bg-foreground-tertiary',
    brand: 'bg-brand',
  };

  return (
    <div className={cn('inline-flex', className)}>
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeStyles[size],
          variantStyles[variant]
        )}
        role="status"
        aria-label="로딩 중"
      />
    </div>
  );
}
