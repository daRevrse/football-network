// ====== src/screens/auth/ForgotPasswordScreen.js ======
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

export const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailChange = useCallback(
    value => {
      setEmail(value);
      if (error) setError('');
    },
    [error],
  );

  const validateEmail = useCallback(() => {
    if (!email.trim()) {
      setError("L'email est requis");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Format d'email invalide");
      return false;
    }
    return true;
  }, [email]);

  const handleSubmit = useCallback(async () => {
    if (!validateEmail()) return;

    try {
      setIsLoading(true);

      // Simulation d'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 1500));

      setEmailSent(true);
      Alert.alert(
        'Email envoyé !',
        'Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        "Impossible d'envoyer l'email. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [validateEmail, navigation]);

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
                <Icon name="key" size={48} color={COLORS.WHITE} />
              </View>

              <Text style={styles.title}>Mot de passe oublié ?</Text>
              <Text style={styles.subtitle}>
                Pas de problème ! Entrez votre email et nous vous enverrons un
                lien pour réinitialiser votre mot de passe.
              </Text>
            </View>

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
                error={error}
                leftIconName="mail"
              />

              <InfoBox
                type="info"
                message="Vérifiez vos spams si vous ne recevez pas l'email dans les 5 minutes."
              />

              <ModernButton
                title="Envoyer le lien"
                onPress={handleSubmit}
                disabled={isLoading}
                isLoading={isLoading}
                variant="primary"
                leftIconName="send"
              />
            </View>

            {/* Back to Login */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
              >
                <Icon
                  name="arrow-left"
                  size={DIMENSIONS.ICON_SIZE_SM}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.backButtonText}>Retour à la connexion</Text>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XXL,
  },
  logoContainer: {
    width: 100,
    height: 100,
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
    paddingHorizontal: DIMENSIONS.SPACING_LG,
  },
  form: {
    marginBottom: DIMENSIONS.SPACING_XL,
  },
  footer: {
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_SM,
  },
  backButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.PRIMARY,
    marginLeft: DIMENSIONS.SPACING_SM,
  },
});
