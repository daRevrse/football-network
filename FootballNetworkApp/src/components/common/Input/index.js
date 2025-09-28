import React from 'react';
import { View, TextInput, Text } from 'react-native';

// Constantes
const COLORS = {
  PRIMARY: '#22C55E',
  TEXT_PRIMARY: '#1F2937',
  TEXT_WHITE: '#FFFFFF',
  CARD_BACKGROUND: '#FFFFFF',
  BORDER: '#E5E7EB',
  ERROR: '#EF4444',
  TEXT_MUTED: '#9CA3AF',
};

const DIMENSIONS = {
  SPACING_MD: 16,
  SPACING_SM: 8,
  INPUT_HEIGHT: 48,
  BORDER_RADIUS_MD: 8,
};

const FONTS = {
  SIZE: {
    SM: 14,
    MD: 16,
  },
};

// Composant Input stable qui ne perd pas le focus
const Input = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    style = {},
    ...props
  }) => {
    return (
      <View style={[{ marginBottom: DIMENSIONS.SPACING_MD }, style]}>
        {label && (
          <Text
            style={{
              fontSize: FONTS.SIZE.SM,
              fontWeight: '500',
              color: COLORS.TEXT_PRIMARY,
              marginBottom: DIMENSIONS.SPACING_SM,
            }}
          >
            {label}
          </Text>
        )}
        <TextInput
          style={{
            height: DIMENSIONS.INPUT_HEIGHT,
            borderWidth: 1,
            borderColor: error ? COLORS.ERROR : COLORS.BORDER,
            borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
            paddingHorizontal: DIMENSIONS.SPACING_MD,
            backgroundColor: COLORS.CARD_BACKGROUND,
            fontSize: FONTS.SIZE.MD,
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT_MUTED}
          {...props}
        />
        {error && (
          <Text
            style={{
              fontSize: FONTS.SIZE.SM,
              color: COLORS.ERROR,
              marginTop: DIMENSIONS.SPACING_SM,
            }}
          >
            {error}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

export default Input;
