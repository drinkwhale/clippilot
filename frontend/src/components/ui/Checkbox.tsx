/**
 * Checkbox & Switch 컴포넌트
 * 체크박스와 토글 스위치
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, Size } from '@/types/components';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: Extract<Size, 'sm' | 'md' | 'lg'>;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      size = 'md',
      indeterminate = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => checkboxRef.current!);

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const sizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <div className={cn('inline-flex items-start gap-3', className)}>
        <div className="relative inline-flex items-center justify-center shrink-0">
          <input
            ref={checkboxRef}
            type="checkbox"
            disabled={disabled}
            className={cn(
              sizeStyles[size],
              'appearance-none',
              'border-2 border-border-primary rounded-md',
              'bg-background-secondary',
              'transition-all duration-quick',
              'cursor-pointer',
              'hover:border-border-secondary',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background-primary',
              'checked:bg-brand checked:border-brand',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-status-red focus:ring-status-red'
            )}
            {...props}
          />

          {/* Checkmark Icon */}
          <svg
            className={cn(
              'absolute pointer-events-none',
              'text-white opacity-0 transition-opacity duration-quick',
              props.checked && 'opacity-100',
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-3.5 h-3.5',
              size === 'lg' && 'w-4 h-4'
            )}
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              d="M3 7L6 10L11 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Indeterminate Icon */}
          <svg
            className={cn(
              'absolute pointer-events-none',
              'text-white opacity-0 transition-opacity duration-quick',
              indeterminate && 'opacity-100',
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-3.5 h-3.5',
              size === 'lg' && 'w-4 h-4'
            )}
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              d="M3 7H11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                className={cn(
                  'block font-medium text-foreground-primary cursor-pointer',
                  size === 'sm' && 'text-small',
                  size === 'md' && 'text-regular',
                  size === 'lg' && 'text-large',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-foreground-tertiary mt-0.5',
                  size === 'sm' && 'text-micro',
                  size === 'md' && 'text-small',
                  size === 'lg' && 'text-regular'
                )}
              >
                {description}
              </p>
            )}
            {error && (
              <p className="text-status-red text-small mt-1">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * Switch 컴포넌트 (Toggle)
 */
export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  size?: Extract<Size, 'sm' | 'md' | 'lg'>;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, size = 'md', className, disabled, ...props }, ref) => {
    const sizeStyles = {
      sm: {
        track: 'w-9 h-5',
        thumb: 'w-3.5 h-3.5',
        translate: 'translate-x-4',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'w-4 h-4',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'w-5 h-5',
        translate: 'translate-x-7',
      },
    };

    return (
      <div className={cn('inline-flex items-start gap-3', className)}>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              sizeStyles[size].track,
              'rounded-full',
              'bg-background-tertiary border-2 border-border-primary',
              'transition-all duration-regular ease-out-cubic',
              'peer-checked:bg-brand peer-checked:border-brand',
              'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand peer-focus:ring-offset-2 peer-focus:ring-offset-background-primary',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                sizeStyles[size].thumb,
                'absolute top-0.5 left-0.5',
                'bg-white rounded-full',
                'transition-transform duration-regular ease-out-cubic',
                'peer-checked:' + sizeStyles[size].translate
              )}
            />
          </div>
        </label>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                className={cn(
                  'block font-medium text-foreground-primary cursor-pointer',
                  size === 'sm' && 'text-small',
                  size === 'md' && 'text-regular',
                  size === 'lg' && 'text-large',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-foreground-tertiary mt-0.5',
                  size === 'sm' && 'text-micro',
                  size === 'md' && 'text-small',
                  size === 'lg' && 'text-regular'
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
