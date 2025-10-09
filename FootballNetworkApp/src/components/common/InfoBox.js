// ====== src/components/common/InfoBox.js ======
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS } from '../../styles/theme';

export const InfoBox = ({ type = 'info', title, message, children }) => {
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: COLORS.SUCCESS_LIGHT,
          borderColor: COLORS.SUCCESS,
          textColor: '#065F46',
          iconName: 'check-circle',
        };
      case 'error':
        return {
          bgColor: COLORS.ERROR_LIGHT,
          borderColor: COLORS.ERROR,
          textColor: COLORS.ERROR_DARK,
          iconName: 'alert-circle',
        };
      case 'warning':
        return {
          bgColor: COLORS.WARNING_LIGHT,
          borderColor: COLORS.WARNING,
          textColor: COLORS.WARNING_DARK,
          iconName: 'alert-triangle',
        };
      case 'info':
      default:
        return {
          bgColor: COLORS.INFO_LIGHT,
          borderColor: COLORS.INFO,
          textColor: COLORS.INFO_DARK,
          iconName: 'info',
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderLeftColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon
          name={config.iconName}
          size={20}
          color={config.borderColor}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: config.textColor }]}>
              {title}
            </Text>
          )}
          {message && (
            <Text style={[styles.message, { color: config.textColor }]}>
              {message}
            </Text>
          )}
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_MD,
    marginBottom: DIMENSIONS.SPACING_LG,
    borderLeftWidth: DIMENSIONS.BORDER_WIDTH_THICK,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: DIMENSIONS.SPACING_SM,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  message: {
    fontSize: FONTS.SIZE.XS,
    lineHeight: FONTS.SIZE.XS * FONTS.LINE_HEIGHT.RELAXED,
  },
});
