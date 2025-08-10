import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { colors, spacing } from '../theme/tokens';
import { typography } from '../theme/typography';
import { useFonts } from '../hooks/useFonts';

interface ProgressRingProps {
  level: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLevel?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  level,
  size = 80,
  strokeWidth = 8,
  color = colors.accentAlt,
  showLevel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const fontsLoaded = useFonts();
  
  // Progress is based on level (0-99 maps to 0-100%)
  const progress = Math.min(level / 99, 1);
  
  // Simple progress ring without dashes for now
  const strokeDashoffset = circumference * (1 - progress);
  
  // Animation for level up effect
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Trigger subtle glow animation on level change
    if (level > 0) {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [level, glowAnim]);

  const ringGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Animated container for glow effect */}
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          shadowColor: color,
          shadowOpacity: 0.4,
          shadowRadius: ringGlow,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <SvgLinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.8" />
            </SvgLinearGradient>
          </Defs>
          
          {/* Background ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.ringBg}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#ringGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
      </Animated.View>
      
      {/* Level display */}
      {showLevel && (
        <View style={styles.levelContainer}>
          <Text style={[
            fontsLoaded ? typography.levelNumber : { ...typography.levelNumber, fontFamily: 'monospace' },
            { color: colors.text, fontSize: size * 0.25 }
          ]}>
            {level}
          </Text>
          <Text style={[
            fontsLoaded ? typography.levelLabel : { ...typography.levelLabel, fontFamily: 'monospace' },
            { fontSize: size * 0.08 }
          ]}>
            LEVEL
          </Text>
        </View>
      )}
      
      {/* Sparkle particles for level up (could be enhanced) */}
      <Animated.View
        style={[
          styles.sparkleContainer,
          {
            opacity: glowAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.sparkle, { backgroundColor: color }]} />
        <View style={[styles.sparkle, styles.sparkle2, { backgroundColor: colors.gold }]} />
        <View style={[styles.sparkle, styles.sparkle3, { backgroundColor: color }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  levelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  sparkle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  sparkle2: {
    top: '20%',
    right: '25%',
    width: 2,
    height: 2,
  },
  sparkle3: {
    bottom: '25%',
    left: '20%',
    width: 2,
    height: 2,
  },
});