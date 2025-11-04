/**
 * Linear 테마 로더 및 CSS 변수 생성기
 * JSON 테마를 CSS 변수로 변환하여 글로벌 스타일에 적용
 */

import linearThemeData from './linear-theme.json';
import { LinearTheme } from './types';

// JSON 데이터를 타입 캐스팅
export const linearTheme = linearThemeData as LinearTheme;

/**
 * 중첩된 객체를 평탄화하여 CSS 변수 형식으로 변환
 * 예: { colors: { background: { primary: "#000" } } } → { "--color-bg-primary": "#000" }
 */
function flattenObject(
  obj: Record<string, any>,
  prefix = '',
  separator = '-'
): Record<string, string> {
  const flattened: Record<string, string> = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}${separator}${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey, separator));
    } else {
      flattened[`--${newKey}`] = String(value);
    }
  });

  return flattened;
}

/**
 * 테마 객체를 CSS 변수로 변환
 */
export function generateCSSVariables(theme: LinearTheme): Record<string, string> {
  // 메타데이터 제외
  const { name, version, description, author, created_at, ...themeData } = theme;

  // 일부 키 이름을 축약형으로 변환
  const normalizedData = {
    color: {
      bg: themeData.colors.background,
      fg: themeData.colors.foreground,
      text: themeData.colors.text,
      brand: themeData.colors.brand,
      accent: themeData.colors.accent,
      border: themeData.colors.border,
      line: themeData.colors.line,
      link: themeData.colors.link,
      selection: themeData.colors.selection,
      status: themeData.colors.status,
      product: themeData.colors.product,
      overlay: themeData.colors.overlay,
    },
    font: {
      family: themeData.typography.fontFamily,
      weight: themeData.typography.fontWeight,
      size: themeData.typography.fontSize,
      lineHeight: themeData.typography.lineHeight,
      letterSpacing: themeData.typography.letterSpacing,
    },
    spacing: themeData.spacing,
    radius: themeData.borderRadius,
    shadow: themeData.shadows,
    effect: themeData.effects,
    animation: themeData.animation,
    zIndex: themeData.zIndex,
    focus: themeData.focus,
    grid: themeData.grid,
    breakpoint: themeData.breakpoints,
    misc: themeData.misc,
  };

  return flattenObject(normalizedData);
}

/**
 * CSS 변수를 :root에 적용
 */
export function applyCSSVariables(variables: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * 테마를 적용하는 메인 함수
 */
export function applyLinearTheme(): void {
  const cssVars = generateCSSVariables(linearTheme);
  applyCSSVariables(cssVars);
}

/**
 * CSS 변수 문자열 생성 (SSR용)
 */
export function generateCSSVariableString(theme: LinearTheme): string {
  const variables = generateCSSVariables(theme);

  return Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

/**
 * Tailwind CSS에서 사용할 수 있는 테마 객체 생성
 */
export function generateTailwindTheme(theme: LinearTheme) {
  return {
    colors: {
      background: {
        primary: theme.colors.background.primary,
        secondary: theme.colors.background.secondary,
        tertiary: theme.colors.background.tertiary,
        quaternary: theme.colors.background.quaternary,
      },
      foreground: {
        primary: theme.colors.foreground.primary,
        secondary: theme.colors.foreground.secondary,
        tertiary: theme.colors.foreground.tertiary,
        quaternary: theme.colors.foreground.quaternary,
      },
      brand: theme.colors.brand,
      accent: theme.colors.accent,
      border: theme.colors.border,
      status: theme.colors.status,
    },
    fontFamily: {
      sans: [theme.typography.fontFamily.regular],
      mono: [theme.typography.fontFamily.monospace],
      serif: [theme.typography.fontFamily.serif],
    },
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeight,
    lineHeight: theme.typography.lineHeight,
    letterSpacing: theme.typography.letterSpacing,
    borderRadius: theme.borderRadius,
    boxShadow: theme.shadows,
    spacing: {
      header: theme.spacing.headerHeight,
      page: {
        inline: theme.spacing.pagePaddingInline,
        block: theme.spacing.pagePaddingBlock,
      },
    },
    maxWidth: {
      page: theme.spacing.pageMaxWidth,
      prose: theme.spacing.proseMaxWidth,
    },
    zIndex: theme.zIndex,
    transitionTimingFunction: theme.animation.easing,
    transitionDuration: theme.animation.speed,
  };
}

/**
 * 특정 CSS 변수 값 가져오기
 */
export function getCSSVariable(variableName: string): string {
  if (typeof document === 'undefined') return '';

  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

/**
 * 테마 색상 팔레트를 객체로 반환
 */
export function getColorPalette() {
  return linearTheme.colors;
}

/**
 * 테마 타이포그래피 설정을 객체로 반환
 */
export function getTypography() {
  return linearTheme.typography;
}
