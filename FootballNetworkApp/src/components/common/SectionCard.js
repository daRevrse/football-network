// ====== src/components/common/SectionCard.js ======
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

export const SectionCard = ({
  title,
  description,
  icon,
  children,
  style,
  headerStyle,
  contentStyle,
  iconColor,
  backgroundColor,
}) => {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: backgroundColor || COLORS.WHITE },
        style,
      ]}
    >
      {/* Header */}
      {(title || icon) && (
        <View style={[styles.header, headerStyle]}>
          {icon && (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: iconColor
                    ? `${iconColor}20`
                    : COLORS.PRIMARY_LIGHT,
                },
              ]}
            >
              <Icon name={icon} size={20} color={iconColor || COLORS.PRIMARY} />
            </View>
          )}

          <View style={styles.headerText}>
            {title && (
              <Text style={[styles.title, { color: COLORS.TEXT_PRIMARY }]}>
                {title}
              </Text>
            )}
            {description && (
              <Text
                style={[styles.description, { color: COLORS.TEXT_SECONDARY }]}
              >
                {description}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
    marginBottom: DIMENSIONS.SPACING_MD,
    ...SHADOWS.SMALL,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    paddingBottom: DIMENSIONS.SPACING_SM,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_SM,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  description: {
    fontSize: FONTS.SIZE.SM,
    lineHeight: FONTS.SIZE.SM * 1.4,
  },
  content: {
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingBottom: DIMENSIONS.SPACING_MD,
  },
});
