/**
 * Avatar 컴포넌트
 * 사용자 프로필 이미지 또는 이니셜 표시
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, Size, Status } from '@/types/components';

export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: Size;
  status?: Status | 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  fallback?: React.ReactNode;
  shape?: 'circle' | 'square' | 'rounded';
}

/**
 * 이름에서 이니셜 추출 (최대 2글자)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * 이름을 기반으로 배경색 생성
 */
function getColorFromName(name: string): string {
  const colors = [
    'bg-status-red',
    'bg-status-orange',
    'bg-status-yellow',
    'bg-status-green',
    'bg-status-blue',
    'bg-status-indigo',
    'bg-accent-primary',
    'bg-brand',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  status,
  showStatus = false,
  fallback,
  shape = 'circle',
  className,
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const sizeStyles = {
    xs: 'w-6 h-6 text-micro',
    sm: 'w-8 h-8 text-small',
    md: 'w-10 h-10 text-regular',
    lg: 'w-12 h-12 text-large',
    xl: 'w-16 h-16 text-title2',
  };

  const shapeStyles = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const statusSizeStyles = {
    xs: 'w-1.5 h-1.5 border',
    sm: 'w-2 h-2 border-2',
    md: 'w-2.5 h-2.5 border-2',
    lg: 'w-3 h-3 border-2',
    xl: 'w-4 h-4 border-2',
  };

  const statusColorStyles = {
    online: 'bg-status-green',
    offline: 'bg-foreground-quaternary',
    away: 'bg-status-yellow',
    busy: 'bg-status-red',
    idle: 'bg-foreground-tertiary',
    loading: 'bg-status-blue',
    success: 'bg-status-green',
    error: 'bg-status-red',
  };

  const showImage = src && !imageError;
  const showInitials = !showImage && name && !fallback;
  const showFallback = !showImage && !showInitials && fallback;

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'inline-flex items-center justify-center overflow-hidden',
          'select-none shrink-0',
          sizeStyles[size],
          shapeStyles[shape],
          showInitials && getColorFromName(name),
          !showImage && 'bg-background-tertiary',
          'transition-all duration-quick'
        )}
      >
        {showImage && (
          <img
            src={src}
            alt={alt || name}
            className={cn(
              'w-full h-full object-cover',
              !imageLoaded && 'opacity-0',
              imageLoaded && 'opacity-100',
              'transition-opacity duration-regular'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {showInitials && (
          <span className="font-semibold text-white">
            {getInitials(name)}
          </span>
        )}

        {showFallback && fallback}

        {!showImage && !showInitials && !showFallback && (
          <svg
            className="w-1/2 h-1/2 text-foreground-quaternary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>

      {showStatus && status && (
        <span
          className={cn(
            'absolute bottom-0 right-0',
            'rounded-full border-background-primary',
            statusSizeStyles[size],
            statusColorStyles[status] || statusColorStyles.offline
          )}
          aria-label={`상태: ${status}`}
        />
      )}
    </div>
  );
}

/**
 * AvatarGroup 컴포넌트
 * 여러 Avatar를 겹쳐서 표시
 */
export interface AvatarGroupProps extends BaseComponentProps {
  max?: number;
  size?: Size;
  children: React.ReactNode;
}

export function AvatarGroup({
  max = 5,
  size = 'md',
  className,
  children,
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={cn('inline-flex items-center -space-x-2', className)}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className="ring-2 ring-background-primary rounded-full"
          style={{ zIndex: visibleChildren.length - index }}
        >
          {child}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center',
            'bg-background-tertiary text-foreground-secondary',
            'rounded-full ring-2 ring-background-primary',
            'font-semibold',
            size === 'xs' && 'w-6 h-6 text-micro',
            size === 'sm' && 'w-8 h-8 text-small',
            size === 'md' && 'w-10 h-10 text-regular',
            size === 'lg' && 'w-12 h-12 text-large',
            size === 'xl' && 'w-16 h-16 text-title2'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
