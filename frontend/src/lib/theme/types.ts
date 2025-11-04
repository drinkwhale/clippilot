/**
 * Linear 테마 타입 정의
 * Linear.app의 디자인 시스템을 기반으로 한 테마 스키마
 */

export interface LinearTheme {
  name: string;
  version: string;
  description: string;
  author: string;
  created_at: string;

  colors: {
    background: BackgroundColors;
    text: TextColors;
    foreground: ForegroundColors;
    brand: BrandColors;
    accent: AccentColors;
    border: BorderColors;
    line: LineColors;
    link: LinkColors;
    selection: SelectionColors;
    status: StatusColors;
    product: ProductColors;
    overlay: OverlayColors;
  };

  typography: {
    fontFamily: FontFamily;
    fontWeight: FontWeight;
    fontSize: FontSize;
    lineHeight: LineHeight;
    letterSpacing: LetterSpacing;
  };

  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  effects: Effects;
  animation: Animation;
  zIndex: ZIndex;
  focus: Focus;
  grid: Grid;
  breakpoints: Breakpoints;
  misc: Misc;
}

export interface BackgroundColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  quinary: string;
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  marketing: string;
  tint: string;
  translucent: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
}

export interface ForegroundColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
}

export interface BrandColors {
  primary: string;
  text: string;
  background: string;
}

export interface AccentColors {
  primary: string;
  hover: string;
  tint: string;
}

export interface BorderColors {
  primary: string;
  secondary: string;
  tertiary: string;
  translucent: string;
}

export interface LineColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  tint: string;
}

export interface LinkColors {
  primary: string;
  hover: string;
}

export interface SelectionColors {
  background: string;
  text: string;
  dim: string;
}

export interface StatusColors {
  red: string;
  orange: string;
  yellow: string;
  green: string;
  blue: string;
  indigo: string;
}

export interface ProductColors {
  plan: string;
  build: string;
  security: string;
}

export interface OverlayColors {
  primary: string;
  dim: string;
}

export interface FontFamily {
  regular: string;
  monospace: string;
  serif: string;
  emoji: string;
}

export interface FontWeight {
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface FontSize {
  micro: string;
  microPlus: string;
  tiny: string;
  mini: string;
  miniPlus: string;
  small: string;
  smallPlus: string;
  regular: string;
  regularPlus: string;
  large: string;
  largePlus: string;
  title1: string;
  title2: string;
  title3: string;
  title4: string;
  title5: string;
  title6: string;
  title7: string;
  title8: string;
  title9: string;
}

export interface LineHeight {
  micro: number;
  tiny: number;
  mini: number;
  small: number;
  regular: number;
  large: number;
  title1: number;
  title2: number;
  title3: number;
  title4: number;
  title5: number;
  title6: number;
  title7: number;
  title8: number;
  title9: number;
}

export interface LetterSpacing {
  micro: string;
  tiny: string;
  mini: string;
  small: string;
  regular: string;
  large: string;
  title1: string;
  title2: string;
  title3: string;
  title4: string;
  title5: string;
  title6: string;
  title7: string;
  title8: string;
  title9: string;
}

export interface Spacing {
  headerHeight: string;
  pagePaddingInline: string;
  pagePaddingBlock: string;
  pageMaxWidth: string;
  proseMaxWidth: string;
  minTapSize: string;
  scrollbarSize: string;
  scrollbarSizeActive: string;
  scrollbarGap: string;
}

export interface BorderRadius {
  '4': string;
  '6': string;
  '8': string;
  '12': string;
  '16': string;
  '24': string;
  '32': string;
  rounded: string;
  circle: string;
}

export interface Shadows {
  none: string;
  tiny: string;
  low: string;
  medium: string;
  high: string;
  stackLow: string;
}

export interface Effects {
  headerBlur: string;
  headerBackground: string;
  headerBorder: string;
  scrollbarColor: string;
  scrollbarColorHover: string;
  scrollbarColorActive: string;
}

export interface Animation {
  speed: {
    quick: string;
    regular: string;
    highlightFadeIn: string;
    highlightFadeOut: string;
  };
  easing: {
    inQuad: string;
    outQuad: string;
    inOutQuad: string;
    inCubic: string;
    outCubic: string;
    inOutCubic: string;
    inQuart: string;
    outQuart: string;
    inOutQuart: string;
    inQuint: string;
    outQuint: string;
    inOutQuint: string;
    inExpo: string;
    outExpo: string;
    inOutExpo: string;
    inCirc: string;
    outCirc: string;
    inOutCirc: string;
  };
}

export interface ZIndex {
  layer1: number;
  layer2: number;
  layer3: number;
  footer: number;
  scrollbar: number;
  header: number;
  overlay: number;
  popover: number;
  commandMenu: number;
  dialog: number;
  dialogOverlay: number;
  toasts: number;
  tooltip: number;
  contextMenu: number;
  skipNav: number;
  debug: number;
  max: number;
}

export interface Focus {
  ringWidth: string;
  ringColor: string;
  ringOffset: string;
  ringOutline: string;
}

export interface Grid {
  columns: number;
}

export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface Misc {
  borderHairline: string;
  transparent: string;
  iconGrayscaleFilter: string;
  fontSettings: string;
  fontVariations: string;
}
