import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radii, shadows } from '../theme/tokens';
import { typography } from '../theme/typography';
import { useFonts } from '../hooks/useFonts';
import { LevelUpEvent } from '../types/domain';
import { SKILL_DISPLAY_NAMES } from '../types/domain';

interface LevelUpBannerProps {
  levelUpEvent: LevelUpEvent | null;
  onDismiss: () => void;
}

export const LevelUpBanner: React.FC<LevelUpBannerProps> = ({
  levelUpEvent,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fontsLoaded = useFonts();

  useEffect(() => {
    if (levelUpEvent) {
      // Enhanced pixel slide-in animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Overshoot and settle
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Glow pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        dismissBanner();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [levelUpEvent]);

  const dismissBanner = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!levelUpEvent) return null;

  const skillDisplayName = SKILL_DISPLAY_NAMES[levelUpEvent.skillId];
  
  const shadowGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 20],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.bannerShadow,
          {
            shadowRadius: shadowGlow,
          }
        ]}
      >
        <LinearGradient
          colors={[
            colors.accent,
            colors.gold,
            colors.accentAlt,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.5, 1]}
          style={styles.banner}
        >
          <View style={styles.content}>
            <Text style={[
              fontsLoaded ? typography.h3 : { ...typography.h3, fontFamily: 'monospace' },
              styles.title
            ]}>
              LEVEL UP!
            </Text>
            <Text style={[
              fontsLoaded ? typography.labelLarge : { ...typography.labelLarge, fontFamily: 'monospace' },
              styles.subtitle
            ]}>
              {skillDisplayName.toUpperCase()} L{levelUpEvent.newLevel}
            </Text>
          </View>
          
          <View style={styles.levelIndicator}>
            <Text style={[
              fontsLoaded ? typography.numberLarge : { ...typography.numberLarge, fontFamily: 'monospace' },
              styles.levelText
            ]}>
              {levelUpEvent.newLevel}
            </Text>
          </View>
          
          {/* Pixel corner decorations */}
          <View style={styles.pixelCorners}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: spacing[4],
    right: spacing[4],
    zIndex: 1000,
  },
  bannerShadow: {
    shadowColor: colors.accentAlt,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    elevation: 12,
  },
  banner: {
    borderRadius: radii.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.stroke,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.text,
    marginBottom: spacing.xs,
    textShadowColor: colors.bg,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: colors.text,
    opacity: 0.95,
    textShadowColor: colors.bg,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  levelIndicator: {
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  levelText: {
    color: colors.accentAlt,
  },
  pixelCorners: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: colors.text,
    opacity: 0.3,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
});