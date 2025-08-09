import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { colors, spacing } from '../theme/tokens';
import { typography } from '../theme/typography';
import { useFonts } from '../hooks/useFonts';

interface StreakFlameProps {
  streakCount: number;
  size?: number;
  showText?: boolean;
}

export const StreakFlame: React.FC<StreakFlameProps> = ({
  streakCount,
  size = 60,
  showText = true,
}) => {
  const fontsLoaded = useFonts();
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Calculate thermometer fill based on streak
  // Every 5 days = one segment, max 20 segments (100 days)
  const maxStreak = 100;
  const fillPercentage = Math.min(streakCount / maxStreak, 1);
  const segmentCount = Math.floor(streakCount / 5);
  
  useEffect(() => {
    // Glow animation when streak increments
    if (streakCount > 0) {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [streakCount, glowAnim]);

  const thermometerGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const thermometerWidth = size * 0.3;
  const thermometerHeight = size * 0.8;
  const fillHeight = thermometerHeight * fillPercentage;
  
  // Create tick marks every 5 days
  const renderTickMarks = () => {
    const ticks = [];
    const tickCount = 10; // 10 ticks for 50 days
    const tickSpacing = thermometerHeight / tickCount;
    
    for (let i = 1; i <= tickCount; i++) {
      const y = thermometerHeight - (i * tickSpacing);
      const isActive = i * 5 <= streakCount;
      
      ticks.push(
        <View
          key={i}
          style={[
            styles.tick,
            {
              left: thermometerWidth + 4,
              top: y - 1,
              backgroundColor: isActive ? colors.accentAlt : colors.stroke,
              opacity: isActive ? 1 : 0.3,
            }
          ]}
        />
      );
    }
    return ticks;
  };

  return (
    <View style={[styles.container, { width: size, height: size + (showText ? 32 : 0) }]}>
      <Animated.View
        style={[
          styles.thermometerContainer,
          {
            shadowColor: colors.accent,
            shadowRadius: thermometerGlow,
            shadowOpacity: 0.6,
            shadowOffset: { width: 0, height: 0 },
          }
        ]}
      >
        {/* Thermometer background */}
        <View style={[styles.thermometerBg, { width: thermometerWidth, height: thermometerHeight }]}>
          
          {/* SVG gradient fill */}
          <Svg width={thermometerWidth} height={thermometerHeight} style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="streakGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <Stop offset="0%" stopColor={colors.accent} stopOpacity="1" />
                <Stop offset="70%" stopColor={colors.gold} stopOpacity="1" />
                <Stop offset="100%" stopColor={colors.success} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            
            {/* Filled portion */}
            <Rect
              x="2"
              y={thermometerHeight - fillHeight}
              width={thermometerWidth - 4}
              height={fillHeight}
              fill="url(#streakGradient)"
              rx="2"
            />
          </Svg>
          
          {/* Pixel segments overlay for raster effect */}
          {Array.from({ length: Math.min(segmentCount, 20) }, (_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  bottom: (i * (thermometerHeight / 20)) + 2,
                  width: thermometerWidth - 6,
                  backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                }
              ]}
            />
          ))}
        </View>
        
        {/* Tick marks */}
        {renderTickMarks()}
      </Animated.View>
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[
            fontsLoaded ? typography.statNumber : { ...typography.statNumber, fontFamily: 'monospace' },
            { fontSize: 16, color: colors.accentAlt }
          ]}>
            {streakCount}
          </Text>
          <Text style={[
            fontsLoaded ? typography.statLabel : { ...typography.statLabel, fontFamily: 'monospace' },
            { color: colors.textDim }
          ]}>
            DAY STREAK
          </Text>
        </View>
      )}
      
      {/* Achievement sparkle */}
      {streakCount > 0 && streakCount % 5 === 0 && (
        <Animated.View
          style={[
            styles.achievementSparkle,
            {
              opacity: glowAnim,
              transform: [{ scale: glowAnim }],
            }
          ]}
        >
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thermometerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thermometerBg: {
    backgroundColor: colors.panel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.stroke,
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    left: 3,
    height: 2,
    borderRadius: 1,
  },
  tick: {
    position: 'absolute',
    width: 6,
    height: 2,
    borderRadius: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  achievementSparkle: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkleText: {
    fontSize: 20,
  },
});