/**
 * RegisterScreen - Inscription multi-étapes premium
 * Design cohérent avec le flow d'onboarding
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Image,
  Animated,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';
import { PremiumInput, PremiumButton, StepIndicatorCompact, RoleCardHorizontal } from '../../components/premium';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

// Configuration des positions et niveaux
const POSITIONS = [
  { id: 'goalkeeper', label: 'Gardien' },
  { id: 'defender', label: 'Défenseur' },
  { id: 'midfielder', label: 'Milieu' },
  { id: 'forward', label: 'Attaquant' },
  { id: 'any', label: 'Polyvalent' },
];

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Débutant' },
  { id: 'amateur', label: 'Amateur' },
  { id: 'intermediate', label: 'Intermédiaire' },
  { id: 'advanced', label: 'Avancé' },
];

const LICENSE_LEVELS = [
  { id: 'trainee', label: 'Stagiaire' },
  { id: 'regional', label: 'Régional' },
  { id: 'national', label: 'National' },
  { id: 'international', label: 'International' },
];

export const RegisterScreen = ({ navigation, route }) => {
  // Récupérer le type d'utilisateur depuis RoleSelection
  const initialUserType = route?.params?.userType || 'player';

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    userType: initialUserType,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    position: 'any',
    skillLevel: 'amateur',
    teamName: '',
    licenseNumber: '',
    licenseLevel: '',
    experienceYears: '',
    locationCity: '',
  });

  const [errors, setErrors] = useState({});
  const { signup, isLoading, error: authError } = useAuthImproved();
  const buttonScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Définir les étapes selon le rôle
  const getSteps = useCallback(() => {
    const baseSteps = [
      { id: 'personal', label: 'Personnel' },
    ];

    if (formData.userType === 'manager') {
      baseSteps.push({ id: 'team', label: 'Équipe' });
    } else if (formData.userType === 'referee') {
      baseSteps.push({ id: 'referee', label: 'Licence' });
    } else if (formData.userType === 'venue_owner') {
      baseSteps.push({ id: 'venue', label: 'Terrain' });
    } else {
      baseSteps.push({ id: 'football', label: 'Football' });
    }

    baseSteps.push({ id: 'location', label: 'Localisation' });
    baseSteps.push({ id: 'confirm', label: 'Confirmation' });

    return baseSteps;
  }, [formData.userType]);

  const STEPS = getSteps();

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, STEPS.length]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validateStep = useCallback((step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Informations personnelles
        if (!formData.firstName?.trim()) newErrors.firstName = 'Prénom requis';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Nom requis';
        if (!formData.email?.trim()) {
          newErrors.email = 'Email requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email invalide';
        }
        if (!formData.password) {
          newErrors.password = 'Mot de passe requis';
        } else if (formData.password.length < 6) {
          newErrors.password = 'Minimum 6 caractères';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
        break;

      case 1: // Profil spécifique
        if (formData.userType === 'manager') {
          if (!formData.teamName?.trim()) {
            newErrors.teamName = "Le nom de l'équipe est requis";
          } else if (formData.teamName.length < 3) {
            newErrors.teamName = 'Minimum 3 caractères';
          }
        }
        break;

      case 2: // Localisation
        if (!formData.locationCity?.trim()) {
          newErrors.locationCity = 'La ville est requise';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  }, [currentStep, validateStep, STEPS.length]);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSignup = useCallback(async () => {
    if (!validateStep(STEPS.length - 2)) return;

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
    } else if (formData.userType === 'player') {
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

      Alert.alert('Bienvenue sur Foot Connect !', message, [
        { text: 'Commencer', onPress: () => {} },
      ]);
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de créer le compte');
    }
  }, [formData, validateStep, signup, STEPS.length]);

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

  const getRoleLabel = () => {
    switch (formData.userType) {
      case 'manager': return 'Manager';
      case 'referee': return 'Arbitre';
      case 'venue_owner': return 'Propriétaire';
      default: return 'Joueur';
    }
  };

  const getPositionLabel = (id) => POSITIONS.find(p => p.id === id)?.label || id;
  const getSkillLabel = (id) => SKILL_LEVELS.find(s => s.id === id)?.label || id;
  const getLicenseLabel = (id) => LICENSE_LEVELS.find(l => l.id === id)?.label || id;

  // Rendu du contenu de chaque étape
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Informations personnelles
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Informations personnelles</Text>
            <Text style={styles.stepSubtitle}>
              Crée ton identité sur le terrain
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <PremiumInput
                  label="Prénom"
                  placeholder="Jude"
                  value={formData.firstName}
                  onChangeText={text => updateField('firstName', text)}
                  icon="user"
                  error={errors.firstName}
                />
              </View>
              <View style={styles.inputHalf}>
                <PremiumInput
                  label="Nom"
                  placeholder="Bellingham"
                  value={formData.lastName}
                  onChangeText={text => updateField('lastName', text)}
                  icon="user"
                  error={errors.lastName}
                />
              </View>
            </View>

            <PremiumInput
              label="Email"
              placeholder="ton@email.com"
              value={formData.email}
              onChangeText={text => updateField('email', text)}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <PremiumInput
              label="Téléphone (optionnel)"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChangeText={text => updateField('phone', text)}
              icon="phone"
              keyboardType="phone-pad"
            />

            <PremiumInput
              label="Mot de passe"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={text => updateField('password', text)}
              icon="lock"
              secureTextEntry
              error={errors.password}
            />

            <PremiumInput
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={text => updateField('confirmPassword', text)}
              icon="lock"
              secureTextEntry
              error={errors.confirmPassword}
            />
          </View>
        );

      case 1: // Profil spécifique selon le rôle
        if (formData.userType === 'manager') {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ton équipe</Text>
              <Text style={styles.stepSubtitle}>
                Crée ton équipe et deviens manager
              </Text>

              <PremiumInput
                label="Nom de l'équipe"
                placeholder="FC Paris United"
                value={formData.teamName}
                onChangeText={text => updateField('teamName', text)}
                icon="shield"
                error={errors.teamName}
              />

              <View style={styles.infoBox}>
                <Icon name="info" size={16} color={COLORS.PRIMARY} />
                <Text style={styles.infoText}>
                  Tu seras automatiquement désigné manager de cette équipe et pourras inviter des joueurs.
                </Text>
              </View>
            </View>
          );
        } else if (formData.userType === 'referee') {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Profil arbitre</Text>
              <Text style={styles.stepSubtitle}>
                Informations sur ta licence
              </Text>

              <PremiumInput
                label="Numéro de licence (optionnel)"
                placeholder="REF-2025-001"
                value={formData.licenseNumber}
                onChangeText={text => updateField('licenseNumber', text)}
                icon="credit-card"
              />

              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Niveau de licence</Text>
                <View style={styles.optionsGrid}>
                  {LICENSE_LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.optionButton,
                        formData.licenseLevel === level.id && styles.optionButtonActive,
                      ]}
                      onPress={() => updateField('licenseLevel', level.id)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          formData.licenseLevel === level.id && styles.optionButtonTextActive,
                        ]}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <PremiumInput
                label="Années d'expérience"
                placeholder="5"
                value={formData.experienceYears}
                onChangeText={text => updateField('experienceYears', text)}
                icon="clock"
                keyboardType="number-pad"
              />
            </View>
          );
        } else if (formData.userType === 'venue_owner') {
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ton terrain</Text>
              <Text style={styles.stepSubtitle}>
                Tu pourras ajouter les détails de ton terrain plus tard
              </Text>

              <View style={styles.infoBox}>
                <Icon name="info" size={16} color={COLORS.PRIMARY} />
                <Text style={styles.infoText}>
                  Après l'inscription, tu pourras ajouter ton terrain avec photos, tarifs et disponibilités.
                </Text>
              </View>
            </View>
          );
        } else {
          // Player
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Profil joueur</Text>
              <Text style={styles.stepSubtitle}>
                Parle-nous de ton style de jeu
              </Text>

              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Position</Text>
                <View style={styles.optionsGrid}>
                  {POSITIONS.map((pos) => (
                    <TouchableOpacity
                      key={pos.id}
                      style={[
                        styles.optionButton,
                        formData.position === pos.id && styles.optionButtonActive,
                      ]}
                      onPress={() => updateField('position', pos.id)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          formData.position === pos.id && styles.optionButtonTextActive,
                        ]}
                      >
                        {pos.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Niveau</Text>
                <View style={styles.optionsGrid}>
                  {SKILL_LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.optionButton,
                        formData.skillLevel === level.id && styles.optionButtonActive,
                      ]}
                      onPress={() => updateField('skillLevel', level.id)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          formData.skillLevel === level.id && styles.optionButtonTextActive,
                        ]}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          );
        }

      case 2: // Localisation
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Localisation</Text>
            <Text style={styles.stepSubtitle}>
              Où {formData.userType === 'manager' ? 'est basée ton équipe' : 'joues-tu'} ?
            </Text>

            <PremiumInput
              label="Ville"
              placeholder="Paris"
              value={formData.locationCity}
              onChangeText={text => updateField('locationCity', text)}
              icon="map-pin"
              error={errors.locationCity}
            />

            <View style={styles.infoBox}>
              <Icon name="map" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.infoText}>
                Cette information nous aide à te montrer les terrains et équipes près de chez toi.
              </Text>
            </View>
          </View>
        );

      case 3: // Récapitulatif
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Récapitulatif</Text>
            <Text style={styles.stepSubtitle}>
              Vérifie tes informations avant de continuer
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type de compte</Text>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>{getRoleLabel()}</Text>
                </View>
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

              {formData.userType === 'manager' && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Équipe</Text>
                  <Text style={styles.summaryValue}>{formData.teamName}</Text>
                </View>
              )}

              {formData.userType === 'player' && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Position</Text>
                    <Text style={styles.summaryValue}>{getPositionLabel(formData.position)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Niveau</Text>
                    <Text style={styles.summaryValue}>{getSkillLabel(formData.skillLevel)}</Text>
                  </View>
                </>
              )}

              {formData.userType === 'referee' && formData.licenseLevel && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Licence</Text>
                  <Text style={styles.summaryValue}>{getLicenseLabel(formData.licenseLevel)}</Text>
                </View>
              )}

              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800&q=80',
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
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => currentStep > 0 ? previousStep() : navigation.goBack()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="arrow-left" size={22} color={COLORS.WHITE} />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                  <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <Text style={styles.title}>Rejoins le terrain</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{getRoleLabel()}</Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <StepIndicatorCompact
                totalSteps={STEPS.length}
                currentStep={currentStep}
                style={styles.stepIndicator}
              />

              {/* Card */}
              <View style={styles.card}>
                {authError && (
                  <View style={styles.errorBanner}>
                    <Icon name="alert-circle" size={16} color={COLORS.ERROR} />
                    <Text style={styles.errorBannerText}>{authError}</Text>
                  </View>
                )}

                {renderStepContent()}
              </View>

              {/* Footer avec boutons */}
              <View style={styles.footer}>
                <View style={styles.buttonRow}>
                  {currentStep > 0 && (
                    <TouchableOpacity
                      style={styles.prevButton}
                      onPress={previousStep}
                      disabled={isLoading}
                    >
                      <Icon name="arrow-left" size={20} color={COLORS.WHITE} />
                      <Text style={styles.prevButtonText}>Retour</Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ flex: 1 }} />

                  <Animated.View
                    style={[
                      styles.nextButtonWrapper,
                      { transform: [{ scale: buttonScale }] },
                      !isLoading && SHADOWS.glow,
                    ]}
                  >
                    {currentStep < STEPS.length - 1 ? (
                      <TouchableOpacity
                        onPress={nextStep}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={isLoading}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={GRADIENTS.button}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.nextButton}
                        >
                          <Text style={styles.nextButtonText}>Suivant</Text>
                          <Icon name="arrow-right" size={20} color={COLORS.WHITE} />
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={handleSignup}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={isLoading}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={isLoading ? [COLORS.BORDER, COLORS.BORDER] : GRADIENTS.button}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.nextButton}
                        >
                          {isLoading ? (
                            <>
                              <ActivityIndicator color={COLORS.WHITE} size="small" />
                              <Text style={styles.nextButtonText}>Création...</Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.nextButtonText}>
                                {formData.userType === 'manager' ? 'Créer mon équipe' : "S'inscrire"}
                              </Text>
                              <Icon name="check" size={20} color={COLORS.WHITE} />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                </View>

                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={() => navigation.navigate('Login')}
                  hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                >
                  <Text style={styles.loginLinkText}>
                    Déjà un compte ?{' '}
                    <Text style={styles.loginLinkBold}>Se connecter</Text>
                  </Text>
                </TouchableOpacity>
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

  // Header
  header: {
    marginBottom: 20,
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
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.WHITE,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  roleBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '600',
  },

  // Step indicator
  stepIndicator: {
    marginBottom: 20,
  },

  // Card
  card: {
    backgroundColor: COLORS.GLASS,
    borderRadius: RADIUS.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    ...SHADOWS.medium,
    marginBottom: 24,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.ERROR,
  },

  // Step content
  stepContent: {},
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 24,
  },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },

  // Option groups
  optionGroup: {
    marginBottom: 24,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.GLASS,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(0, 123, 64, 0.2)',
    borderColor: COLORS.PRIMARY,
  },
  optionButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 123, 64, 0.1)',
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },

  // Summary
  summaryCard: {
    backgroundColor: COLORS.GLASS_LIGHT,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  summaryBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  summaryBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
  },

  // Footer
  footer: {},
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.GLASS,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  prevButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  nextButtonWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    letterSpacing: 0.5,
  },

  // Login link
  loginLink: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
  loginLinkBold: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default RegisterScreen;
