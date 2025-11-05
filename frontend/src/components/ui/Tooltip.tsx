/**
 * Tooltip & Popover 컴포넌트
 * 툴팁 및 팝오버 UI
 */

'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/types/components';

/**
 * Tooltip 컴포넌트
 */
export interface TooltipProps extends BaseComponentProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  disableHoverableContent?: boolean;
}

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  disableHoverableContent = false,
  className,
  children,
}: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const spacing = 8;

    let top = 0;
    let left = 0;

    // Side positioning
    switch (side) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        break;
      case 'left':
        left = triggerRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        left = triggerRect.right + spacing;
        break;
    }

    // Align positioning
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'end':
          left = triggerRect.right - tooltipRect.width;
          break;
      }
    } else {
      switch (align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'end':
          top = triggerRect.bottom - tooltipRect.height;
          break;
      }
    }

    setPosition({ top, left });
  }, [side, align]);

  React.useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!disableHoverableContent) {
      setIsOpen(false);
    }
  };

  const handleTooltipMouseLeave = () => {
    if (!disableHoverableContent) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn('inline-block', className)}
      >
        {children}
      </div>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            onMouseLeave={handleTooltipMouseLeave}
            className={cn(
              'fixed z-tooltip',
              'px-3 py-2 rounded-lg',
              'bg-overlay-primary text-foreground-primary',
              'text-small font-medium',
              'shadow-high',
              'animate-zoom-in duration-quick',
              'pointer-events-auto'
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * Popover 컴포넌트
 */
interface PopoverContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  position: { top: number; left: number };
  updatePosition: () => void;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(
  undefined
);

function usePopoverContext() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

export interface PopoverProps extends BaseComponentProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  children,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setIsOpen = React.useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(open);
      }
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange]
  );

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const spacing = 8;

    setPosition({
      top: triggerRect.bottom + spacing,
      left: triggerRect.left,
    });
  }, []);

  return (
    <PopoverContext.Provider
      value={{ isOpen, setIsOpen, triggerRef, position, updatePosition }}
    >
      <div className={cn('relative inline-block', className)}>{children}</div>
    </PopoverContext.Provider>
  );
}

/**
 * PopoverTrigger 컴포넌트
 */
export interface PopoverTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function PopoverTrigger({
  className,
  children,
  ...props
}: PopoverTriggerProps) {
  const { isOpen, setIsOpen, triggerRef } = usePopoverContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * PopoverContent 컴포넌트
 */
export interface PopoverContentProps extends BaseComponentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  closeOnClickOutside?: boolean;
}

export function PopoverContent({
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  closeOnClickOutside = true,
  className,
  children,
}: PopoverContentProps) {
  const { isOpen, setIsOpen, triggerRef, updatePosition } =
    usePopoverContext();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [computedPosition, setComputedPosition] = React.useState({
    top: 0,
    left: 0,
  });

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (isOpen && triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      // Side positioning
      switch (side) {
        case 'top':
          top = triggerRect.top - contentRect.height - sideOffset;
          break;
        case 'bottom':
          top = triggerRect.bottom + sideOffset;
          break;
        case 'left':
          left = triggerRect.left - contentRect.width - sideOffset;
          break;
        case 'right':
          left = triggerRect.right + sideOffset;
          break;
      }

      // Align positioning
      if (side === 'top' || side === 'bottom') {
        switch (align) {
          case 'start':
            left = triggerRect.left;
            break;
          case 'center':
            left =
              triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
            break;
          case 'end':
            left = triggerRect.right - contentRect.width;
            break;
        }
      } else {
        switch (align) {
          case 'start':
            top = triggerRect.top;
            break;
          case 'center':
            top =
              triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
            break;
          case 'end':
            top = triggerRect.bottom - contentRect.height;
            break;
        }
      }

      setComputedPosition({ top, left });
    }
  }, [isOpen, side, align, sideOffset]);

  React.useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, closeOnClickOutside, setIsOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="dialog"
      className={cn(
        'fixed z-popover',
        'min-w-[200px] max-w-[400px]',
        'bg-background-secondary border border-border-primary rounded-lg shadow-high',
        'p-4',
        'animate-zoom-in duration-quick',
        className
      )}
      style={{
        top: `${computedPosition.top}px`,
        left: `${computedPosition.left}px`,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

/**
 * PopoverClose 컴포넌트
 */
export interface PopoverCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function PopoverClose({
  className,
  children,
  ...props
}: PopoverCloseProps) {
  const { setIsOpen } = usePopoverContext();

  return (
    <button
      type="button"
      onClick={() => setIsOpen(false)}
      className={cn(
        'absolute top-2 right-2',
        'inline-flex items-center justify-center',
        'w-6 h-6 rounded-md',
        'text-foreground-tertiary hover:text-foreground-primary',
        'hover:bg-background-tertiary',
        'transition-all duration-quick',
        'focus:outline-none focus:ring-2 focus:ring-brand',
        className
      )}
      {...props}
    >
      {children || (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
