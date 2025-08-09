import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Polygon, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors, spacing, radii } from '../theme/tokens';
import { typography } from '../theme/typography';
import { useFonts } from '../hooks/useFonts';
import { Badge as BadgeType } from '../types/domain';

interface BadgeProps {
  badge?: BadgeType;
  size?: number;
  showLabel?: boolean;
  locked?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  badge,
  size = 48,
  showLabel = true,
  locked = false,
}) => {
  const fontsLoaded = useFonts();

  const getBadgeColor = (level?: number) => {
    if (!level) return colors.textDim;
    
    if (level === 99) return colors.gold;
    if (level >= 50) return colors.accentAlt;
    return colors.accent;
  };

  const getBadgeEmoji = (level?: number, skillId?: string) => {
    if (locked || !badge) return '🔒';
    
    if (level === 99) return '👑';
    
    // Skill-specific emojis
    switch (skillId) {
      case 'pushups': return '💪';
      case 'situps': return '🔥';
      case 'squats': return '🏋️';
      case 'pullups': return '🆙';
      case '5k': return '🏃';
      default: return '🏆';
    }
  };

  const badgeColor = getBadgeColor(badge?.level);
  const emoji = getBadgeEmoji(badge?.level, badge?.skillId);

  return (
    <View style={styles.container}>
      <View style={[styles.badgeContainer, { width: size, height: size }]}>
        {locked ? (
          // Locked badge - wireframe neon outline only
          <Svg width={size} height={size} style={styles.svg}>
            <Defs>
              <SvgLinearGradient id="lockedOutline" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.stroke} stopOpacity="0.6" />
                <Stop offset="100%" stopColor={colors.strokeDim} stopOpacity="0.3" />
              </SvgLinearGradient>
            </Defs>
            
            {/* Hexagonal wireframe */}
            <Polygon
              points={`${size/2},2 ${size-8},${size/4} ${size-8},${size*3/4} ${size/2},${size-2} 8,${size*3/4} 8,${size/4}`}
              fill="transparent"
              stroke="url(#lockedOutline)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            
            {/* Text will be rendered outside SVG */}
          </Svg>
        ) : (
          // Unlocked badge - filled with gold gradient + star sparkle
          <Svg width={size} height={size} style={styles.svg}>
            <Defs>
              <SvgLinearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={badgeColor} stopOpacity="1" />
                <Stop offset="50%" stopColor={colors.gold} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={badgeColor} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            
            {/* Hexagonal badge background */}
            <Polygon
              points={`${size/2},2 ${size-8},${size/4} ${size-8},${size*3/4} ${size/2},${size-2} 8,${size*3/4} 8,${size/4}`}
              fill="url(#badgeGradient)"
              stroke={badgeColor}
              strokeWidth="2"
            />
            
            {/* Star sparkle in top-right corner */}
            <Polygon
              points={`${size-12},8 ${size-8},12 ${size-12},16 ${size-16},12`}
              fill={colors.gold}
              opacity="0.8"
            />
            
            <SvgText 
              x={size/2} 
              y={size/2 + 6}
              textAnchor="middle"
              fontSize={size * 0.4}
              fill={colors.text}
            >
              {emoji}
            </SvgText>
          </Svg>
        )}
        
        {/* Neon glow effect for unlocked badges */}
        {!locked && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                shadowColor: badgeColor,
                shadowOpacity: 0.4,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
              }
            ]}
          />
        )}
      </View>
      
      {showLabel && (
        <Text style={[
          fontsLoaded ? typography.statLabel : { ...typography.statLabel, fontFamily: 'monospace' },
          styles.label,
          { 
            color: locked ? colors.textDim : colors.text,
            maxWidth: size + 20,
          }
        ]}>
          {locked ? 'LOCKED' : badge?.label?.toUpperCase() || 'BADGE'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  badgeContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  label: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});