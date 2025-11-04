/**
 * Progress & Skeleton 컴포넌트
 * 로딩 상태 UI
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, Size } from '@/types/components';

/**
 * Progress Bar 컴포넌트
 */
export interface ProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  size?: Extract<Size, 'sm' | 'md' | 'lg'>;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  indeterminate?: boolean;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'brand',
  showLabel = false,
  label,
  indeterminate = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantStyles = {
    default: 'bg-foreground-tertiary',
    brand: 'bg-brand',
    success: 'bg-status-green',
    warning: 'bg-status-yellow',
    error: 'bg-status-red',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-small font-medium text-foreground-primary">
            {label || 'Loading'}
          </span>
          {showLabel && !indeterminate && (
            <span className="text-small text-foreground-tertiary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          'bg-background-tertiary',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-regular ease-out-cubic',
            variantStyles[variant],
            indeterminate && 'animate-pulse'
          )}
          style={{
            width: indeterminate ? '100%' : `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Circular Progress 컴포넌트
 */
export interface CircularProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  indeterminate?: boolean;
}

export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'brand',
  showLabel = false,
  indeterminate = false,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const variantStyles = {
    default: 'text-foreground-tertiary',
    brand: 'text-brand',
    success: 'text-status-green',
    warning: 'text-status-yellow',
    error: 'text-status-red',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className={cn(
          'transform -rotate-90',
          indeterminate && 'animate-spin'
        )}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-background-tertiary"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-regular ease-out-cubic',
            variantStyles[variant]
          )}
        />
      </svg>

      {showLabel && !indeterminate && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-small font-medium text-foreground-primary">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton 컴포넌트
 */
export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  className,
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    rounded: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-background-tertiary via-background-secondary to-background-tertiary bg-[length:400%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-background-tertiary',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      aria-label="로딩 중"
      role="status"
    />
  );
}

/**
 * SkeletonText 컴포넌트 (여러 줄 텍스트 스켈레톤)
 */
export interface SkeletonTextProps extends BaseComponentProps {
  lines?: number;
  spacing?: 'sm' | 'md' | 'lg';
  lastLineWidth?: string;
}

export function SkeletonText({
  lines = 3,
  spacing = 'md',
  lastLineWidth = '60%',
  className,
}: SkeletonTextProps) {
  const spacingStyles = {
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  };

  return (
    <div className={cn('w-full', spacingStyles[spacing], className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard 컴포넌트 (카드 형태 스켈레톤)
 */
export interface SkeletonCardProps extends BaseComponentProps {
  hasImage?: boolean;
  imageHeight?: number;
  hasAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({
  hasImage = true,
  imageHeight = 200,
  hasAvatar = false,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div className={cn('w-full', className)}>
      {hasImage && (
        <Skeleton variant="rectangular" height={imageHeight} className="mb-4" />
      )}

      {hasAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      )}

      <SkeletonText lines={lines} />
    </div>
  );
}

/**
 * SkeletonTable 컴포넌트 (테이블 스켈레톤)
 */
export interface SkeletonTableProps extends BaseComponentProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" height={20} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}
