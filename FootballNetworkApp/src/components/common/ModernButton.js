// ====== src/components/common/ModernButton.js ======
import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

export const ModernButton = React.memo(
  ({
    title,
    onPress,
    disabled = false,
    variant = 'primary',
    leftIconName,
    rightIconName,
    isLoading = false,
    size = 'medium',
    fullWidth = true,
  }) => {
    const buttonStyle = [
      styles.base,
      size === 'small' && styles.small,
      size === 'large' && styles.large,
      !fullWidth && styles.notFullWidth,
    ];

    const getVariantStyle = () => {
      if (disabled) {
        return styles.disabled;
      }

      switch (variant) {
        case 'primary':
          return styles.primary;
        case 'secondary':
          return styles.secondary;
        case 'outline':
          return styles.outline;
        case 'ghost':
          return styles.ghost;
        case 'danger':
          return styles.danger;
        default:
          return styles.primary;
      }
    };

    const getTextColor = () => {
      if (disabled) {
        return COLORS.TEXT_DISABLED;
      }

      switch (variant) {
        case 'primary':
        case 'danger':
          return COLORS.TEXT_WHITE;
        case 'secondary':
        case 'outline':
        case 'ghost':
          return COLORS.PRIMARY;
        default:
          return COLORS.TEXT_WHITE;
      }
    };

    const getIconColor = () => getTextColor();

    return (
      <TouchableOpacity
        style={[...buttonStyle, getVariantStyle()]}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={getTextColor()} size="small" />
            <Text style={[styles.text, { color: getTextColor() }]}>
              Chargement...
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {leftIconName && (
              <Icon
                name={leftIconName}
                size={DIMENSIONS.ICON_SIZE_SM}
                color={getIconColor()}
                style={styles.leftIcon}
              />
            )}

            <Text style={[styles.text, { color: getTextColor() }]}>
              {title}
            </Text>

            {rightIconName && (
              <Icon
                name={rightIconName}
                size={DIMENSIONS.ICON_SIZE_SM}
                color={getIconColor()}
                style={styles.rightIcon}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  base: {
    height: DIMENSIONS.BUTTON_HEIGHT_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
  },
  small: {
    height: 40,
    paddingHorizontal: DIMENSIONS.SPACING_SM,
  },
  large: {
    height: DIMENSIONS.BUTTON_HEIGHT,
    paddingHorizontal: DIMENSIONS.SPACING_LG,
  },
  notFullWidth: {
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: COLORS.PRIMARY,
    ...SHADOWS.MEDIUM,
  },
  secondary: {
    backgroundColor: COLORS.SECONDARY,
    ...SHADOWS.MEDIUM,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: DIMENSIONS.BORDER_WIDTH_MEDIUM,
    borderColor: COLORS.PRIMARY,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.ERROR,
    ...SHADOWS.MEDIUM,
  },
  disabled: {
    backgroundColor: COLORS.TEXT_MUTED,
    ...SHADOWS.SMALL,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    letterSpacing: 0.5,
  },
  leftIcon: {
    marginRight: DIMENSIONS.SPACING_SM,
  },
  rightIcon: {
    marginLeft: DIMENSIONS.SPACING_SM,
  },
});
