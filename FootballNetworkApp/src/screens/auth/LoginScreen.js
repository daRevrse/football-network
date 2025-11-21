// ====== src/screens/auth/LoginScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ModernInput, ModernButton } from '../../components/common';
import { COLORS, DIMENSIONS } from '../../styles/theme';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';

const { height } = Dimensions.get('window');

// Constantes du thème Dark
const DARK_THEME = {
  BG: '#0F172A', // Slate 900
  SURFACE: '#1E293B', // Slate 800
  TEXT: '#F8FAFC', // Slate 50
  TEXT_SEC: '#94A3B8', // Slate 400
  ACCENT: '#22C55E', // Green 500
  BORDER: '#334155', // Slate 700
};

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState(__DEV__ ? 'test@example.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password123' : '');
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuthImproved();

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Erreur de connexion', result.error);
    }
  }, [email, password, login]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_THEME.BG} />

      {/* Décoration de fond subtile */}
      <View style={styles.glowEffect} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Icon name="activity" size={40} color={DARK_THEME.ACCENT} />
            </View>
            <Text style={styles.title}>FOOTBALL{'\n'}NETWORK</Text>
            <Text style={styles.subtitle}>Rejoignez le terrain.</Text>
          </View>

          <View style={styles.formSection}>
            <ModernInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="nom@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
              // Styles Dark Mode
              inputStyle={styles.darkInput}
              labelStyle={styles.darkLabel}
              placeholderTextColor={DARK_THEME.TEXT_SEC}
              style={{ marginBottom: 20 }}
            />

            <ModernInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock"
              // Styles Dark Mode
              inputStyle={styles.darkInput}
              labelStyle={styles.darkLabel}
              placeholderTextColor={DARK_THEME.TEXT_SEC}
            />

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <ModernButton
              title="SE CONNECTER"
              onPress={handleLogin}
              variant="primary"
              fullWidth
              isLoading={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.divider} />
            </View>

            <ModernButton
              title="Créer un compte"
              onPress={() => navigation.navigate('Register')}
              variant="outline"
              fullWidth
              // Override pour le style outline dark
              style={styles.registerButton}
              textStyle={{ color: DARK_THEME.TEXT }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_THEME.BG,
  },
  glowEffect: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: DARK_THEME.ACCENT,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: DARK_THEME.TEXT,
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: DARK_THEME.TEXT_SEC,
    fontWeight: '500',
  },
  formSection: {
    flex: 1,
  },
  // Styles spécifiques Dark Mode pour ModernInput
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
    marginBottom: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginVertical: 16,
  },
  forgotText: {
    color: DARK_THEME.ACCENT,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: DARK_THEME.ACCENT,
    borderWidth: 0,
    height: 56,
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: DARK_THEME.BORDER,
  },
  dividerText: {
    color: DARK_THEME.TEXT_SEC,
    marginHorizontal: 16,
    fontWeight: '600',
    fontSize: 12,
  },
  registerButton: {
    borderColor: DARK_THEME.BORDER,
    backgroundColor: 'transparent',
    borderWidth: 2,
    height: 56,
  },
});
