// ====== src/components/common/ModernInput.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

export const ModernInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  maxLength,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: COLORS.TEXT_PRIMARY }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: editable ? COLORS.WHITE : COLORS.BACKGROUND_LIGHT,
            borderColor: error
              ? COLORS.ERROR
              : isFocused
              ? COLORS.PRIMARY
              : COLORS.TEXT_ULTRA_LIGHT,
          },
          multiline && styles.inputContainerMultiline,
        ]}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={
              error
                ? COLORS.ERROR
                : isFocused
                ? COLORS.PRIMARY
                : COLORS.TEXT_MUTED
            }
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            { color: COLORS.TEXT_PRIMARY },
            !editable && { color: COLORS.TEXT_MUTED },
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT_MUTED}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={handleTogglePassword}
            style={styles.rightIcon}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.TEXT_MUTED}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Icon name={rightIcon} size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={COLORS.ERROR} />
          <Text style={[styles.errorText, { color: COLORS.ERROR }]}>
            {error}
          </Text>
        </View>
      )}

      {maxLength && !error && (
        <Text style={[styles.helperText, { color: COLORS.TEXT_MUTED }]}>
          {value?.length || 0}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  label: {
    fontSize: FONTS.SIZE_SM,
    fontWeight: FONTS.WEIGHT_MEDIUM,
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    ...SHADOWS.SMALL,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: DIMENSIONS.PADDING_SM,
  },
  leftIcon: {
    marginRight: DIMENSIONS.SPACING_SM,
  },
  rightIcon: {
    marginLeft: DIMENSIONS.SPACING_SM,
    padding: DIMENSIONS.PADDING_XS,
  },
  input: {
    flex: 1,
    fontSize: FONTS.SIZE_MD,
    paddingVertical: DIMENSIONS.PADDING_MD,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: DIMENSIONS.PADDING_MD,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACING_XS,
    gap: 4,
  },
  errorText: {
    fontSize: FONTS.SIZE_SM,
  },
  helperText: {
    fontSize: FONTS.SIZE_XS,
    textAlign: 'right',
    marginTop: DIMENSIONS.SPACING_XS,
  },
});
