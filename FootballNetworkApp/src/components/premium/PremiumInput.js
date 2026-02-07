/**
 * PremiumInput - Input style premium avec effet glass
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../theme/colors';

export const PremiumInput = ({
  label = '',
  placeholder = '',
  value = '',
  onChangeText,
  icon = null,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = '',
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style = {},
  inputStyle = {},
  maxLength,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.INPUT_BORDER, COLORS.PRIMARY],
  });

  const isError = !!error;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, isError && styles.labelError]}>{label}</Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor: isError
              ? COLORS.INPUT_ERROR
              : isFocused
              ? COLORS.PRIMARY
              : COLORS.INPUT_BORDER,
          },
          isFocused && !isError && SHADOWS.glow,
          disabled && styles.inputDisabled,
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Icon
              name={icon}
              size={20}
              color={
                isError
                  ? COLORS.INPUT_ERROR
                  : isFocused
                  ? COLORS.PRIMARY
                  : COLORS.TEXT_MUTED
              }
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            secureTextEntry && styles.inputWithToggle,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.PLACEHOLDER}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          selectionColor={COLORS.PRIMARY}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.TEXT_MUTED}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {isError && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={COLORS.INPUT_ERROR} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  labelError: {
    color: COLORS.INPUT_ERROR,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  inputDisabled: {
    backgroundColor: COLORS.INPUT_DISABLED,
    opacity: 0.6,
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  inputWithToggle: {
    paddingRight: 50,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  toggleButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: COLORS.INPUT_ERROR,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default PremiumInput;
