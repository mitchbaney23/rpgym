import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors, spacing, radii, layout } from '../theme/tokens';
import { typography } from '../theme/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = () => {
    const baseStyle: Array<StyleProp<ViewStyle>> = [styles.button];
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        break;
      default:
        baseStyle.push(styles.buttonMedium);
        break;
    }
    
    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
      default:
        baseStyle.push(styles.buttonPrimary);
        break;
    }
    
    // State styles
    if (disabled) {
      baseStyle.push(styles.buttonDisabled);
    }
    
    return baseStyle;
  };

  const getTextStyles = () => {
    const baseStyle: Array<StyleProp<TextStyle>> = [styles.buttonText];
    
    // Size text styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonTextSmall);
        break;
      case 'large':
        baseStyle.push(styles.buttonTextLarge);
        break;
      default:
        baseStyle.push(styles.buttonTextMedium);
        break;
    }
    
    // Variant text styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.buttonTextSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonTextOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonTextGhost);
        break;
      default:
        baseStyle.push(styles.buttonTextPrimary);
        break;
    }
    
    if (disabled) {
      baseStyle.push(styles.buttonTextDisabled);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[styles.button, ...getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? colors.white : colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={[styles.buttonText, ...getTextStyles(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  
  // Size styles
  buttonSmall: {
    height: layout.buttonSmall,
    paddingHorizontal: spacing.md,
  },
  buttonMedium: {
    height: layout.buttonMedium,
    paddingHorizontal: spacing.lg,
  },
  buttonLarge: {
    height: layout.buttonLarge,
    paddingHorizontal: spacing.xl,
  },
  
  // Variant styles
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  
  // State styles
  buttonDisabled: {
    backgroundColor: colors.strokeDim,
    borderColor: colors.strokeDim,
  },
  
  // Text styles
  buttonText: {
    textAlign: 'center',
  },
  buttonTextSmall: {
    ...typography.buttonSmall,
  },
  buttonTextMedium: {
    ...typography.button,
  },
  buttonTextLarge: {
    ...typography.buttonLarge,
  },
  
  // Variant text styles
  buttonTextPrimary: {
    color: colors.white,
  },
  buttonTextSecondary: {
    color: colors.text,
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  buttonTextGhost: {
    color: colors.primary,
  },
  buttonTextDisabled: {
    color: colors.textDim,
  },
});