// RPGym Color Palette
export const colors = {
  // Primary brand colors
  primary: '#6366F1', // Indigo - main brand color
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // Secondary colors
  secondary: '#EC4899', // Pink - accent color
  secondaryLight: '#F472B6',
  secondaryDark: '#DB2777',
  
  // Success/Achievement colors
  success: '#10B981', // Emerald green
  successLight: '#34D399',
  successDark: '#059669',
  
  // Warning/Caution colors
  warning: '#F59E0B', // Amber
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  // Error colors
  error: '#EF4444', // Red
  errorLight: '#F87171',
  errorDark: '#DC2626',
  
  // Neutral grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Pure colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundDark: '#1F2937',
  
  // Text colors
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Skill-specific colors
  pushups: '#EF4444', // Red
  situps: '#F59E0B', // Amber
  squats: '#10B981', // Emerald
  pullups: '#3B82F6', // Blue
  '5k': '#8B5CF6', // Purple
  
  // Progress ring colors
  progressBackground: '#E5E7EB',
  progressFill: '#6366F1',
  
  // Badge colors
  badgeBronze: '#CD7F32',
  badgeSilver: '#C0C0C0',
  badgeGold: '#FFD700',
  
  // Streak flame colors
  flameOrange: '#F97316',
  flameRed: '#EF4444',
  flameYellow: '#FCD34D',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
} as const;

// Skill color mapping
export const skillColors: Record<string, string> = {
  pushups: colors.pushups,
  situps: colors.situps,
  squats: colors.squats,
  pullups: colors.pullups,
  '5k': colors['5k'],
};

// Dark theme colors (for future use)
export const darkColors = {
  ...colors,
  background: '#111827',
  backgroundSecondary: '#1F2937',
  backgroundDark: '#000000',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textLight: '#9CA3AF',
  border: '#374151',
  borderLight: '#4B5563',
  borderDark: '#1F2937',
  progressBackground: '#374151',
};