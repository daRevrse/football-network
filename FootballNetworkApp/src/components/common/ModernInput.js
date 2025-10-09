// ====== src/components/common/ModernInput.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

export const ModernInput = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    leftIconName,
    rightIconName,
    onRightIconPress,
    secureTextEntry,
    ...props
  }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    const handleToggleSecure = () => {
      setIsSecure(!isSecure);
    };

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            error && styles.inputWrapperError,
          ]}
        >
          {leftIconName && (
            <View style={styles.leftIconContainer}>
              <Icon
                name={leftIconName}
                size={DIMENSIONS.ICON_SIZE_SM}
                color={
                  error
                    ? COLORS.ERROR
                    : isFocused
                    ? COLORS.PRIMARY
                    : COLORS.TEXT_MUTED
                }
              />
            </View>
          )}

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.TEXT_MUTED}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={isSecure}
            {...props}
          />

          {secureTextEntry && (
            <TouchableOpacity
              onPress={handleToggleSecure}
              style={styles.rightIconContainer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={isSecure ? 'eye-off' : 'eye'}
                size={DIMENSIONS.ICON_SIZE_SM}
                color={COLORS.TEXT_MUTED}
              />
            </TouchableOpacity>
          )}

          {!secureTextEntry && rightIconName && (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightIconContainer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={rightIconName}
                size={DIMENSIONS.ICON_SIZE_SM}
                color={COLORS.TEXT_MUTED}
              />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={16} color={COLORS.ERROR} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  label: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACING_XXS,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: DIMENSIONS.INPUT_HEIGHT_SM,
    backgroundColor: COLORS.WHITE,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: DIMENSIONS.BORDER_WIDTH_MEDIUM,
    borderColor: COLORS.BORDER,
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    ...SHADOWS.SMALL,
  },
  inputWrapperFocused: {
    borderColor: COLORS.PRIMARY,
    ...SHADOWS.FOCUS,
  },
  inputWrapperError: {
    borderColor: COLORS.ERROR,
    ...SHADOWS.SMALL,
  },
  leftIconContainer: {
    marginRight: DIMENSIONS.SPACING_SM,
  },
  rightIconContainer: {
    marginLeft: DIMENSIONS.SPACING_SM,
  },
  input: {
    flex: 1,
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.WEIGHT.REGULAR,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACING_XS,
  },
  errorText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.ERROR,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    marginLeft: DIMENSIONS.SPACING_XXS,
  },
});
