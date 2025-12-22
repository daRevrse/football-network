// ====== src/screens/auth/ForgotPasswordScreen.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

const THEME = {
  ACCENT: '#22C55E',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ERROR: '#EF4444',
};

export const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = () => {
    // Validation
    if (!email) {
      setError('Email requis');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email invalide');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simuler l'envoi d'email
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2836&auto=format&fit=crop',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(22, 101, 52, 0.9)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overlay}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
          >
            <Icon name="arrow-left" size={24} color={THEME.TEXT} />
          </TouchableOpacity>

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
                  <Icon name="unlock" size={32} color="#FFF" />
                </View>
                <Text style={styles.title}>Mot de passe oublié ?</Text>
                <Text style={styles.subtitle}>
                  {emailSent
                    ? 'Email envoyé ! Vérifiez votre boîte de réception.'
                    : 'Entrez votre email pour recevoir les instructions de réinitialisation.'}
                </Text>
              </View>

              {/* Card glassmorphism */}
              <View style={styles.card}>
                {!emailSent ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email</Text>
                      <View style={styles.inputWrapper}>
                        <Icon
                          name="mail"
                          size={20}
                          color={error ? THEME.ERROR : THEME.TEXT_SEC}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, error && styles.inputError]}
                          value={email}
                          onChangeText={text => {
                            setEmail(text);
                            if (error) setError('');
                          }}
                          placeholder="votre@email.com"
                          placeholderTextColor="#6B7280"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      {error && (
                        <View style={styles.errorRow}>
                          <View style={styles.errorDot} />
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                      onPress={handleSubmit}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <>
                          <ActivityIndicator color="#FFF" size="small" />
                          <Text style={styles.submitButtonText}>Envoi...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>Envoyer le lien</Text>
                          <Icon name="send" size={20} color="#FFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                      <Icon name="check-circle" size={48} color={THEME.ACCENT} />
                    </View>
                    <Text style={styles.successText}>
                      Un email a été envoyé à{' '}
                      <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>
                    <Text style={styles.successSubtext}>
                      Suivez les instructions dans l'email pour réinitialiser votre mot de passe.
                    </Text>

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => navigation.goBack()}
                    >
                      <Icon name="arrow-left" size={20} color={THEME.TEXT} />
                      <Text style={styles.backButtonText}>Retour à la connexion</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Divider */}
                {!emailSent && (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Lien retour connexion */}
                    <View style={styles.loginRow}>
                      <Text style={styles.loginText}>Vous vous souvenez ? </Text>
                      <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.loginLink}>Se connecter</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
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
  closeBtn: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginLeft: 24,
    padding: 8,
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  // HEADER
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: THEME.ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#D1D5DB',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
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
    paddingRight: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: THEME.TEXT,
  },
  inputError: {
    borderColor: THEME.ERROR,
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
  submitButton: {
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
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  // SUCCESS CONTAINER
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 24,
  },
  successText: {
    fontSize: 16,
    color: THEME.TEXT,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: THEME.ACCENT,
  },
  successSubtext: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.TEXT,
  },

  // DIVIDER
  divider: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'transparent',
  },

  // LOGIN ROW
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  loginLink: {
    fontSize: 14,
    color: THEME.ACCENT,
    fontWeight: 'bold',
  },
});
