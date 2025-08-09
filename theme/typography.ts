import { TextStyle } from 'react-native';
import { colors } from './tokens';

/**
 * 80s Arcade Typography System
 * Press Start 2P for headings, Roboto Mono for numbers/labels
 */

const basePixelFont: TextStyle = {
  fontFamily: 'PressStart2P_400Regular',
  letterSpacing: 1,
  lineHeight: undefined, // Let the font determine line height for pixel fonts
};

const baseMonoFont: TextStyle = {
  fontFamily: 'RobotoMono_400Regular',
  letterSpacing: 0.5,
};

const baseMonoMedium: TextStyle = {
  fontFamily: 'RobotoMono_500Medium',
  letterSpacing: 0.5,
};

const baseMonoBold: TextStyle = {
  fontFamily: 'RobotoMono_700Bold',
  letterSpacing: 0.5,
};

export const typography = {
  // Headings - Press Start 2P
  h1: {
    ...basePixelFont,
    fontSize: 24,
    letterSpacing: 2,
    color: colors.text,
  } as TextStyle,
  
  h2: {
    ...basePixelFont,
    fontSize: 18,
    letterSpacing: 1.5,
    color: colors.text,
  } as TextStyle,
  
  h3: {
    ...basePixelFont,
    fontSize: 14,
    letterSpacing: 1,
    color: colors.text,
  } as TextStyle,
  
  h4: {
    ...basePixelFont,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.text,
  } as TextStyle,
  // Additional small heading alias
  h5: {
    ...basePixelFont,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.text,
  } as TextStyle,
  
  // Labels - Press Start 2P small
  label: {
    ...basePixelFont,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  
  labelLarge: {
    ...basePixelFont,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  
  // Numbers - Roboto Mono
  number: {
    ...baseMonoBold,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24, // 8px baseline snap
  } as TextStyle,
  
  numberLarge: {
    ...baseMonoBold,
    fontSize: 24,
    color: colors.text,
    lineHeight: 32, // 8px baseline snap
  } as TextStyle,
  
  numberHuge: {
    ...baseMonoBold,
    fontSize: 32,
    color: colors.text,
    lineHeight: 40, // 8px baseline snap
  } as TextStyle,
  
  // Body text - Roboto Mono
  body: {
    ...baseMonoFont,
    fontSize: 14,
    color: colors.text,
    lineHeight: 24, // 8px baseline snap
  } as TextStyle,
  
  bodySmall: {
    ...baseMonoFont,
    fontSize: 12,
    color: colors.textDim,
    lineHeight: 16, // 8px baseline snap
  } as TextStyle,
  
  // Special text styles
  caption: {
    ...baseMonoFont,
    fontSize: 10,
    color: colors.textDim,
    lineHeight: 16, // 8px baseline snap
  } as TextStyle,
  
  button: {
    ...basePixelFont,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  buttonSmall: {
    ...basePixelFont,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  buttonLarge: {
    ...basePixelFont,
    fontSize: 14,
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  
  // Stats display
  statNumber: {
    ...baseMonoBold,
    fontSize: 20,
    color: colors.accentAlt,
    lineHeight: 24,
  } as TextStyle,
  statSmall: {
    ...baseMonoBold,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  } as TextStyle,
  statLarge: {
    ...baseMonoBold,
    fontSize: 28,
    color: colors.accentAlt,
    lineHeight: 32,
  } as TextStyle,
  stat: {
    ...baseMonoBold,
    fontSize: 16,
    color: colors.accentAlt,
    lineHeight: 24,
  } as TextStyle,
  
  statLabel: {
    ...basePixelFont,
    fontSize: 8,
    letterSpacing: 0.5,
    color: colors.textDim,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  
  // Level display
  levelNumber: {
    ...baseMonoBold,
    fontSize: 28,
    color: colors.text,
    lineHeight: 32,
  } as TextStyle,
  
  levelLabel: {
    ...basePixelFont,
    fontSize: 6,
    letterSpacing: 0.5,
    color: colors.textDim,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  
  // Body sizes
  bodyLarge: {
    ...baseMonoFont,
    fontSize: 16,
    color: colors.text,
    lineHeight: 28,
  } as TextStyle,
  
  // Status text
  success: {
    ...baseMonoMedium,
    fontSize: 12,
    color: colors.success,
    lineHeight: 16,
  } as TextStyle,
  
  danger: {
    ...baseMonoMedium,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 16,
  } as TextStyle,
  
  accent: {
    ...baseMonoMedium,
    fontSize: 12,
    color: colors.accent,
    lineHeight: 16,
  } as TextStyle,
} as const;

// Font fallbacks for when custom fonts aren't loaded
export const typographyFallback = {
  ...typography,
  h1: { ...typography.h1, fontFamily: 'monospace' },
  h2: { ...typography.h2, fontFamily: 'monospace' },
  h3: { ...typography.h3, fontFamily: 'monospace' },
  h4: { ...typography.h4, fontFamily: 'monospace' },
  label: { ...typography.label, fontFamily: 'monospace' },
  labelLarge: { ...typography.labelLarge, fontFamily: 'monospace' },
  button: { ...typography.button, fontFamily: 'monospace' },
  statLabel: { ...typography.statLabel, fontFamily: 'monospace' },
  levelLabel: { ...typography.levelLabel, fontFamily: 'monospace' },
} as const;