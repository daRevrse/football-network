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
import {
  ModernInput,
  ModernButton,
  InfoBox,
  StepIndicator,
} from '../../components/common';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';

// Import des composants d'étapes (y compris les nouveaux)
import {
  PersonalInfoStep,
  FootballProfileStep,
  SummaryStep,
  UserTypeStep,
  TeamInfoStep,
} from './RegisterSteps';

export const RegisterScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    userType: 'player', // 'player' | 'manager'

    // Étape : Informations personnelles
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDate: '',

    // Étape : Football (Joueur)
    position: 'any',
    skillLevel: 'amateur',

    // Étape : Équipe (Manager)
    teamName: '',

    // Étape : Localisation
    locationCity: '',
    locationLatitude: null,
    locationLongitude: null,
  });

  const [errors, setErrors] = useState({});
  const { signup, isLoading, error: authError } = useAuthImproved();

  // Définition dynamique des étapes selon le rôle
  const getSteps = () => {
    const baseSteps = [
      { id: 'role', label: 'Rôle', icon: 'users' },
      { id: 'personal', label: 'Personnel', icon: 'user' },
    ];

    if (formData.userType === 'manager') {
      baseSteps.push({ id: 'team', label: 'Équipe', icon: 'shield' });
    } else {
      baseSteps.push({ id: 'football', label: 'Football', icon: 'activity' });
    }

    baseSteps.push({ id: 'location', label: 'Localisation', icon: 'map-pin' });
    baseSteps.push({ id: 'confirm', label: 'Fin', icon: 'check-circle' });

    return baseSteps;
  };

  const STEPS = getSteps();

  const updateField = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  const validateStep = useCallback(
    step => {
      const newErrors = {};

      // Note : Les numéros d'étape correspondent à l'index + 1
      switch (step) {
        case 1: // Rôle
          // Pas de validation nécessaire, valeur par défaut
          break;

        case 2: // Informations personnelles
          if (!formData.firstName?.trim()) newErrors.firstName = 'Requis';
          if (!formData.lastName?.trim()) newErrors.lastName = 'Requis';
          if (!formData.email?.trim()) {
            newErrors.email = 'Requis';
          } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalide';
          }
          if (!formData.password) {
            newErrors.password = 'Requis';
          } else if (formData.password.length < 6) {
            newErrors.password = 'Min 6 car.';
          }
          if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Ne correspond pas';
          }
          break;

        case 3: // Football OU Équipe
          if (formData.userType === 'manager') {
            if (!formData.teamName?.trim()) {
              newErrors.teamName = "Le nom de l'équipe est requis";
            } else if (formData.teamName.length < 3) {
              newErrors.teamName = 'Min 3 caractères';
            }
          } else {
            if (!formData.position) newErrors.position = 'Requis';
            if (!formData.skillLevel) newErrors.skillLevel = 'Requis';
          }
          break;

        case 4: // Localisation
          if (!formData.locationCity?.trim()) {
            newErrors.locationCity = 'La ville est requise';
          }
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, currentStep],
  );

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }, [currentStep, validateStep, STEPS.length]);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSignup = useCallback(async () => {
    if (!validateStep(STEPS.length)) return;

    // Préparer les données
    const userData = {
      userType: formData.userType,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      phone: formData.phone?.trim() || '',
      locationCity: formData.locationCity.trim(),
    };

    if (formData.userType === 'manager') {
      userData.teamName = formData.teamName.trim();
    } else {
      userData.position = formData.position;
      userData.skillLevel = formData.skillLevel;
    }

    const result = await signup(userData);

    if (result.success) {
      Alert.alert(
        'Bienvenue !',
        formData.userType === 'manager'
          ? `Compte créé et équipe "${formData.teamName}" initialisée !`
          : `Compte créé avec succès !`,
        [{ text: 'Commencer', onPress: () => {} }],
      );
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de créer le compte', [
        { text: 'OK' },
      ]);
    }
  }, [formData, validateStep, signup, STEPS.length]);

  // Rendu du contenu de l'étape
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <UserTypeStep formData={formData} updateField={updateField} />;
      case 2:
        return (
          <PersonalInfoStep
            formData={formData}
            updateField={updateField}
            errors={errors}
          />
        );
      case 3:
        return formData.userType === 'manager' ? (
          <TeamInfoStep
            formData={formData}
            updateField={updateField}
            errors={errors}
          />
        ) : (
          <FootballProfileStep
            formData={formData}
            updateField={updateField}
            errors={errors}
          />
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>
              Où{' '}
              {formData.userType === 'manager'
                ? 'est basée votre équipe'
                : 'jouez-vous'}{' '}
              ?
            </Text>
            <ModernInput
              icon="map-pin"
              placeholder="Ville"
              value={formData.locationCity}
              onChangeText={value => updateField('locationCity', value)}
              error={errors.locationCity}
            />
          </View>
        );
      case 5:
        return <SummaryStep formData={formData} />;
      default:
        return null;
    }
  };

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
        <View style={styles.stepIndicatorContainer}>
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {authError && (
            <InfoBox
              type="error"
              message={authError}
              style={{ marginBottom: 20 }}
            />
          )}
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <ModernButton
                title="Précédent"
                onPress={previousStep}
                variant="outline"
                size="small"
                disabled={isLoading}
              />
            )}
            <View style={styles.spacer} />
            {currentStep < STEPS.length ? (
              <ModernButton
                title="Suivant"
                onPress={nextStep}
                variant="primary"
                disabled={isLoading}
              />
            ) : (
              <ModernButton
                title="Créer mon compte"
                onPress={handleSignup}
                isLoading={isLoading}
                variant="primary"
              />
            )}
          </View>

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
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND_LIGHT },
  keyboardView: { flex: 1 },
  stepIndicatorContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: COLORS.WHITE,
  },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: DIMENSIONS.CONTAINER_PADDING },
  footer: { padding: 20, backgroundColor: COLORS.WHITE, ...SHADOWS.LARGE },
  buttonContainer: { flexDirection: 'row', marginBottom: 15 },
  spacer: { flex: 1 },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.TEXT_PRIMARY,
  },
  loginLink: { flexDirection: 'row', justifyContent: 'center' },
  loginLinkText: { color: COLORS.TEXT_MUTED },
  loginLinkButton: { color: COLORS.PRIMARY, fontWeight: 'bold' },
});
