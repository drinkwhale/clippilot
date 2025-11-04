/**
 * Input 컴포넌트 - Linear 테마 적용
 * Linear.app 스타일의 입력 필드 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-small font-medium text-foreground-secondary mb-2"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            [
              'w-full px-3 py-2',
              'text-regular text-foreground-primary',
              'bg-background-secondary',
              'border border-border-primary',
              'rounded-lg',
              'transition-all duration-quick ease-out-quad',
              'placeholder:text-foreground-quaternary',
              'hover:border-border-secondary',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-status-red focus:ring-status-red',
            ].filter(Boolean).join(' '),
            className
          )}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-small text-status-red">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-small text-foreground-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
