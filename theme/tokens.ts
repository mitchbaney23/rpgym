/**
 * 80s Arcade Design Tokens for RPGym
 * All visual design constants in one place
 */

export const colors = {
  // Core backgrounds
  bg: '#0B0F1A',
  surface: '#131A2A', 
  panel: '#0F1524',

  // Accent colors
  accent: '#FF2D6B',
  accentAlt: '#30E3FF',
  gold: '#FFC84C',

  // Ring specific
  ringBg: '#1C2742',
  ringFg: '#30E3FF',

  // Text
  text: '#E8ECFF',
  textDim: '#A7B0D6',

  // Status colors
  danger: '#FF5C5C',
  success: '#3DFF9A',

  // Stroke colors with opacity
  stroke: 'rgba(48, 227, 255, 0.28)',
  strokeDim: 'rgba(48, 227, 255, 0.12)',

  // Overlays
  scanline: 'rgba(48, 227, 255, 0.08)',
  vignette: 'rgba(11, 15, 26, 0.6)',

  // Compatibility aliases (legacy token names)
  primary: '#30E3FF', // map to accentAlt
  white: '#FFFFFF',
  background: '#0B0F1A', // bg
  backgroundDark: '#0B0F1A',
  textSecondary: '#A7B0D6', // textDim
  textLight: '#A7B0D6',
  error: '#FF5C5C', // danger
  warning: '#FFC84C', // gold
  border: 'rgba(48, 227, 255, 0.28)', // stroke
  shadow: 'rgba(0, 0, 0, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
  primaryBackground: 'rgba(48, 227, 255, 0.06)',
} as const;

export const spacing = {
  // Named scale
  xs: 4,
  sm: 8, 
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,

  // Numeric aliases for legacy usage
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
} as const;

export const shadows = {
  neon: '0 6px 18px rgba(48, 227, 255, 0.12)',
  neonBright: '0 4px 12px rgba(255, 45, 107, 0.2)',
  panel: '0 2px 8px rgba(0, 0, 0, 0.3)',
} as const;

export const layout = {
  // Screen padding
  screenPaddingHorizontal: spacing.lg,
  screenPaddingVertical: spacing.lg,
  
  // Component sizes
  progressRingLarge: 120,
  progressRingMedium: 80,
  progressRingSmall: 60,
  
  // Grid
  gridSize: 16,
  
  // Button heights
  buttonSmall: 36,
  buttonMedium: 44,
  buttonLarge: 52,

  // Legacy aliases
  buttonHeightSmall: 36,
  buttonHeight: 44,
  buttonHeightLarge: 52,

  // Inputs
  inputHeight: 48,

  // Badges
  badgeMedium: 48,
} as const;

export const animation = {
  // Durations in ms
  fast: 120,
  medium: 300,
  slow: 500,
  
  // Easing
  easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  
  // Scales
  pressScale: 0.98,
  
  // Spring configs for Reanimated
  springConfig: {
    damping: 15,
    stiffness: 200,
  },
} as const;

export const strokeWidth = {
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

// Skill-specific colors
export const skillColors = {
  pushups: colors.accent,
  situps: colors.gold, 
  squats: colors.success,
  pullups: colors.accentAlt,
  '5k': colors.danger,
} as const;