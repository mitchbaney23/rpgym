import { useMemo } from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useFonts } from '../hooks/useFonts';
import { typography, typographyFallback } from './typography';
import { colors, spacing, radii, shadows, layout, animation } from './tokens';

type Style = ViewStyle | TextStyle | ImageStyle;
type NamedStyles<T> = { [P in keyof T]: Style };

/**
 * Hook for creating themed styles with font loading support
 * Automatically falls back to system fonts when custom fonts aren't loaded
 */
export const useThemedStyles = <T extends NamedStyles<T>>(
  createStyles: (theme: ThemeType) => T
): T => {
  const fontsLoaded = useFonts();
  
  return useMemo(() => {
    const theme: ThemeType = {
      colors,
      spacing,
      radii,
      shadows,
      layout,
      animation,
      typography: fontsLoaded ? typography : typographyFallback,
      fontsLoaded,
    };
    
    return StyleSheet.create(createStyles(theme));
  }, [fontsLoaded, createStyles]);
};

export type ThemeType = {
  colors: typeof colors;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  layout: typeof layout;
  animation: typeof animation;
  typography: typeof typography;
  fontsLoaded: boolean;
};