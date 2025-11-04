/**
 * 공통 컴포넌트 타입 정의
 */

import { ReactNode } from 'react';

/**
 * 기본 컴포넌트 Props
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Variant 타입 (색상/스타일 변형)
 */
export type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info';

/**
 * Size 타입
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Status 타입
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Position 타입 (Tooltip, Dropdown 등)
 */
export type Position =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * Alignment 타입
 */
export type Alignment = 'start' | 'center' | 'end' | 'stretch';

/**
 * Icon Props
 */
export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * 로딩 상태 Props
 */
export interface LoadingProps {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * 비활성화 상태 Props
 */
export interface DisabledProps {
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * 선택 가능 Props
 */
export interface SelectableProps {
  selected?: boolean;
  onSelect?: () => void;
}

/**
 * 토글 가능 Props
 */
export interface ToggleableProps {
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Form Field Props
 */
export interface FormFieldProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Click Handler Props
 */
export interface ClickableProps {
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
}

/**
 * Keyboard Handler Props
 */
export interface KeyboardProps {
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
}

/**
 * Focus Handler Props
 */
export interface FocusProps {
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  autoFocus?: boolean;
}

/**
 * Animation Props
 */
export interface AnimationProps {
  animated?: boolean;
  animationDuration?: number;
  animationDelay?: number;
}

/**
 * Portal Props (Modal, Tooltip 등)
 */
export interface PortalProps {
  container?: HTMLElement | null;
  disablePortal?: boolean;
}

/**
 * Z-Index Props
 */
export interface ZIndexProps {
  zIndex?: number;
}

/**
 * Overlay Props
 */
export interface OverlayProps {
  overlay?: boolean;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
}

/**
 * 테스트 ID Props
 */
export interface TestProps {
  'data-testid'?: string;
}

/**
 * ARIA Props (접근성)
 */
export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  role?: string;
}
