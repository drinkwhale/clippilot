/**
 * Popover 컴포넌트
 * 트리거 버튼 클릭 시 나타나는 부가 정보 표시 컴포넌트
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PopoverContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
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

/**
 * Popover Root 컴포넌트
 */
export interface PopoverProps {
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Popover({
  defaultOpen = false,
  children,
  className,
}: PopoverProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div className={cn('relative inline-block', className)}>{children}</div>
    </PopoverContext.Provider>
  );
}

/**
 * PopoverTrigger 컴포넌트 (팝오버 트리거 - div로 래핑)
 */
export interface PopoverTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function PopoverTrigger({ children, className }: PopoverTriggerProps) {
  const { setIsOpen } = usePopoverContext();

  return (
    <div
      className={cn('inline-block', className)}
      onClick={() => setIsOpen((prev) => !prev)}
    >
      {children}
    </div>
  );
}

/**
 * PopoverContent 컴포넌트 (팝오버 내용)
 */
export interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function PopoverContent({
  children,
  className,
  align = 'center',
  side = 'bottom',
}: PopoverContentProps) {
  const { isOpen, setIsOpen } = usePopoverContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const sideClasses = {
    top: 'bottom-full mb-2',
    right: 'left-full ml-2 top-0',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2 top-0',
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-popover',
        'min-w-[200px] max-w-[320px]',
        'bg-background-secondary',
        'border border-border-primary',
        'rounded-lg',
        'p-4',
        'shadow-md',
        'animate-zoom-in',
        alignmentClasses[align],
        sideClasses[side],
        className
      )}
    >
      {children}
    </div>
  );
}
