/**
 * Dropdown/Select 컴포넌트
 * 선택 메뉴 UI
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps, Size } from '@/types/components';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(
  undefined
);

function useDropdownContext() {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

/**
 * Dropdown Root 컴포넌트
 */
export interface DropdownProps extends BaseComponentProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultOpen?: boolean;
}

export function Dropdown({
  value: controlledValue,
  onValueChange,
  defaultOpen = false,
  className,
  children,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [selectedValue, setSelectedValue] = React.useState(controlledValue);

  const onSelect = React.useCallback(
    (value: string) => {
      setSelectedValue(value);
      onValueChange?.(value);
      setIsOpen(false);
    },
    [onValueChange]
  );

  return (
    <DropdownContext.Provider
      value={{ isOpen, setIsOpen, selectedValue, onSelect }}
    >
      <div className={cn('relative inline-block', className)}>{children}</div>
    </DropdownContext.Provider>
  );
}

/**
 * DropdownTrigger 컴포넌트 (드롭다운 트리거 버튼)
 */
export interface DropdownTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Extract<Size, 'sm' | 'md' | 'lg'>;
}

export function DropdownTrigger({
  size = 'md',
  className,
  children,
  ...props
}: DropdownTriggerProps) {
  const { isOpen, setIsOpen } = useDropdownContext();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-small',
    md: 'px-4 py-2 text-regular',
    lg: 'px-5 py-2.5 text-large',
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        'inline-flex items-center justify-between gap-2',
        'bg-background-secondary border border-border-primary rounded-lg',
        'text-foreground-primary font-medium',
        'transition-all duration-quick',
        'hover:bg-background-tertiary hover:border-border-secondary',
        'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles[size],
        className
      )}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <svg
        className={cn(
          'shrink-0 transition-transform duration-quick',
          isOpen && 'rotate-180'
        )}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * DropdownContent 컴포넌트 (드롭다운 메뉴)
 */
export interface DropdownContentProps extends BaseComponentProps {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function DropdownContent({
  align = 'start',
  sideOffset = 4,
  className,
  children,
}: DropdownContentProps) {
  const { isOpen, setIsOpen } = useDropdownContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
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
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const alignStyles = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={contentRef}
      role="listbox"
      className={cn(
        'absolute z-dropdown',
        'min-w-[200px]',
        'bg-background-secondary border border-border-primary rounded-lg shadow-high',
        'py-1',
        'animate-zoom-in duration-quick',
        alignStyles[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
    >
      {children}
    </div>
  );
}

/**
 * DropdownItem 컴포넌트 (개별 메뉴 항목)
 */
export interface DropdownItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
  destructive?: boolean;
}

export function DropdownItem({
  value,
  icon,
  destructive = false,
  className,
  children,
  ...props
}: DropdownItemProps) {
  const { selectedValue, onSelect } = useDropdownContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(value)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2',
        'text-left text-regular',
        'transition-colors duration-quick',
        destructive
          ? 'text-status-red hover:bg-status-red/10'
          : isSelected
            ? 'bg-brand/10 text-brand'
            : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground-primary',
        'focus:outline-none focus:bg-background-tertiary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {isSelected && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8L6.5 11.5L13 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * DropdownSeparator 컴포넌트 (구분선)
 */
export interface DropdownSeparatorProps extends BaseComponentProps {}

export function DropdownSeparator({
  className,
}: DropdownSeparatorProps) {
  return (
    <div
      className={cn('my-1 h-px bg-border-primary', className)}
      role="separator"
    />
  );
}

/**
 * DropdownLabel 컴포넌트 (섹션 라벨)
 */
export interface DropdownLabelProps extends BaseComponentProps {}

export function DropdownLabel({ className, children }: DropdownLabelProps) {
  return (
    <div
      className={cn(
        'px-3 py-2 text-small font-medium text-foreground-tertiary',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Select 컴포넌트 (단순 선택 폼)
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends BaseComponentProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: Extract<Size, 'sm' | 'md' | 'lg'>;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  size = 'md',
  error,
  label,
  required,
  disabled,
  className,
}: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block mb-2 text-regular font-medium text-foreground-primary">
          {label}
          {required && <span className="text-status-red ml-1">*</span>}
        </label>
      )}

      <Dropdown value={value} onValueChange={onChange}>
        <DropdownTrigger size={size} disabled={disabled} className="w-full">
          <span className={cn(!selectedOption && 'text-foreground-quaternary')}>
            {selectedOption?.label || placeholder}
          </span>
        </DropdownTrigger>

        <DropdownContent className="w-full">
          {options.map((option) => (
            <DropdownItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownContent>
      </Dropdown>

      {error && <p className="mt-1 text-small text-status-red">{error}</p>}
    </div>
  );
}
