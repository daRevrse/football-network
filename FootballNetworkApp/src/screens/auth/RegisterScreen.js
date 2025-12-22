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
  ImageBackground,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';

const THEME = {
  ACCENT: '#22C55E', // Green 500
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ERROR: '#EF4444',
};

// Import des composants d'étapes
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
    userType: 'player', // 'player' | 'manager' | 'referee'

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

    // Étape : Arbitre (Referee)
    licenseNumber: '',
    licenseLevel: '',
    experienceYears: '',

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
    } else if (formData.userType === 'referee') {
      baseSteps.push({ id: 'referee', label: 'Arbitre', icon: 'flag' });
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

      switch (step) {
        case 1: // Rôle
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

        case 3: // Football OU Équipe OU Arbitre
          if (formData.userType === 'manager') {
            if (!formData.teamName?.trim()) {
              newErrors.teamName = "Le nom de l'équipe est requis";
            } else if (formData.teamName.length < 3) {
              newErrors.teamName = 'Min 3 caractères';
            }
          } else if (formData.userType === 'referee') {
            // Validation pour arbitre (optionnelle)
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
    [formData],
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
    } else if (formData.userType === 'referee') {
      userData.licenseNumber = formData.licenseNumber?.trim() || '';
      userData.licenseLevel = formData.licenseLevel || '';
      userData.experienceYears = formData.experienceYears ? parseInt(formData.experienceYears) : 0;
    } else {
      userData.position = formData.position;
      userData.skillLevel = formData.skillLevel;
    }

    const result = await signup(userData);

    if (result.success) {
      let message = 'Compte créé avec succès !';
      if (formData.userType === 'manager') {
        message = `Compte créé et équipe "${formData.teamName}" initialisée !`;
      } else if (formData.userType === 'referee') {
        message = 'Compte arbitre créé avec succès !';
      }

      Alert.alert('Bienvenue !', message, [{ text: 'Commencer', onPress: () => {} }]);
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
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choisissez votre rôle</Text>
            <Text style={styles.stepSubtitle}>
              Sélectionnez le type de profil que vous souhaitez créer
            </Text>

            <View style={styles.roleGrid}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  formData.userType === 'player' && styles.roleCardActive,
                ]}
                onPress={() => updateField('userType', 'player')}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    formData.userType === 'player' && styles.roleIconBoxActive,
                  ]}
                >
                  <Icon
                    name="user"
                    size={28}
                    color={formData.userType === 'player' ? THEME.ACCENT : THEME.TEXT_SEC}
                  />
                </View>
                <Text
                  style={[
                    styles.roleLabel,
                    formData.userType === 'player' && styles.roleLabelActive,
                  ]}
                >
                  Joueur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  formData.userType === 'manager' && styles.roleCardActive,
                ]}
                onPress={() => updateField('userType', 'manager')}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    formData.userType === 'manager' && styles.roleIconBoxActive,
                  ]}
                >
                  <Icon
                    name="briefcase"
                    size={28}
                    color={formData.userType === 'manager' ? THEME.ACCENT : THEME.TEXT_SEC}
                  />
                </View>
                <Text
                  style={[
                    styles.roleLabel,
                    formData.userType === 'manager' && styles.roleLabelActive,
                  ]}
                >
                  Manager
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  formData.userType === 'referee' && styles.roleCardActive,
                ]}
                onPress={() => updateField('userType', 'referee')}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    formData.userType === 'referee' && styles.roleIconBoxActive,
                  ]}
                >
                  <Icon
                    name="flag"
                    size={28}
                    color={formData.userType === 'referee' ? THEME.ACCENT : THEME.TEXT_SEC}
                  />
                </View>
                <Text
                  style={[
                    styles.roleLabel,
                    formData.userType === 'referee' && styles.roleLabelActive,
                  ]}
                >
                  Arbitre
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Informations personnelles</Text>
            <Text style={styles.stepSubtitle}>
              Créez votre identité sur le terrain
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Prénom *</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="user" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.firstName && styles.inputError]}
                    value={formData.firstName}
                    onChangeText={text => updateField('firstName', text)}
                    placeholder="Jude"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>

              <View style={styles.inputHalf}>
                <Text style={styles.label}>Nom *</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="user" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.lastName && styles.inputError]}
                    value={formData.lastName}
                    onChangeText={text => updateField('lastName', text)}
                    placeholder="Bellingham"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={text => updateField('email', text)}
                  placeholder="email@exemple.com"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <View style={styles.inputWrapper}>
                <Icon name="phone" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={text => updateField('phone', text)}
                  placeholder="90 90 90 90"
                  placeholderTextColor="#6B7280"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe *</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  value={formData.password}
                  onChangeText={text => updateField('password', text)}
                  placeholder="••••••••"
                  placeholderTextColor="#6B7280"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe *</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  value={formData.confirmPassword}
                  onChangeText={text => updateField('confirmPassword', text)}
                  placeholder="••••••••"
                  placeholderTextColor="#6B7280"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </View>
        );

      case 3:
        if (formData.userType === 'manager') {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Votre équipe</Text>
              <Text style={styles.stepSubtitle}>
                Créez votre équipe et devenez manager
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de l'équipe *</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="shield" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.teamName && styles.inputError]}
                    value={formData.teamName}
                    onChangeText={text => updateField('teamName', text)}
                    placeholder="FC Paris..."
                    placeholderTextColor="#6B7280"
                  />
                </View>
                {errors.teamName && <Text style={styles.errorText}>{errors.teamName}</Text>}
                <Text style={styles.helperText}>
                  * Vous serez automatiquement désigné manager de cette équipe.
                </Text>
              </View>
            </View>
          );
        } else if (formData.userType === 'referee') {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Profil arbitre</Text>
              <Text style={styles.stepSubtitle}>
                Informations sur votre licence et expérience
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Numéro de licence</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="credit-card" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.licenseNumber}
                    onChangeText={text => updateField('licenseNumber', text)}
                    placeholder="REF-2024-001"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Niveau de licence</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="award" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                  <View style={styles.pickerWrapper}>
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() => {
                        Alert.alert('Niveau de licence', 'Sélectionnez votre niveau', [
                          { text: 'Stagiaire', onPress: () => updateField('licenseLevel', 'trainee') },
                          { text: 'Régional', onPress: () => updateField('licenseLevel', 'regional') },
                          { text: 'National', onPress: () => updateField('licenseLevel', 'national') },
                          { text: 'International', onPress: () => updateField('licenseLevel', 'international') },
                          { text: 'Annuler', style: 'cancel' },
                        ]);
                      }}
                    >
                      <Text style={styles.pickerText}>
                        {formData.licenseLevel === 'trainee'
                          ? 'Stagiaire'
                          : formData.licenseLevel === 'regional'
                          ? 'Régional'
                          : formData.licenseLevel === 'national'
                          ? 'National'
                          : formData.licenseLevel === 'international'
                          ? 'International'
                          : 'Choisir...'}
                      </Text>
                      <Icon name="chevron-down" size={20} color={THEME.TEXT_SEC} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Années d'expérience</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="clock" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.experienceYears}
                    onChangeText={text => updateField('experienceYears', text)}
                    placeholder="5"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          );
        } else {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Profil joueur</Text>
              <Text style={styles.stepSubtitle}>
                Parlez-nous de votre style de jeu
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Position</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="target" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                  <View style={styles.pickerWrapper}>
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() => {
                        Alert.alert('Position', 'Sélectionnez votre position', [
                          { text: 'Gardien', onPress: () => updateField('position', 'goalkeeper') },
                          { text: 'Défenseur', onPress: () => updateField('position', 'defender') },
                          { text: 'Milieu', onPress: () => updateField('position', 'midfielder') },
                          { text: 'Attaquant', onPress: () => updateField('position', 'forward') },
                          { text: 'Polyvalent', onPress: () => updateField('position', 'any') },
                          { text: 'Annuler', style: 'cancel' },
                        ]);
                      }}
                    >
                      <Text style={styles.pickerText}>
                        {formData.position === 'goalkeeper'
                          ? 'Gardien'
                          : formData.position === 'defender'
                          ? 'Défenseur'
                          : formData.position === 'midfielder'
                          ? 'Milieu'
                          : formData.position === 'forward'
                          ? 'Attaquant'
                          : 'Polyvalent'}
                      </Text>
                      <Icon name="chevron-down" size={20} color={THEME.TEXT_SEC} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Niveau</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="award" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                  <View style={styles.pickerWrapper}>
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() => {
                        Alert.alert('Niveau', 'Sélectionnez votre niveau', [
                          { text: 'Débutant', onPress: () => updateField('skillLevel', 'beginner') },
                          { text: 'Amateur', onPress: () => updateField('skillLevel', 'amateur') },
                          { text: 'Intermédiaire', onPress: () => updateField('skillLevel', 'intermediate') },
                          { text: 'Avancé', onPress: () => updateField('skillLevel', 'advanced') },
                          { text: 'Annuler', style: 'cancel' },
                        ]);
                      }}
                    >
                      <Text style={styles.pickerText}>
                        {formData.skillLevel === 'beginner'
                          ? 'Débutant'
                          : formData.skillLevel === 'amateur'
                          ? 'Amateur'
                          : formData.skillLevel === 'intermediate'
                          ? 'Intermédiaire'
                          : 'Avancé'}
                      </Text>
                      <Icon name="chevron-down" size={20} color={THEME.TEXT_SEC} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Localisation</Text>
            <Text style={styles.stepSubtitle}>
              Où {formData.userType === 'manager' ? 'est basée votre équipe' : 'jouez-vous'} ?
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ville *</Text>
              <View style={styles.inputWrapper}>
                <Icon name="map-pin" size={20} color={THEME.TEXT_SEC} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.locationCity && styles.inputError]}
                  value={formData.locationCity}
                  onChangeText={text => updateField('locationCity', text)}
                  placeholder="Paris"
                  placeholderTextColor="#6B7280"
                />
              </View>
              {errors.locationCity && (
                <Text style={styles.errorText}>{errors.locationCity}</Text>
              )}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Récapitulatif</Text>
            <Text style={styles.stepSubtitle}>
              Vérifiez vos informations avant de continuer
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type de compte</Text>
                <Text style={styles.summaryValue}>
                  {formData.userType === 'manager'
                    ? 'Manager'
                    : formData.userType === 'referee'
                    ? 'Arbitre'
                    : 'Joueur'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nom complet</Text>
                <Text style={styles.summaryValue}>
                  {formData.firstName} {formData.lastName}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Email</Text>
                <Text style={styles.summaryValue}>{formData.email}</Text>
              </View>

              {formData.userType === 'manager' ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Équipe</Text>
                  <Text style={styles.summaryValue}>{formData.teamName}</Text>
                </View>
              ) : formData.userType === 'referee' ? (
                <>
                  {formData.licenseNumber && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Licence</Text>
                      <Text style={styles.summaryValue}>{formData.licenseNumber}</Text>
                    </View>
                  )}
                  {formData.licenseLevel && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Niveau</Text>
                      <Text style={styles.summaryValue}>
                        {formData.licenseLevel === 'trainee'
                          ? 'Stagiaire'
                          : formData.licenseLevel === 'regional'
                          ? 'Régional'
                          : formData.licenseLevel === 'national'
                          ? 'National'
                          : 'International'}
                      </Text>
                    </View>
                  )}
                  {formData.experienceYears && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Expérience</Text>
                      <Text style={styles.summaryValue}>{formData.experienceYears} ans</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Position</Text>
                    <Text style={styles.summaryValue}>
                      {formData.position === 'goalkeeper'
                        ? 'Gardien'
                        : formData.position === 'defender'
                        ? 'Défenseur'
                        : formData.position === 'midfielder'
                        ? 'Milieu'
                        : formData.position === 'forward'
                        ? 'Attaquant'
                        : 'Polyvalent'}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Niveau</Text>
                    <Text style={styles.summaryValue}>
                      {formData.skillLevel === 'beginner'
                        ? 'Débutant'
                        : formData.skillLevel === 'amateur'
                        ? 'Amateur'
                        : formData.skillLevel === 'intermediate'
                        ? 'Intermédiaire'
                        : 'Avancé'}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ville</Text>
                <Text style={styles.summaryValue}>{formData.locationCity}</Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=2500&auto=format&fit=crop',
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
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>FN</Text>
                </View>
                <Text style={styles.title}>Rejoignez le terrain</Text>
                <Text style={styles.subtitle}>
                  Créez votre profil et connectez-vous avec des milliers de passionnés.
                </Text>
              </View>

              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                {STEPS.map((step, index) => (
                  <View key={step.id} style={styles.stepDot}>
                    <View
                      style={[
                        styles.dot,
                        index + 1 === currentStep && styles.dotActive,
                        index + 1 < currentStep && styles.dotCompleted,
                      ]}
                    >
                      {index + 1 < currentStep ? (
                        <Icon name="check" size={12} color="#FFF" />
                      ) : (
                        <Text
                          style={[
                            styles.dotText,
                            index + 1 === currentStep && styles.dotTextActive,
                          ]}
                        >
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    {index < STEPS.length - 1 && <View style={styles.stepLine} />}
                  </View>
                ))}
              </View>

              {/* Card glassmorphism */}
              <View style={styles.card}>
                {authError && (
                  <View style={styles.errorBanner}>
                    <Icon name="alert-circle" size={16} color={THEME.ERROR} />
                    <Text style={styles.errorBannerText}>{authError}</Text>
                  </View>
                )}

                {/* Google Sign-In à l'étape 2 (infos personnelles) */}
                {currentStep === 2 && (
                  <>
                    <TouchableOpacity
                      style={styles.googleButton}
                      onPress={() => {
                        Alert.alert(
                          'Google Sign-In',
                          'Cette fonctionnalité sera bientôt disponible. Veuillez remplir le formulaire ci-dessous.',
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
                      <Text style={styles.googleButtonText}>S'inscrire avec Google</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OU</Text>
                      <View style={styles.dividerLine} />
                    </View>
                  </>
                )}

                {renderStepContent()}
              </View>

              {/* Footer avec boutons */}
              <View style={styles.footer}>
                <View style={styles.buttonRow}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={previousStep}
                      disabled={isLoading}
                    >
                      <Icon name="arrow-left" size={20} color={THEME.TEXT} />
                      <Text style={styles.backButtonText}>Précédent</Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ flex: 1 }} />

                  {currentStep < STEPS.length ? (
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={nextStep}
                      disabled={isLoading}
                    >
                      <Text style={styles.nextButtonText}>Suivant</Text>
                      <Icon name="arrow-right" size={20} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                      onPress={handleSignup}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <ActivityIndicator color="#FFF" size="small" />
                          <Text style={styles.submitButtonText}>Création...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>
                            {formData.userType === 'manager'
                              ? 'Créer mon équipe'
                              : "S'inscrire et jouer"}
                          </Text>
                          <Icon name="check" size={20} color="#FFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>Vous avez déjà un compte ? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLinkButton}>Connectez-vous</Text>
                  </TouchableOpacity>
                </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },

  // HEADER
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // STEP INDICATOR
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  stepDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: THEME.ACCENT,
    borderColor: THEME.ACCENT,
  },
  dotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dotText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  dotTextActive: {
    color: '#FFF',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
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
    marginBottom: 24,
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
    marginBottom: 20,
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

  // DIVIDER
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // ERROR BANNER
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: THEME.ERROR,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: THEME.ERROR,
  },

  // STEP CONTENT
  stepContent: {
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 24,
  },

  // ROLE SELECTION
  roleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  roleCardActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: THEME.ACCENT,
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconBoxActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.TEXT_SEC,
  },
  roleLabelActive: {
    color: THEME.ACCENT,
  },

  // INPUTS
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputHalf: {
    flex: 1,
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
  errorText: {
    fontSize: 12,
    color: THEME.ERROR,
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },

  // PICKER
  pickerWrapper: {
    paddingLeft: 44,
  },
  picker: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: THEME.TEXT,
  },

  // SUMMARY
  summaryCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.TEXT,
  },

  // FOOTER BUTTONS
  footer: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: THEME.ACCENT,
    borderRadius: 12,
    shadowColor: THEME.ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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

  // LOGIN LINK
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  loginLinkButton: {
    fontSize: 14,
    color: THEME.ACCENT,
    fontWeight: 'bold',
  },
});
