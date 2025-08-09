// Spacing scale (following 4px base unit)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
} as const;

// Border radius values
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// Shadow presets
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// Layout constants
export const layout = {
  // Screen padding
  screenPadding: spacing[4],
  screenPaddingHorizontal: spacing[4],
  screenPaddingVertical: spacing[6],
  
  // Container max widths
  containerSm: 640,
  containerMd: 768,
  containerLg: 1024,
  containerXl: 1280,
  
  // Component sizing
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,
  
  inputHeight: 48,
  inputHeightSmall: 36,
  inputHeightLarge: 56,
  
  // Progress ring sizes
  progressRingSmall: 60,
  progressRingMedium: 80,
  progressRingLarge: 120,
  
  // Badge sizes
  badgeSmall: 32,
  badgeMedium: 48,
  badgeLarge: 64,
  
  // Icon sizes
  iconXs: 12,
  iconSm: 16,
  iconBase: 20,
  iconLg: 24,
  iconXl: 32,
  icon2xl: 48,
  
  // Header heights
  headerHeight: 56,
  tabBarHeight: 80,
  
  // Safe area
  safeAreaTop: 44,
  safeAreaBottom: 34,
} as const;