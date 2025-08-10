import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, spacing, radii } from '../theme/tokens';
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
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (levelUpEvent) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

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
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!levelUpEvent) return null;

  const skillDisplayName = SKILL_DISPLAY_NAMES[levelUpEvent.skillId];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.banner}>
        <View style={styles.content}>
          <Text style={styles.title}>🎉 Level Up!</Text>
          <Text style={styles.subtitle}>
            {skillDisplayName} L{levelUpEvent.newLevel}
          </Text>
        </View>
        
        <View style={styles.levelIndicator}>
          <Text style={styles.levelText}>
            {levelUpEvent.newLevel}
          </Text>
        </View>
      </View>
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
  banner: {
    backgroundColor: colors.success,
    borderRadius: radii.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.h5,
    color: colors.white,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  levelIndicator: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[3],
  },
  levelText: {
    ...typography.labelLarge,
    color: colors.success,
    fontWeight: 'bold',
  },
});