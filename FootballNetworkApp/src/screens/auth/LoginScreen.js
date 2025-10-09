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
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { ModernInput, ModernButton, InfoBox } from '../../components/common';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import {
  loginSuccess,
  setLoading,
  setError,
} from '../../store/slices/authSlice';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState(__DEV__ ? 'test@example.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password123' : '');
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const authState = useSelector(state => {
    if (!state || !state.auth) {
      return { isLoading: false, error: null };
    }
    return state.auth;
  });

  const { isLoading, error } = authState;

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

  const handleSimulatedLogin = useCallback(async () => {
    if (!validateForm()) return;

    try {
      dispatch(setLoading(true));
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (email.includes('error')) {
        dispatch(setError('Email ou mot de passe incorrect'));
        Alert.alert('Erreur', 'Email ou mot de passe incorrect');
        return;
      }

      const mockUserData = {
        user: {
          id: 1,
          firstName: 'Jean',
          lastName: 'Dupont',
          email: email,
          phone: '+33 6 12 34 56 78',
          position: 'midfielder',
          skillLevel: 'intermediate',
          locationCity: 'Paris',
        },
        token: 'mock_jwt_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
      };

      dispatch(loginSuccess(mockUserData));
      Alert.alert(
        'Connexion réussie',
        `Bienvenue ${mockUserData.user.firstName} !`,
      );
    } catch (error) {
      console.error('Erreur simulation:', error);
      dispatch(setError('Erreur de simulation'));
    }
  }, [email, validateForm, dispatch]);

  const handleRealLogin = useCallback(async () => {
    if (!validateForm()) return;

    try {
      dispatch(setLoading(true));

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(loginSuccess(data));
        Alert.alert('Connexion réussie', `Bienvenue ${data.user.firstName} !`);
      } else {
        dispatch(setError(data.error || 'Erreur de connexion'));
        Alert.alert('Erreur', data.error || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      dispatch(setError('Erreur réseau'));
      Alert.alert(
        'Erreur de connexion',
        'Impossible de se connecter au serveur.\nVoulez-vous essayer le mode démo ?',
        [
          { text: 'Réessayer', onPress: handleRealLogin },
          { text: 'Mode démo', onPress: handleSimulatedLogin },
          { text: 'Annuler', style: 'cancel' },
        ],
      );
    }
  }, [email, password, validateForm, dispatch, handleSimulatedLogin]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.BACKGROUND_LIGHT}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Icon name="dribbble" size={56} color={COLORS.WHITE} />
              </View>

              <Text style={styles.title}>Bon retour !</Text>
              <Text style={styles.subtitle}>
                Connectez-vous pour organiser vos matchs
              </Text>
            </View>

            {/* Dev Info */}
            {__DEV__ && (
              <InfoBox
                type="warning"
                title="Mode développement"
                message="Champs pré-remplis pour les tests"
              />
            )}

            {/* Global Error */}
            {error && (
              <InfoBox
                type="error"
                title="Erreur de connexion"
                message={error}
              />
            )}

            {/* Form */}
            <View style={styles.form}>
              <ModernInput
                label="Adresse email"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
                leftIconName="mail"
              />

              <ModernInput
                label="Mot de passe"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="••••••••"
                secureTextEntry
                error={errors.password}
                leftIconName="lock"
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>

              <ModernButton
                title="Se connecter"
                onPress={handleRealLogin}
                disabled={isLoading}
                isLoading={isLoading}
                variant="primary"
                leftIconName="log-in"
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <ModernButton
                title="Mode démo"
                onPress={handleSimulatedLogin}
                disabled={isLoading}
                variant="outline"
                leftIconName="play-circle"
              />
            </View>

            {/* Register Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
  },
  header: {
    alignItems: 'center',
    paddingTop: DIMENSIONS.SPACING_XXXL + DIMENSIONS.SPACING_LG,
    paddingBottom: DIMENSIONS.SPACING_XL,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_LG,
    ...SHADOWS.LARGE,
  },
  title: {
    fontSize: FONTS.SIZE.XXXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: FONTS.SIZE.MD * FONTS.LINE_HEIGHT.RELAXED,
  },
  form: {
    marginBottom: DIMENSIONS.SPACING_XL,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  forgotPasswordText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.PRIMARY,
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
    backgroundColor: COLORS.DIVIDER,
  },
  dividerText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_MUTED,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    marginHorizontal: DIMENSIONS.SPACING_MD,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: DIMENSIONS.SPACING_XL,
  },
  footerText: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: FONTS.WEIGHT.REGULAR,
  },
  footerLink: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
});
