/**
 * Modal 컴포넌트
 * 오버레이 다이얼로그
 */

'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, Size } from '@/types/components';

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  size?: Extract<Size, 'sm' | 'md' | 'lg' | 'xl'>;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className,
  children,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-dialog flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-overlay-primary/90 backdrop-blur-sm animate-in fade-in duration-regular"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full',
          'bg-background-secondary border border-border-primary',
          'rounded-xl shadow-high',
          'animate-in zoom-in-95 fade-in duration-regular',
          sizeStyles[size],
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 z-10',
              'inline-flex items-center justify-center',
              'w-8 h-8 rounded-lg',
              'text-foreground-tertiary hover:text-foreground-primary',
              'hover:bg-background-tertiary',
              'transition-all duration-quick',
              'focus:outline-none focus:ring-2 focus:ring-brand'
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
        )}

        {children}
      </div>
    </div>,
    document.body
  );
}

/**
 * ModalHeader 컴포넌트
 */
export interface ModalHeaderProps extends BaseComponentProps {}

export function ModalHeader({ className, children }: ModalHeaderProps) {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)}>
      {children}
    </div>
  );
}

/**
 * ModalTitle 컴포넌트
 */
export interface ModalTitleProps extends BaseComponentProps {}

export function ModalTitle({ className, children }: ModalTitleProps) {
  return (
    <h2
      className={cn(
        'text-title2 font-semibold text-foreground-primary',
        className
      )}
    >
      {children}
    </h2>
  );
}

/**
 * ModalDescription 컴포넌트
 */
export interface ModalDescriptionProps extends BaseComponentProps {}

export function ModalDescription({
  className,
  children,
}: ModalDescriptionProps) {
  return (
    <p className={cn('text-regular text-foreground-tertiary mt-2', className)}>
      {children}
    </p>
  );
}

/**
 * ModalBody 컴포넌트
 */
export interface ModalBodyProps extends BaseComponentProps {}

export function ModalBody({ className, children }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

/**
 * ModalFooter 컴포넌트
 */
export interface ModalFooterProps extends BaseComponentProps {
  justify?: 'start' | 'center' | 'end' | 'between';
}

export function ModalFooter({
  justify = 'end',
  className,
  children,
}: ModalFooterProps) {
  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-border-primary',
        'flex items-center gap-3',
        justifyStyles[justify],
        className
      )}
    >
      {children}
    </div>
  );
}
