/**
 * PremiumButton - Bouton avec effet glow premium
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

export const PremiumButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost'
  size = 'large', // 'small' | 'medium' | 'large'
  icon = null,
  iconPosition = 'right',
  disabled = false,
  loading = false,
  style = {},
  textStyle = {},
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 10,
          paddingHorizontal: 20,
          fontSize: 14,
          iconSize: 16,
        };
      case 'medium':
        return {
          paddingVertical: 14,
          paddingHorizontal: 28,
          fontSize: 15,
          iconSize: 18,
        };
      case 'large':
      default:
        return {
          paddingVertical: 18,
          paddingHorizontal: 36,
          fontSize: 16,
          iconSize: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderContent = () => {
    const textColor =
      variant === 'outline' || variant === 'ghost'
        ? COLORS.PRIMARY
        : COLORS.WHITE;

    const content = (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && (
          <Icon
            name={icon}
            size={sizeStyles.iconSize}
            color={disabled ? COLORS.TEXT_MUTED : textColor}
            style={styles.iconLeft}
          />
        )}

        {loading ? (
          <ActivityIndicator
            color={disabled ? COLORS.TEXT_MUTED : textColor}
            size="small"
          />
        ) : (
          <Text
            style={[
              styles.text,
              { fontSize: sizeStyles.fontSize },
              { color: disabled ? COLORS.TEXT_MUTED : textColor },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}

        {icon && iconPosition === 'right' && !loading && (
          <Icon
            name={icon}
            size={sizeStyles.iconSize}
            color={disabled ? COLORS.TEXT_MUTED : textColor}
            style={styles.iconRight}
          />
        )}
      </View>
    );

    // Primary variant avec gradient
    if (variant === 'primary' && !disabled) {
      return (
        <LinearGradient
          colors={GRADIENTS.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
            },
          ]}
        >
          {content}
        </LinearGradient>
      );
    }

    return (
      <View
        style={[
          styles.innerButton,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          variant === 'secondary' && styles.secondaryInner,
          variant === 'outline' && styles.outlineInner,
          variant === 'ghost' && styles.ghostInner,
          disabled && styles.disabledInner,
        ]}
      >
        {content}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        variant === 'primary' && !disabled && SHADOWS.glow,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          styles.button,
          variant === 'outline' && styles.outlineButton,
          variant === 'ghost' && styles.ghostButton,
          disabled && styles.disabledButton,
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'transparent',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  gradient: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  secondaryInner: {
    backgroundColor: COLORS.GLASS,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  outlineInner: {
    backgroundColor: 'transparent',
  },
  ghostInner: {
    backgroundColor: 'transparent',
  },
  disabledInner: {
    backgroundColor: COLORS.INPUT_DISABLED,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default PremiumButton;
