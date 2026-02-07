/**
 * GradientBackground - Fond gradient premium reutilisable
 * Utilisable avec ou sans image de fond
 */

import React from 'react';
import { View, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export const GradientBackground = ({
  children,
  variant = 'primary', // 'primary' | 'splash' | 'image'
  imageUri = null,
  colors = null,
  style = {},
  overlayOpacity = 0.85,
}) => {
  // Determiner les couleurs du gradient
  const getGradientColors = () => {
    if (colors) return colors;

    switch (variant) {
      case 'splash':
        return GRADIENTS.splash;
      case 'image':
        return [
          'rgba(0, 123, 64, 0.6)',
          'rgba(0, 0, 0, 0.7)',
          `rgba(10, 10, 10, ${overlayOpacity})`,
        ];
      case 'primary':
      default:
        return GRADIENTS.primary;
    }
  };

  const gradientColors = getGradientColors();

  // Avec image de fond
  if (imageUri) {
    return (
      <ImageBackground
        source={{ uri: imageUri }}
        style={[styles.container, style]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        >
          {children}
        </LinearGradient>
      </ImageBackground>
    );
  }

  // Sans image - gradient pur
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    minHeight: height,
  },
  gradient: {
    flex: 1,
  },
});

export default GradientBackground;
