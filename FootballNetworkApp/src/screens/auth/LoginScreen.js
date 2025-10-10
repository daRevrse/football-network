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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ModernInput, ModernButton, InfoBox } from '../../components/common';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState(__DEV__ ? 'test@example.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password123' : '');
  const [errors, setErrors] = useState({});

  // Utiliser le hook useAuthImproved qui gère tout
  const { login, isLoading, error } = useAuthImproved();

  const handleEmailChange = useCallback(
    value => {
      setEmail(value);
      if (errors.email) {
        setErrors(prev => ({ ...prev, email: null }));
      }
    },
    [errors.email],
  );

  const handlePasswordChange = useCallback(
    value => {
      setPassword(value);
      if (errors.password) {
        setErrors(prev => ({ ...prev, password: null }));
      }
    },
    [errors.password],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      // Navigation automatique gérée par AppNavigator
      console.log('✅ Connexion réussie');
    } else {
      // Afficher l'erreur à l'utilisateur
      Alert.alert(
        'Erreur de connexion',
        result.error || 'Une erreur est survenue',
        [{ text: 'OK' }],
      );
    }
  }, [email, password, validateForm, login]);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.PRIMARY }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="activity" size={48} color={COLORS.WHITE} />
            </View>
            <Text style={styles.title}>Football Network</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

          {/* Card de connexion */}
          <View style={[styles.card, { backgroundColor: COLORS.WHITE }]}>
            {/* Afficher l'erreur globale si elle existe */}
            {error && (
              <InfoBox
                type="error"
                message={error}
                style={{ marginBottom: DIMENSIONS.SPACING_MD }}
              />
            )}

            {/* Formulaire */}
            <ModernInput
              icon="mail"
              placeholder="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              editable={!isLoading}
            />

            <ModernInput
              icon="lock"
              placeholder="Mot de passe"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              error={errors.password}
              editable={!isLoading}
            />

            {/* Mot de passe oublié */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isLoading}
            >
              <Text
                style={[styles.forgotPasswordText, { color: COLORS.PRIMARY }]}
              >
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

            {/* Bouton de connexion */}
            <ModernButton
              title="Se connecter"
              onPress={handleLogin}
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              leftIconName="log-in"
            />

            {/* Séparateur */}
            <View style={styles.divider}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: COLORS.BORDER_LIGHT },
                ]}
              />
              <Text style={[styles.dividerText, { color: COLORS.TEXT_MUTED }]}>
                OU
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: COLORS.BORDER_LIGHT },
                ]}
              />
            </View>

            {/* Bouton d'inscription */}
            <TouchableOpacity
              style={[styles.signupButton, { borderColor: COLORS.PRIMARY }]}
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Icon name="user-plus" size={20} color={COLORS.PRIMARY} />
              <Text
                style={[styles.signupButtonText, { color: COLORS.PRIMARY }]}
              >
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: COLORS.WHITE }]}>
              En vous connectant, vous acceptez nos
            </Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: COLORS.WHITE }]}>
                Conditions d'utilisation
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: DIMENSIONS.SPACING_XXL,
  },
  header: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XXL,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  title: {
    fontSize: FONTS.SIZE.XXXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.WHITE,
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  subtitle: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  card: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_XL,
    padding: DIMENSIONS.SPACING_XL,
    ...SHADOWS.LARGE,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: DIMENSIONS.SPACING_LG,
    paddingVertical: DIMENSIONS.SPACING_XS,
  },
  forgotPasswordText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DIMENSIONS.SPACING_LG,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginHorizontal: DIMENSIONS.SPACING_MD,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 2,
    gap: DIMENSIONS.SPACING_SM,
  },
  signupButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  footer: {
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACING_XL,
  },
  footerText: {
    fontSize: FONTS.SIZE.SM,
    opacity: 0.8,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  footerLink: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    textDecorationLine: 'underline',
  },
});
