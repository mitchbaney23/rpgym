import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radii, layout, animation } from '../theme/tokens';
import { typography } from '../theme/typography';
import { useFonts } from '../hooks/useFonts';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fontsLoaded = useFonts();

  const handlePressIn = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scaleAnim, {
        toValue: animation.pressScale,
        ...animation.springConfig,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...animation.springConfig,
        useNativeDriver: true,
      }).start();
    }
  };

  const getButtonStyles = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primaryButton];
      case 'secondary':
        return [...baseStyle, styles.secondaryButton];
      case 'outline':
        return [...baseStyle, styles.outlineButton];
      default:
        return [...baseStyle, styles.primaryButton];
    }
  };

  const getTextStyles = () => {
    const baseTextStyle = fontsLoaded ? typography.button : { ...typography.button, fontFamily: 'monospace' };
    
    switch (variant) {
      case 'primary':
        return [baseTextStyle, styles.primaryText];
      case 'secondary':
        return [baseTextStyle, styles.secondaryText];
      case 'outline':
        return [baseTextStyle, styles.outlineText];
      default:
        return [baseTextStyle, styles.primaryText];
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          ...getButtonStyles(),
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[...getTextStyles(), disabled && styles.disabledText, textStyle]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
  },
  
  // Sizes
  small: {
    height: layout.buttonSmall,
    paddingHorizontal: spacing.md,
  },
  medium: {
    height: layout.buttonMedium,
    paddingHorizontal: spacing.lg,
  },
  large: {
    height: layout.buttonLarge,
    paddingHorizontal: spacing.xl,
  },
  
  // Primary variant - neon pink with cyan glow
  primaryButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowColor: colors.accentAlt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryText: {
    color: colors.text,
  },
  
  // Secondary variant - cyan with pink glow
  secondaryButton: {
    backgroundColor: colors.accentAlt,
    borderColor: colors.accentAlt,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryText: {
    color: colors.bg,
  },
  
  // Outline variant - transparent with neon border
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: colors.accentAlt,
    shadowColor: colors.accentAlt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  outlineText: {
    color: colors.accentAlt,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: colors.panel,
    borderColor: colors.stroke,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: colors.textDim,
  },
});