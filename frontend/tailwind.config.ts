import type { Config } from "tailwindcss";
import { linearTheme } from "./src/lib/theme/theme-loader";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: linearTheme.colors.background.primary,
          secondary: linearTheme.colors.background.secondary,
          tertiary: linearTheme.colors.background.tertiary,
          quaternary: linearTheme.colors.background.quaternary,
          quinary: linearTheme.colors.background.quinary,
        },
        foreground: {
          primary: linearTheme.colors.foreground.primary,
          secondary: linearTheme.colors.foreground.secondary,
          tertiary: linearTheme.colors.foreground.tertiary,
          quaternary: linearTheme.colors.foreground.quaternary,
        },
        brand: {
          DEFAULT: linearTheme.colors.brand.primary,
          bg: linearTheme.colors.brand.background,
          text: linearTheme.colors.brand.text,
          hover: linearTheme.colors.accent.hover,
        },
        accent: {
          DEFAULT: linearTheme.colors.accent.primary,
          hover: linearTheme.colors.accent.hover,
          tint: linearTheme.colors.accent.tint,
        },
        border: {
          primary: linearTheme.colors.border.primary,
          secondary: linearTheme.colors.border.secondary,
          tertiary: linearTheme.colors.border.tertiary,
        },
        status: linearTheme.colors.status,
        overlay: {
          primary: linearTheme.colors.overlay.primary,
          dim: linearTheme.colors.overlay.dim,
        },
      },
      fontFamily: {
        sans: linearTheme.typography.fontFamily.regular.split(',').map(f => f.trim()),
        mono: linearTheme.typography.fontFamily.monospace.split(',').map(f => f.trim()),
        serif: linearTheme.typography.fontFamily.serif.split(',').map(f => f.trim()),
      },
      fontSize: {
        micro: linearTheme.typography.fontSize.micro,
        tiny: linearTheme.typography.fontSize.tiny,
        mini: linearTheme.typography.fontSize.mini,
        small: linearTheme.typography.fontSize.small,
        regular: linearTheme.typography.fontSize.regular,
        large: linearTheme.typography.fontSize.large,
        title1: linearTheme.typography.fontSize.title1,
        title2: linearTheme.typography.fontSize.title2,
        title3: linearTheme.typography.fontSize.title3,
        title4: linearTheme.typography.fontSize.title4,
        title5: linearTheme.typography.fontSize.title5,
        title6: linearTheme.typography.fontSize.title6,
        title7: linearTheme.typography.fontSize.title7,
        title8: linearTheme.typography.fontSize.title8,
        title9: linearTheme.typography.fontSize.title9,
      },
      fontWeight: linearTheme.typography.fontWeight,
      lineHeight: linearTheme.typography.lineHeight,
      letterSpacing: linearTheme.typography.letterSpacing,
      borderRadius: {
        sm: linearTheme.borderRadius['4'],
        DEFAULT: linearTheme.borderRadius['8'],
        md: linearTheme.borderRadius['12'],
        lg: linearTheme.borderRadius['16'],
        xl: linearTheme.borderRadius['24'],
        '2xl': linearTheme.borderRadius['32'],
        full: linearTheme.borderRadius.rounded,
      },
      boxShadow: {
        none: linearTheme.shadows.none,
        sm: linearTheme.shadows.low,
        DEFAULT: linearTheme.shadows.medium,
        md: linearTheme.shadows.medium,
        lg: linearTheme.shadows.high,
        high: linearTheme.shadows.high,
      },
      maxWidth: {
        page: linearTheme.spacing.pageMaxWidth,
        prose: linearTheme.spacing.proseMaxWidth,
      },
      spacing: {
        header: linearTheme.spacing.headerHeight,
      },
      zIndex: {
        ...linearTheme.zIndex,
        dropdown: linearTheme.zIndex.popover,
        toast: linearTheme.zIndex.toasts,
        tooltip: linearTheme.zIndex.tooltip,
        popover: linearTheme.zIndex.popover,
        dialog: linearTheme.zIndex.dialog,
      },
      transitionTimingFunction: {
        'in-quad': linearTheme.animation.easing.inQuad,
        'out-quad': linearTheme.animation.easing.outQuad,
        'in-out-quad': linearTheme.animation.easing.inOutQuad,
        'in-cubic': linearTheme.animation.easing.inCubic,
        'out-cubic': linearTheme.animation.easing.outCubic,
        'in-out-cubic': linearTheme.animation.easing.inOutCubic,
        'in-quart': linearTheme.animation.easing.inQuart,
        'out-quart': linearTheme.animation.easing.outQuart,
        'in-out-quart': linearTheme.animation.easing.inOutQuart,
      },
      transitionDuration: {
        quick: linearTheme.animation.speed.quick,
        regular: linearTheme.animation.speed.regular,
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'zoom-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'zoom-in': 'zoom-in 0.2s ease-out',
        'zoom-out': 'zoom-out 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.2s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.2s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
