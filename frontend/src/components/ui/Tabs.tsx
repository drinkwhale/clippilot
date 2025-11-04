/**
 * Tabs 컴포넌트
 * 탭 네비게이션 UI
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/types/components';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

/**
 * Tabs Root 컴포넌트
 */
export interface TabsProps extends BaseComponentProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || ''
  );

  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : uncontrolledValue;

  const setActiveTab = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * TabsList 컴포넌트 (탭 버튼 그룹)
 */
export interface TabsListProps extends BaseComponentProps {
  variant?: 'default' | 'pills' | 'underline';
}

export function TabsList({
  variant = 'default',
  className,
  children,
}: TabsListProps) {
  const baseStyles = 'inline-flex items-center gap-1';

  const variantStyles = {
    default: 'bg-background-secondary p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-border-primary',
  };

  return (
    <div
      role="tablist"
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {children}
    </div>
  );
}

/**
 * TabsTrigger 컴포넌트 (개별 탭 버튼)
 */
export interface TabsTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  variant?: 'default' | 'pills' | 'underline';
  icon?: React.ReactNode;
}

export function TabsTrigger({
  value,
  variant = 'default',
  icon,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  const baseStyles = [
    'inline-flex items-center justify-center gap-2',
    'px-4 py-2 text-regular font-medium',
    'transition-all duration-quick',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');

  const variantStyles = {
    default: cn(
      'rounded-md',
      isActive
        ? 'bg-background-primary text-foreground-primary shadow-sm'
        : 'text-foreground-tertiary hover:text-foreground-secondary hover:bg-background-tertiary'
    ),
    pills: cn(
      'rounded-full px-4 py-1.5',
      isActive
        ? 'bg-brand text-brand-text'
        : 'text-foreground-tertiary hover:bg-background-secondary hover:text-foreground-primary'
    ),
    underline: cn(
      'border-b-2 rounded-none',
      isActive
        ? 'border-brand text-foreground-primary'
        : 'border-transparent text-foreground-tertiary hover:text-foreground-secondary hover:border-border-secondary'
    ),
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => setActiveTab(value)}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * TabsContent 컴포넌트 (탭 컨텐츠)
 */
export interface TabsContentProps extends BaseComponentProps {
  value: string;
  forceMount?: boolean;
}

export function TabsContent({
  value,
  forceMount = false,
  className,
  children,
}: TabsContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      data-state={isActive ? 'active' : 'inactive'}
      hidden={!isActive && forceMount}
      className={cn(
        'mt-4 focus-visible:outline-none',
        !isActive && forceMount && 'hidden',
        className
      )}
    >
      {children}
    </div>
  );
}
