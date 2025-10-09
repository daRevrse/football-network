// ====== src/screens/auth/RegisterScreen.js ======
import React, { useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ModernButton } from '../../components/common';
import { StepIndicator } from '../../components/common/StepIndicator';
import { COLORS, DIMENSIONS, FONTS } from '../../styles/theme';
import { useMultiStepForm } from '../../hooks/useMultiStepForm';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';
import {
  PersonalInfoStep,
  SecurityStep,
  FootballProfileStep,
  SummaryStep,
} from './RegisterSteps';

const STEPS = [
  { id: 'personal', label: 'Profil', component: PersonalInfoStep },
  { id: 'security', label: 'Sécurité', component: SecurityStep },
  { id: 'football', label: 'Football', component: FootballProfileStep },
  { id: 'summary', label: 'Validation', component: SummaryStep },
];

export const RegisterScreen = ({ navigation }) => {
  const {
    currentStep,
    formData,
    errors,
    isFirstStep,
    isLastStep,
    updateField,
    setFieldErrors,
    nextStep,
    previousStep,
    reset,
  } = useMultiStepForm(STEPS);

  const { signup, isLoading } = useAuthImproved();

  React.useEffect(() => {
    if (!formData.position) {
      updateField('position', 'any');
    }
    if (!formData.skillLevel) {
      updateField('skillLevel', 'amateur');
    }
  }, [formData.position, formData.skillLevel, updateField]);

  const validateCurrentStep = useCallback(() => {
    const newErrors = {};

    switch (currentStep) {
      case 1:
        if (!formData.firstName?.trim()) {
          newErrors.firstName = 'Le prénom est requis';
        }
        if (!formData.lastName?.trim()) {
          newErrors.lastName = 'Le nom est requis';
        }
        if (!formData.email?.trim()) {
          newErrors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Format d'email invalide";
        }
        break;

      case 2:
        if (!formData.password) {
          newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
          newErrors.password = 'Minimum 6 caractères';
        } else if (!/[A-Z]/.test(formData.password)) {
          newErrors.password = 'Une majuscule requise';
        } else if (!/[0-9]/.test(formData.password)) {
          newErrors.password = 'Un chiffre requis';
        }

        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Confirmation requise';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
        break;

      case 3:
        break;

      case 4:
        break;
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return false;
    }

    return true;
  }, [currentStep, formData, setFieldErrors]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      nextStep();
    }
  }, [validateCurrentStep, nextStep]);

  const handleSignup = useCallback(async () => {
    try {
      const result = await signup(formData);

      if (result.success) {
        Alert.alert(
          'Inscription réussie ! 🎉',
          `Bienvenue ${result.user.firstName} !`,
          [
            {
              text: 'Se connecter',
              onPress: () => {
                reset();
                navigation.navigate('Login');
              },
            },
          ],
        );
      } else {
        Alert.alert("Erreur d'inscription", result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue est survenue');
    }
  }, [formData, signup, reset, navigation]);

  const CurrentStepComponent = STEPS[currentStep - 1].component;

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
        {/* Step Indicator */}
        <View style={styles.stepIndicatorContainer}>
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </View>

        {/* Form Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <CurrentStepComponent
            formData={formData}
            updateField={updateField}
            errors={errors}
          />
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            {!isFirstStep && (
              <ModernButton
                title="Précédent"
                onPress={previousStep}
                variant="outline"
                leftIconName="arrow-left"
                fullWidth={false}
                size="small"
              />
            )}

            <View style={styles.spacer} />

            {!isLastStep ? (
              <ModernButton
                title="Suivant"
                onPress={handleNext}
                variant="primary"
                rightIconName="arrow-right"
              />
            ) : (
              <ModernButton
                title="Créer mon compte"
                onPress={handleSignup}
                disabled={isLoading}
                isLoading={isLoading}
                variant="primary"
                leftIconName="check-circle"
              />
            )}
          </View>

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkButton}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  stepIndicatorContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: DIMENSIONS.SPACING_MD,
    backgroundColor: COLORS.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
  },
  footer: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingTop: DIMENSIONS.SPACING_MD,
    paddingBottom:
      Platform.OS === 'ios' ? DIMENSIONS.SPACING_LG : DIMENSIONS.SPACING_MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  spacer: {
    width: DIMENSIONS.SPACING_SM,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  loginLinkButton: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
});
