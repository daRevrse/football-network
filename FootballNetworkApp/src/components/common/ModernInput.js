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
  leftIcon, // Supporte leftIcon
  leftIconName, // Supporte leftIconName (rétrocompatibilité)
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
  inputStyle, // Nouveau prop pour surcharger le style de l'input
  labelStyle, // Nouveau prop pour le label
  placeholderTextColor, // Nouveau prop
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Gestion double props pour l'icône
  const iconName = leftIcon || leftIconName;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[styles.label, { color: COLORS.TEXT_PRIMARY }, labelStyle]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            // Par défaut blanc, mais surchargeable via inputStyle
            backgroundColor: editable ? COLORS.WHITE : COLORS.BACKGROUND_LIGHT,
            borderColor: error
              ? COLORS.ERROR
              : isFocused
              ? COLORS.PRIMARY
              : COLORS.BORDER,
          },
          multiline && styles.inputContainerMultiline,
          inputStyle, // Appliquer la surcharge ici
        ]}
      >
        {iconName && (
          <Icon
            name={iconName}
            size={20}
            color={
              error
                ? COLORS.ERROR
                : isFocused
                ? COLORS.PRIMARY
                : inputStyle?.color || COLORS.TEXT_MUTED // Adapter la couleur de l'icône
            }
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            { color: COLORS.TEXT_PRIMARY },
            !editable && { color: COLORS.TEXT_MUTED },
            inputStyle && { color: inputStyle.color }, // Adapter la couleur du texte
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || COLORS.TEXT_MUTED}
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
              color={inputStyle?.color || COLORS.TEXT_MUTED}
            />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56, // Hauteur fixe plus moderne
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
    height: 'auto',
    minHeight: 100,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
  },
});
