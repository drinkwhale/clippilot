/**
 * Toast 컴포넌트
 * 알림 메시지 UI
 */

'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/types/components';

export interface ToastProps extends BaseComponentProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export function Toast({
  id,
  title,
  description,
  variant = 'default',
  action,
  onClose,
  className,
}: ToastProps) {
  const variantStyles = {
    default: {
      container: 'bg-background-secondary border-border-primary',
      icon: 'text-foreground-primary',
    },
    success: {
      container: 'bg-status-green/10 border-status-green',
      icon: 'text-status-green',
    },
    warning: {
      container: 'bg-status-yellow/10 border-status-yellow',
      icon: 'text-status-yellow',
    },
    error: {
      container: 'bg-status-red/10 border-status-red',
      icon: 'text-status-red',
    },
    info: {
      container: 'bg-brand/10 border-brand',
      icon: 'text-brand',
    },
  };

  const icons = {
    default: null,
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M6 10L9 13L14 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 7V11M10 14H10.01M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.5 7.5L7.5 12.5M7.5 7.5L12.5 12.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 7V11M10 14H10.01M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-high',
        'min-w-[320px] max-w-[420px]',
        'animate-in slide-in-from-right duration-regular',
        variantStyles[variant].container,
        className
      )}
    >
      {icons[variant] && (
        <div className={cn('shrink-0 mt-0.5', variantStyles[variant].icon)}>
          {icons[variant]}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-semibold text-regular text-foreground-primary mb-1">
            {title}
          </div>
        )}
        {description && (
          <div className="text-small text-foreground-secondary">
            {description}
          </div>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'mt-2 text-small font-medium',
              'text-brand hover:text-brand-hover',
              'transition-colors duration-quick'
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className={cn(
          'shrink-0',
          'text-foreground-tertiary hover:text-foreground-primary',
          'transition-colors duration-quick',
          'focus:outline-none'
        )}
        aria-label="닫기"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * Toast Container
 */
interface ToastContainerProps {
  toasts: ToastProps[];
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
}

export function ToastContainer({
  toasts,
  position = 'bottom-right',
}: ToastContainerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  return createPortal(
    <div className={cn('fixed z-toast flex flex-col gap-2', positionStyles[position])}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>,
    document.body
  );
}

/**
 * Toast Hook & API
 */
type ToastInput = Omit<ToastProps, 'id' | 'onClose'>;

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast는 ToastProvider 내부에서만 사용 가능합니다');
  }
  return context;
}

export interface ToastProviderProps extends BaseComponentProps {
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  defaultDuration?: number;
}

export function ToastProvider({
  position = 'bottom-right',
  defaultDuration = 5000,
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback(
    (toast: ToastInput) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = toast.duration ?? defaultDuration;

      const newToast: ToastProps = {
        ...toast,
        id,
        onClose: () => removeToast(id),
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [defaultDuration]
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts }}
    >
      {children}
      <ToastContainer toasts={toasts} position={position} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Helper Functions
 */
export const toast = {
  success: (title: string, description?: string, action?: ToastInput['action']) => {
    if (typeof window === 'undefined') return '';
    const event = new CustomEvent('toast', {
      detail: { variant: 'success', title, description, action },
    });
    window.dispatchEvent(event);
    return '';
  },
  error: (title: string, description?: string, action?: ToastInput['action']) => {
    if (typeof window === 'undefined') return '';
    const event = new CustomEvent('toast', {
      detail: { variant: 'error', title, description, action },
    });
    window.dispatchEvent(event);
    return '';
  },
  warning: (title: string, description?: string, action?: ToastInput['action']) => {
    if (typeof window === 'undefined') return '';
    const event = new CustomEvent('toast', {
      detail: { variant: 'warning', title, description, action },
    });
    window.dispatchEvent(event);
    return '';
  },
  info: (title: string, description?: string, action?: ToastInput['action']) => {
    if (typeof window === 'undefined') return '';
    const event = new CustomEvent('toast', {
      detail: { variant: 'info', title, description, action },
    });
    window.dispatchEvent(event);
    return '';
  },
  default: (title: string, description?: string, action?: ToastInput['action']) => {
    if (typeof window === 'undefined') return '';
    const event = new CustomEvent('toast', {
      detail: { variant: 'default', title, description, action },
    });
    window.dispatchEvent(event);
    return '';
  },
};
