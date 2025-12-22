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
  TextInput,
  ImageBackground,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';

const { height, width } = Dimensions.get('window');

const THEME = {
  ACCENT: '#22C55E', // Green 500
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ERROR: '#EF4444',
};

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState(__DEV__ ? 'test@example.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuthImproved();

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Image de fond + Overlay */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2836&auto=format&fit=crop',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay gradient vert-noir comme le web */}
        <LinearGradient
          colors={['rgba(22, 101, 52, 0.9)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
              {/* Header avec logo */}
              <View style={styles.header}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>FN</Text>
                </View>
                <Text style={styles.title}>Bon retour !</Text>
                <Text style={styles.subtitle}>
                  Prêt pour le prochain match ? Connectez-vous.
                </Text>
              </View>

              {/* Card glassmorphism */}
              <View style={styles.card}>
                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Icon
                      name="mail"
                      size={20}
                      color={errors.email ? THEME.ERROR : THEME.TEXT_SEC}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      placeholder="votre@email.com"
                      placeholderTextColor="#6B7280"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && (
                    <View style={styles.errorRow}>
                      <View style={styles.errorDot} />
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                  )}
                </View>

                {/* Mot de passe */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Mot de passe</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text style={styles.forgotLink}>Oublié ?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Icon
                      name="lock"
                      size={20}
                      color={errors.password ? THEME.ERROR : THEME.TEXT_SEC}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, errors.password && styles.inputError]}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) setErrors({ ...errors, password: null });
                      }}
                      placeholder="••••••••"
                      placeholderTextColor="#6B7280"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Icon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={THEME.TEXT_SEC}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <View style={styles.errorRow}>
                      <View style={styles.errorDot} />
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                  )}
                </View>

                {/* Bouton de connexion */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={styles.loginButtonText}>Connexion...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Se connecter</Text>
                      <Icon name="arrow-right" size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider avec OU */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OU</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Bouton Google Sign-In */}
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

                {/* Divider simple */}
                <View style={styles.dividerSimple}>
                  <View style={styles.dividerLineSimple} />
                </View>

                {/* Lien d'inscription */}
                <View style={styles.signupRow}>
                  <Text style={styles.signupText}>Pas encore de compte ? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.signupLink}>Créer un compte</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <Text style={styles.footer}>
                © 2024 Football Network. Tous droits réservés.
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
    backgroundColor: '#000',
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  // HEADER
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    transform: [{ rotate: '3deg' }],
    shadowColor: THEME.ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
  },

  // CARD GLASSMORPHISM
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },

  // INPUTS
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 12,
    color: THEME.ACCENT,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 44,
    paddingVertical: 12,
    fontSize: 16,
    color: THEME.TEXT,
  },
  inputError: {
    borderColor: THEME.ERROR,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.ERROR,
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    color: THEME.ERROR,
  },

  // BUTTON
  loginButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  // DIVIDER
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginHorizontal: 16,
  },

  // GOOGLE BUTTON
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.TEXT,
  },

  // DIVIDER SIMPLE
  dividerSimple: {
    marginTop: 24,
    marginBottom: 20,
  },
  dividerLineSimple: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // SIGNUP ROW
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  signupLink: {
    fontSize: 14,
    color: THEME.ACCENT,
    fontWeight: 'bold',
  },

  // FOOTER
  footer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
  },
});
