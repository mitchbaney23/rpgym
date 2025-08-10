import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
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
  const flickerAnim = useRef(new Animated.Value(1)).current;
  
  // Calculate flame size based on streak, maxes out at 5 days
  const maxStreak = 5;
  const flameScale = Math.min(streakCount / maxStreak, 1);
  const flameHeight = size * (0.4 + (flameScale * 0.6)); // Grows from 40% to 100% of size
  const flameWidth = size * (0.3 + (flameScale * 0.4)); // Grows proportionally
  
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

  useEffect(() => {
    // Continuous flickering animation when streak is active
    if (streakCount > 0) {
      const flickerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(flickerAnim, {
            toValue: 0.85,
            duration: 100 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(flickerAnim, {
            toValue: 1,
            duration: 100 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ])
      );
      flickerLoop.start();
      return () => flickerLoop.stop();
    }
  }, [streakCount, flickerAnim]);

  const flameGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  // Create flame path based on size
  const createFlamePath = () => {
    const centerX = flameWidth / 2;
    const baseY = flameHeight;
    const tipY = 0;
    
    return `
      M ${centerX} ${baseY}
      Q ${flameWidth * 0.2} ${baseY * 0.8} ${flameWidth * 0.1} ${baseY * 0.6}
      Q ${flameWidth * 0.15} ${baseY * 0.4} ${flameWidth * 0.3} ${baseY * 0.3}
      Q ${flameWidth * 0.4} ${baseY * 0.15} ${centerX} ${tipY}
      Q ${flameWidth * 0.6} ${baseY * 0.15} ${flameWidth * 0.7} ${baseY * 0.3}
      Q ${flameWidth * 0.85} ${baseY * 0.4} ${flameWidth * 0.9} ${baseY * 0.6}
      Q ${flameWidth * 0.8} ${baseY * 0.8} ${centerX} ${baseY}
      Z
    `;
  };

  // Get flame colors based on intensity
  const getFlameColors = () => {
    if (streakCount === 0) return { main: colors.stroke, secondary: colors.strokeDim };
    if (streakCount >= 5) return { main: colors.success, secondary: colors.gold }; // Max intensity: blue-white
    if (streakCount >= 3) return { main: colors.gold, secondary: colors.accent }; // High: gold-orange
    return { main: colors.accent, secondary: colors.danger }; // Low: orange-red
  };

  const flameColors = getFlameColors();

  return (
    <View style={[styles.container, { width: size, height: size + (showText ? 32 : 0) }]}>
      <Animated.View
        style={[
          styles.flameContainer,
          {
            shadowColor: flameColors.main,
            shadowRadius: flameGlow,
            shadowOpacity: streakCount > 0 ? 0.8 : 0,
            shadowOffset: { width: 0, height: 0 },
            transform: [{ scale: flickerAnim }],
          }
        ]}
      >
        {streakCount > 0 ? (
          <Svg width={flameWidth} height={flameHeight} style={styles.flame}>
            <Defs>
              <SvgLinearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <Stop offset="0%" stopColor={flameColors.secondary} stopOpacity="1" />
                <Stop offset="30%" stopColor={flameColors.main} stopOpacity="1" />
                <Stop offset="70%" stopColor={flameColors.main} stopOpacity="0.9" />
                <Stop offset="100%" stopColor={colors.white} stopOpacity="0.8" />
              </SvgLinearGradient>
              
              <SvgLinearGradient id="flameCore" x1="0%" y1="100%" x2="0%" y2="0%">
                <Stop offset="0%" stopColor={flameColors.main} stopOpacity="0.6" />
                <Stop offset="50%" stopColor={colors.gold} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={colors.white} stopOpacity="0.2" />
              </SvgLinearGradient>
            </Defs>
            
            {/* Main flame */}
            <Path d={createFlamePath()} fill="url(#flameGradient)" />
            
            {/* Inner flame core */}
            <Path 
              d={createFlamePath()} 
              fill="url(#flameCore)" 
              transform={`scale(0.6) translate(${flameWidth * 0.2}, ${flameHeight * 0.2})`}
            />
          </Svg>
        ) : (
          // Empty flame holder when no streak
          <View style={[styles.emptyFlame, { width: size * 0.3, height: size * 0.4 }]} />
        )}
      </Animated.View>
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[
            fontsLoaded ? typography.statNumber : { ...typography.statNumber, fontFamily: 'monospace' },
            { 
              fontSize: 16, 
              color: streakCount > 0 ? flameColors.main : colors.textDim 
            }
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
      
      {/* Achievement sparkle for max streak */}
      {streakCount >= 5 && (
        <Animated.View
          style={[
            styles.achievementSparkle,
            {
              opacity: flickerAnim,
              transform: [{ scale: flickerAnim }],
            }
          ]}
        >
          <Text style={styles.sparkleText}>🔥</Text>
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
  flameContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xs,
  },
  flame: {
    alignSelf: 'center',
  },
  emptyFlame: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.strokeDim,
    backgroundColor: colors.panel,
    opacity: 0.3,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  achievementSparkle: {
    position: 'absolute',
    top: -15,
    right: -5,
  },
  sparkleText: {
    fontSize: 24,
  },
});