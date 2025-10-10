// ====== src/screens/auth/RegisterScreen.js ======
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

// Étapes du formulaire
const STEPS = [
  { id: 'personal', label: 'Personnel', icon: 'user' },
  { id: 'football', label: 'Football', icon: 'activity' },
  { id: 'location', label: 'Localisation', icon: 'map-pin' },
  { id: 'confirm', label: 'Confirmation', icon: 'check-circle' },
];

export const RegisterScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Étape 1 : Informations personnelles
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDate: '',

    // Étape 2 : Informations football
    position: '',
    skillLevel: '',

    // Étape 3 : Localisation
    locationCity: '',
    locationLatitude: null,
    locationLongitude: null,
  });

  const [errors, setErrors] = useState({});

  // Utiliser le hook useAuthImproved
  const { signup, isLoading, error: authError } = useAuthImproved();

  const updateField = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  // Validation par étape
  const validateStep = useCallback(
    step => {
      const newErrors = {};

      switch (step) {
        case 1: // Informations personnelles
          if (!formData.firstName?.trim()) {
            newErrors.firstName = 'Le prénom est requis';
          }
          if (!formData.lastName?.trim()) {
            newErrors.lastName = 'Le nom est requis';
          }
          if (!formData.email?.trim()) {
            newErrors.email = "L'email est requis";
          } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email invalide';
          }
          if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
          } else if (formData.password.length < 6) {
            newErrors.password = 'Minimum 6 caractères';
          }
          if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword =
              'Les mots de passe ne correspondent pas';
          }
          break;

        case 2: // Football
          if (!formData.position) {
            newErrors.position = 'La position est requise';
          }
          if (!formData.skillLevel) {
            newErrors.skillLevel = 'Le niveau est requis';
          }
          break;

        case 3: // Localisation
          if (!formData.locationCity?.trim()) {
            newErrors.locationCity = 'La ville est requise';
          }
          break;

        case 4: // Confirmation - pas de validation
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData],
  );

  // Navigation entre les étapes
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }, [currentStep, validateStep]);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Inscription finale
  const handleSignup = useCallback(async () => {
    if (!validateStep(4)) {
      return;
    }

    // Préparer les données pour l'API
    const userData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      phone: formData.phone?.trim() || '93231346',
      birthDate: formData.birthDate?.trim() || '1999-01-01',
      position: formData.position,
      skillLevel: formData.skillLevel,
      locationCity: formData.locationCity.trim(),
      locationLatitude: formData.locationLatitude,
      locationLongitude: formData.locationLongitude,
    };

    const result = await signup(userData);

    if (result.success) {
      // Navigation automatique gérée par AppNavigator
      Alert.alert(
        'Bienvenue !',
        `Votre compte a été créé avec succès. Bienvenue ${result.user.firstName} !`,
        [{ text: 'Commencer', onPress: () => {} }],
      );
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de créer le compte', [
        { text: 'OK' },
      ]);
    }
  }, [formData, validateStep, signup]);

  // Composants des étapes
  const Step1Personal = () => (
    <View>
      <Text style={[styles.stepTitle, { color: COLORS.TEXT_PRIMARY }]}>
        Informations personnelles
      </Text>
      <Text style={[styles.stepDescription, { color: COLORS.TEXT_SECONDARY }]}>
        Commencez par nous dire qui vous êtes
      </Text>

      <ModernInput
        icon="user"
        placeholder="Prénom"
        value={formData.firstName}
        onChangeText={value => updateField('firstName', value)}
        error={errors.firstName}
        autoCapitalize="words"
      />

      <ModernInput
        icon="user"
        placeholder="Nom"
        value={formData.lastName}
        onChangeText={value => updateField('lastName', value)}
        error={errors.lastName}
        autoCapitalize="words"
      />

      <ModernInput
        icon="mail"
        placeholder="Email"
        value={formData.email}
        onChangeText={value => updateField('email', value)}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <ModernInput
        icon="phone"
        placeholder="Téléphone (optionnel)"
        value={formData.phone}
        onChangeText={value => updateField('phone', value)}
        error={errors.phone}
        keyboardType="phone-pad"
      />

      <ModernInput
        icon="lock"
        placeholder="Mot de passe"
        value={formData.password}
        onChangeText={value => updateField('password', value)}
        error={errors.password}
        secureTextEntry
      />

      <ModernInput
        icon="lock"
        placeholder="Confirmer le mot de passe"
        value={formData.confirmPassword}
        onChangeText={value => updateField('confirmPassword', value)}
        error={errors.confirmPassword}
        secureTextEntry
      />
    </View>
  );

  const Step2Football = () => {
    const positions = [
      { value: 'goalkeeper', label: 'Gardien', icon: '🧤' },
      { value: 'defender', label: 'Défenseur', icon: '🛡️' },
      { value: 'midfielder', label: 'Milieu', icon: '⚡' },
      { value: 'forward', label: 'Attaquant', icon: '⚽' },
      { value: 'any', label: 'Polyvalent', icon: '🌟' },
    ];

    const skillLevels = [
      { value: 'beginner', label: 'Débutant', color: '#94A3B8' },
      { value: 'amateur', label: 'Amateur', color: '#3B82F6' },
      { value: 'intermediate', label: 'Intermédiaire', color: '#F59E0B' },
      { value: 'advanced', label: 'Avancé', color: '#EF4444' },
      { value: 'expert', label: 'Expert', color: '#8B5CF6' },
    ];

    return (
      <View>
        <Text style={[styles.stepTitle, { color: COLORS.TEXT_PRIMARY }]}>
          Votre profil football
        </Text>
        <Text
          style={[styles.stepDescription, { color: COLORS.TEXT_SECONDARY }]}
        >
          Aidez-nous à mieux vous connaître
        </Text>

        <Text style={[styles.sectionLabel, { color: COLORS.TEXT_PRIMARY }]}>
          Position préférée
        </Text>
        <View style={styles.optionsGrid}>
          {positions.map(position => (
            <TouchableOpacity
              key={position.value}
              style={[
                styles.optionCard,
                {
                  backgroundColor:
                    formData.position === position.value
                      ? COLORS.PRIMARY_LIGHT
                      : COLORS.WHITE,
                  borderColor:
                    formData.position === position.value
                      ? COLORS.PRIMARY
                      : COLORS.BORDER_LIGHT,
                },
              ]}
              onPress={() => updateField('position', position.value)}
            >
              <Text style={styles.optionEmoji}>{position.icon}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color:
                      formData.position === position.value
                        ? COLORS.PRIMARY
                        : COLORS.TEXT_PRIMARY,
                  },
                ]}
              >
                {position.label}
              </Text>
              {formData.position === position.value && (
                <View style={styles.checkIcon}>
                  <Icon name="check" size={16} color={COLORS.PRIMARY} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.position && (
          <Text style={[styles.errorText, { color: COLORS.ERROR }]}>
            {errors.position}
          </Text>
        )}

        <Text style={[styles.sectionLabel, { color: COLORS.TEXT_PRIMARY }]}>
          Niveau de compétence
        </Text>
        <View style={styles.skillList}>
          {skillLevels.map(level => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.skillItem,
                {
                  backgroundColor:
                    formData.skillLevel === level.value
                      ? `${level.color}20`
                      : COLORS.WHITE,
                  borderColor:
                    formData.skillLevel === level.value
                      ? level.color
                      : COLORS.BORDER_LIGHT,
                },
              ]}
              onPress={() => updateField('skillLevel', level.value)}
            >
              <View
                style={[styles.skillDot, { backgroundColor: level.color }]}
              />
              <Text
                style={[
                  styles.skillLabel,
                  {
                    color:
                      formData.skillLevel === level.value
                        ? level.color
                        : COLORS.TEXT_PRIMARY,
                  },
                ]}
              >
                {level.label}
              </Text>
              {formData.skillLevel === level.value && (
                <Icon
                  name="check-circle"
                  size={20}
                  color={level.color}
                  style={styles.skillCheck}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.skillLevel && (
          <Text style={[styles.errorText, { color: COLORS.ERROR }]}>
            {errors.skillLevel}
          </Text>
        )}
      </View>
    );
  };

  const Step3Location = () => (
    <View>
      <Text style={[styles.stepTitle, { color: COLORS.TEXT_PRIMARY }]}>
        Où jouez-vous ?
      </Text>
      <Text style={[styles.stepDescription, { color: COLORS.TEXT_SECONDARY }]}>
        Trouvez des équipes près de chez vous
      </Text>

      <ModernInput
        icon="map-pin"
        placeholder="Ville"
        value={formData.locationCity}
        onChangeText={value => updateField('locationCity', value)}
        error={errors.locationCity}
        autoCapitalize="words"
      />

      <TouchableOpacity
        style={[styles.mapButton, { backgroundColor: COLORS.PRIMARY_LIGHT }]}
        onPress={() => Alert.alert('Info', 'Fonctionnalité bientôt disponible')}
      >
        <Icon name="map" size={20} color={COLORS.PRIMARY} />
        <Text style={[styles.mapButtonText, { color: COLORS.PRIMARY }]}>
          Utiliser ma position actuelle
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Step4Confirm = () => (
    <View>
      <Text style={[styles.stepTitle, { color: COLORS.TEXT_PRIMARY }]}>
        Tout est prêt !
      </Text>
      <Text style={[styles.stepDescription, { color: COLORS.TEXT_SECONDARY }]}>
        Vérifiez vos informations avant de créer votre compte
      </Text>

      <View
        style={[styles.summaryCard, { backgroundColor: COLORS.PRIMARY_LIGHT }]}
      >
        <View style={styles.summaryRow}>
          <Icon name="user" size={20} color={COLORS.PRIMARY} />
          <Text style={[styles.summaryText, { color: COLORS.TEXT_PRIMARY }]}>
            {formData.firstName} {formData.lastName}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Icon name="mail" size={20} color={COLORS.PRIMARY} />
          <Text style={[styles.summaryText, { color: COLORS.TEXT_PRIMARY }]}>
            {formData.email}
          </Text>
        </View>

        {formData.phone && (
          <View style={styles.summaryRow}>
            <Icon name="phone" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.summaryText, { color: COLORS.TEXT_PRIMARY }]}>
              {formData.phone}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Icon name="activity" size={20} color={COLORS.PRIMARY} />
          <Text style={[styles.summaryText, { color: COLORS.TEXT_PRIMARY }]}>
            {formData.position?.charAt(0).toUpperCase() +
              formData.position?.slice(1)}{' '}
            -{' '}
            {formData.skillLevel?.charAt(0).toUpperCase() +
              formData.skillLevel?.slice(1)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Icon name="map-pin" size={20} color={COLORS.PRIMARY} />
          <Text style={[styles.summaryText, { color: COLORS.TEXT_PRIMARY }]}>
            {formData.locationCity}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Personal />;
      case 2:
        return <Step2Football />;
      case 3:
        return <Step3Location />;
      case 4:
        return <Step4Confirm />;
      default:
        return null;
    }
  };

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === STEPS.length;

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
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
          {/* Afficher l'erreur d'authentification si elle existe */}
          {authError && (
            <InfoBox
              type="error"
              message={authError}
              style={{ marginBottom: DIMENSIONS.SPACING_MD }}
            />
          )}

          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.footer, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.buttonContainer}>
            {!isFirstStep && (
              <ModernButton
                title="Précédent"
                onPress={previousStep}
                variant="outline"
                leftIconName="arrow-left"
                size="small"
                disabled={isLoading}
              />
            )}

            <View style={styles.spacer} />

            {!isLastStep ? (
              <ModernButton
                title="Suivant"
                onPress={nextStep}
                variant="primary"
                rightIconName="arrow-right"
                disabled={isLoading}
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
            <Text style={[styles.loginLinkText, { color: COLORS.TEXT_MUTED }]}>
              Déjà un compte ?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={[styles.loginLinkButton, { color: COLORS.PRIMARY }]}>
                Se connecter
              </Text>
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
    paddingVertical: DIMENSIONS.SPACING_LG,
  },
  stepTitle: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  stepDescription: {
    fontSize: FONTS.SIZE.MD,
    marginBottom: DIMENSIONS.SPACING_XL,
    lineHeight: FONTS.SIZE.MD * 1.5,
  },
  sectionLabel: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginTop: DIMENSIONS.SPACING_LG,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  optionCard: {
    width: '48%',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  optionLabel: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: DIMENSIONS.SPACING_XS,
    right: DIMENSIONS.SPACING_XS,
  },
  skillList: {
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 2,
  },
  skillDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: DIMENSIONS.SPACING_SM,
  },
  skillLabel: {
    flex: 1,
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  skillCheck: {
    marginLeft: DIMENSIONS.SPACING_SM,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginTop: DIMENSIONS.SPACING_SM,
    gap: DIMENSIONS.SPACING_SM,
  },
  mapButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  summaryCard: {
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
    gap: DIMENSIONS.SPACING_MD,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_MD,
  },
  summaryText: {
    fontSize: FONTS.SIZE.MD,
    flex: 1,
  },
  errorText: {
    fontSize: FONTS.SIZE.SM,
    marginTop: DIMENSIONS.SPACING_XS,
  },
  footer: {
    padding: DIMENSIONS.CONTAINER_PADDING,
    paddingBottom:
      Platform.OS === 'ios' ? DIMENSIONS.SPACING_XL : DIMENSIONS.SPACING_MD,
    ...SHADOWS.LARGE,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  spacer: {
    flex: 1,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: FONTS.SIZE.SM,
  },
  loginLinkButton: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
});
