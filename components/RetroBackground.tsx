import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';
import { colors, layout } from '../theme/tokens';
import { ScanlineOverlay } from './ScanlineOverlay';

interface RetroBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showGrid?: boolean;
  showScanlines?: boolean;
}

export const RetroBackground: React.FC<RetroBackgroundProps> = ({
  children,
  style,
  showGrid = true,
  showScanlines = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Dithered gradient background */}
      <LinearGradient
        colors={[colors.bg, colors.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Grid overlay */}
      {showGrid && (
        <GridOverlay />
      )}
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* CRT scanlines overlay */}
      {showScanlines && <ScanlineOverlay />}
    </View>
  );
};

// Grid overlay component using SVG for mobile compatibility
const GridOverlay: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  const gridSize = layout.gridSize;
  
  return (
    <Svg
      height={height}
      width={width}
      style={[StyleSheet.absoluteFill, { zIndex: 0, opacity: 0.1 }]}
    >
      <Defs>
        <Pattern
          id="grid"
          patternUnits="userSpaceOnUse"
          width={gridSize}
          height={gridSize}
        >
          <Line
            x1="0"
            y1="0"
            x2={gridSize}
            y2="0"
            stroke={colors.stroke}
            strokeWidth="0.5"
          />
          <Line
            x1="0"
            y1="0"
            x2="0"
            y2={gridSize}
            stroke={colors.stroke}
            strokeWidth="0.5"
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grid)" />
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});