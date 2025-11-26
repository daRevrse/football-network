// ====== src/screens/auth/ForgotPasswordScreen.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ModernInput, ModernButton } from '../../components/common';

const DARK_THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

export const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigation.goBack();
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_THEME.BG} />

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.closeBtn}
      >
        <Icon name="x" size={24} color={DARK_THEME.TEXT} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="unlock" size={32} color={DARK_THEME.ACCENT} />
        </View>

        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.text}>
          Entrez votre email pour recevoir les instructions de réinitialisation.
        </Text>

        <ModernInput
          label="Email"
          value={email}
          placeholder="email@example.com"
          onChangeText={setEmail}
          leftIcon="mail"
          keyboardType="email-address"
          autoCapitalize="none"
          // Dark Styles
          inputStyle={styles.darkInput}
          labelStyle={styles.darkLabel}
          placeholderTextColor={DARK_THEME.TEXT_SEC}
        />

        <ModernButton
          title="ENVOYER LE LIEN"
          onPress={handleSubmit}
          variant="primary"
          isLoading={isLoading}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_THEME.BG,
    padding: 24,
  },
  closeBtn: {
    marginTop: Platform.OS === 'ios' ? 60 : 30,
    alignSelf: 'flex-end',
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -50,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DARK_THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: DARK_THEME.BORDER,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DARK_THEME.TEXT,
    textAlign: 'center',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: DARK_THEME.TEXT_SEC,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  darkInput: {
    backgroundColor: DARK_THEME.SURFACE,
    borderColor: DARK_THEME.BORDER,
    color: DARK_THEME.TEXT,
    borderWidth: 1,
  },
  darkLabel: {
    color: DARK_THEME.TEXT_SEC,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: DARK_THEME.ACCENT,
    height: 56,
    marginTop: 24,
    borderWidth: 0,
  },
});
