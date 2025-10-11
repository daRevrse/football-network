// ====== src/components/common/SectionCard.js ======
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

export const SectionCard = ({
  title,
  description,
  icon,
  iconColor,
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {(title || description || icon) && (
        <View style={styles.header}>
          {icon && (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: iconColor
                    ? `${iconColor}20`
                    : `${COLORS.PRIMARY}20`,
                },
              ]}
            >
              <Icon name={icon} size={18} color={iconColor || COLORS.PRIMARY} />
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

      <View style={[styles.content, { backgroundColor: COLORS.WHITE }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_SM,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.SIZE_MD,
    fontWeight: FONTS.WEIGHT_SEMIBOLD,
    marginBottom: 2,
  },
  description: {
    fontSize: FONTS.SIZE_SM,
  },
  content: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.PADDING_MD,
    ...SHADOWS.SMALL,
  },
});
