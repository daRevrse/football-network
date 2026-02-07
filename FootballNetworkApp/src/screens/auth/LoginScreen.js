/**
 * LoginScreen - Écran de connexion premium
 * Design cohérent avec le reste de l'onboarding
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';
import { PremiumInput, PremiumButton } from '../../components/premium';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { height, width } = Dimensions.get('window');

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState(__DEV__ ? 'test@example.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password123' : '');
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuthImproved();
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleLogin = useCallback(async () => {
    // Validation
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    if (!password) {
      newErrors.password = 'Mot de passe requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const result = await login(email, password);
    if (!result.success) {
      Alert.alert('Erreur de connexion', result.error);
    }
  }, [email, password, login]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background image avec overlay */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(0, 123, 64, 0.85)',
            'rgba(0, 60, 32, 0.9)',
            'rgba(10, 10, 10, 0.98)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={styles.overlay}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Bouton retour */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="arrow-left" size={22} color={COLORS.WHITE} />
              </TouchableOpacity>

              {/* Header avec logo */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Bon retour !</Text>
                <Text style={styles.subtitle}>
                  Prêt pour le prochain match ? Connecte-toi.
                </Text>
              </View>

              {/* Card formulaire */}
              <View style={styles.card}>
                {/* Email */}
                <PremiumInput
                  label="Email"
                  placeholder="ton@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  icon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />

                {/* Mot de passe */}
                <View style={styles.passwordContainer}>
                  <View style={styles.passwordHeader}>
                    <Text style={styles.label}>Mot de passe</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ForgotPassword')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.forgotLink}>Oublié ?</Text>
                    </TouchableOpacity>
                  </View>
                  <PremiumInput
                    placeholder="••••••••"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    icon="lock"
                    secureTextEntry
                    error={errors.password}
                    style={{ marginBottom: 0 }}
                  />
                </View>

                {/* Bouton de connexion */}
                <Animated.View
                  style={[
                    styles.buttonWrapper,
                    { transform: [{ scale: buttonScale }] },
                    !isLoading && SHADOWS.glow,
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleLogin}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={isLoading ? [COLORS.BORDER, COLORS.BORDER] : GRADIENTS.button}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.loginButton}
                    >
                      {isLoading ? (
                        <>
                          <ActivityIndicator color={COLORS.WHITE} size="small" />
                          <Text style={styles.loginButtonText}>Connexion...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Se connecter</Text>
                          <Icon name="arrow-right" size={20} color={COLORS.WHITE} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OU</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Bouton Google */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => {
                    Alert.alert(
                      'Google Sign-In',
                      'Cette fonctionnalité sera bientôt disponible',
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri: 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png',
                    }}
                    style={styles.googleLogo}
                  />
                  <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                </TouchableOpacity>

                {/* Lien inscription */}
                <View style={styles.signupRow}>
                  <Text style={styles.signupText}>Pas encore de compte ? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('RoleSelection')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.signupLink}>Créer un compte</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <Text style={styles.footer}>
                © 2025 Foot Connect. Tous droits réservés.
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.GLASS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    marginBottom: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
    ...SHADOWS.glow,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.WHITE,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: COLORS.GLASS,
    borderRadius: RADIUS.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    ...SHADOWS.medium,
  },

  // Password section
  passwordContainer: {
    marginBottom: 24,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  forgotLink: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Button
  buttonWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.WHITE,
    letterSpacing: 0.5,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.BORDER,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    fontWeight: '600',
    marginHorizontal: 16,
    letterSpacing: 1,
  },

  // Google button
  googleButton: {
    backgroundColor: COLORS.GLASS,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },

  // Signup row
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
  signupLink: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Footer
  footer: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    marginTop: 32,
  },
});

export default LoginScreen;
