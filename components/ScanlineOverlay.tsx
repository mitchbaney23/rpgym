import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';
import { colors } from '../theme/tokens';

interface ScanlineOverlayProps {
  intensity?: number; // 0-1, controls opacity
}

export const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({
  intensity = 0.08,
}) => {
  const { width, height } = Dimensions.get('window');
  
  return (
    <View
      style={[StyleSheet.absoluteFill, { opacity: intensity, zIndex: 1000 }]}
      pointerEvents="none"
    >
      {/* Horizontal scanlines using SVG */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="scanlines"
            patternUnits="userSpaceOnUse"
            width="2"
            height="4"
          >
            <Line
              x1="0"
              y1="0"
              x2="2"
              y2="0"
              stroke={colors.accentAlt}
              strokeWidth="1"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scanlines)" />
      </Svg>
    </View>
  );
};