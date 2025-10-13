// ====== src/screens/teams/EditTeamScreen.js - NOUVEAU DESIGN + BACKEND ======
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { teamsApi } from '../../services/api';

// Composant ModernInput (identique à CreateTeamScreen)
const ModernInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon,
  multiline,
  keyboardType,
  maxLength,
  ...props
}) => (
  <View style={styles.inputContainer}>
    {label && (
      <View style={styles.inputLabelContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        {maxLength && (
          <Text style={styles.inputCounter}>
            {value?.length || 0}/{maxLength}
          </Text>
        )}
      </View>
    )}
    <View
      style={[
        styles.inputWrapper,
        error && styles.inputWrapperError,
        multiline && styles.inputWrapperMultiline,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={20}
          color={error ? '#EF4444' : '#9CA3AF'}
          style={styles.inputIcon}
        />
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={[
          styles.input,
          icon && styles.inputWithIcon,
          multiline && styles.inputMultiline,
        ]}
        {...props}
      />
    </View>
    {error && (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={14} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )}
  </View>
);

// Composant SectionCard
const SectionCard = ({ title, description, icon, iconBg, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={22} color="#FFF" />
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description && (
          <Text style={styles.sectionDescription}>{description}</Text>
        )}
      </View>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Composant SkillLevelCard
const SkillLevelCard = ({ level, isSelected, onPress }) => {
  const skillLevels = {
    beginner: {
      label: 'Débutant',
      description: 'Premiers pas dans le football',
      icon: 'user',
      gradient: ['#10B981', '#059669'],
    },
    amateur: {
      label: 'Amateur',
      description: 'Je joue régulièrement',
      icon: 'users',
      gradient: ['#3B82F6', '#2563EB'],
    },
    intermediate: {
      label: 'Intermédiaire',
      description: 'Bon niveau technique',
      icon: 'target',
      gradient: ['#F59E0B', '#D97706'],
    },
    advanced: {
      label: 'Avancé',
      description: 'Très bon joueur',
      icon: 'star',
      gradient: ['#EF4444', '#DC2626'],
    },
    semi_pro: {
      label: 'Semi-pro',
      description: 'Niveau compétitif',
      icon: 'award',
      gradient: ['#8B5CF6', '#7C3AED'],
    },
  };

  const skillInfo = skillLevels[level];

  return (
    <TouchableOpacity
      style={[styles.skillCard, isSelected && styles.skillCardSelected]}
      onPress={() => onPress(level)}
      activeOpacity={0.7}
    >
      {isSelected && (
        <View style={styles.selectedBadge}>
          <Icon name="check" size={16} color="#FFF" />
        </View>
      )}
      <LinearGradient
        colors={isSelected ? skillInfo.gradient : ['#F3F4F6', '#F3F4F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.skillIconContainer}
      >
        <Icon
          name={skillInfo.icon}
          size={24}
          color={isSelected ? '#FFF' : '#6B7280'}
        />
      </LinearGradient>
      <Text
        style={[styles.skillLabel, isSelected && styles.skillLabelSelected]}
      >
        {skillInfo.label}
      </Text>
      <Text
        style={[
          styles.skillDescription,
          isSelected && styles.skillDescriptionSelected,
        ]}
      >
        {skillInfo.description}
      </Text>
    </TouchableOpacity>
  );
};

export const EditTeamScreen = ({ route, navigation }) => {
  const { teamId, teamName } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skillLevel: 'amateur',
    maxPlayers: '15',
    locationCity: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const result = await teamsApi.getTeamById(teamId);

      if (result.success) {
        const team = result.data;
        setFormData({
          name: team.name || '',
          description: team.description || '',
          skillLevel: team.skill_level || 'amateur',
          maxPlayers: String(team.max_players || 15),
          locationCity: team.location_city || '',
        });
      } else {
        Alert.alert('Erreur', result.error);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load team error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Minimum 3 caractères';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Maximum 100 caractères';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Maximum 500 caractères';
    }

    const maxPlayers = parseInt(formData.maxPlayers);
    if (!formData.maxPlayers || isNaN(maxPlayers)) {
      newErrors.maxPlayers = 'Nombre invalide';
    } else if (maxPlayers < 8) {
      newErrors.maxPlayers = 'Minimum 8 joueurs';
    } else if (maxPlayers > 30) {
      newErrors.maxPlayers = 'Maximum 30 joueurs';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs du formulaire');
      return;
    }

    try {
      setIsLoading(true);

      const teamData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        skillLevel: formData.skillLevel,
        maxPlayers: parseInt(formData.maxPlayers),
        locationCity: formData.locationCity.trim() || undefined,
      };

      const result = await teamsApi.updateTeam(teamId, teamData);

      if (result.success) {
        Alert.alert('Succès', "L'équipe a été mise à jour avec succès !", [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert(
          'Erreur',
          result.error || "Impossible de mettre à jour l'équipe",
        );
      }
    } catch (error) {
      console.error('Update team error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="x" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Icon name="edit-2" size={32} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>Modifier l'équipe</Text>
          <Text style={styles.headerSubtitle}>{teamName}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section Identité */}
          <SectionCard
            title="Identité"
            description="Informations de base"
            icon="edit-3"
            iconBg="#22C55E"
          >
            <ModernInput
              label="Nom de l'équipe"
              value={formData.name}
              onChangeText={text => updateFormData('name', text)}
              placeholder="Les Tigres de Paris"
              error={errors.name}
              icon="shield"
              maxLength={100}
            />

            <ModernInput
              label="Description (optionnel)"
              value={formData.description}
              onChangeText={text => updateFormData('description', text)}
              placeholder="Décrivez votre équipe, votre style de jeu..."
              error={errors.description}
              icon="align-left"
              multiline
              maxLength={500}
            />
          </SectionCard>

          {/* Section Niveau */}
          <SectionCard
            title="Niveau de jeu"
            description="Niveau recherché"
            icon="trending-up"
            iconBg="#3B82F6"
          >
            <View style={styles.skillSelector}>
              {[
                'beginner',
                'amateur',
                'intermediate',
                'advanced',
                'semi_pro',
              ].map(level => (
                <SkillLevelCard
                  key={level}
                  level={level}
                  isSelected={formData.skillLevel === level}
                  onPress={updateFormData.bind(null, 'skillLevel')}
                />
              ))}
            </View>
          </SectionCard>

          {/* Section Configuration */}
          <SectionCard
            title="Configuration"
            description="Paramètres de l'équipe"
            icon="settings"
            iconBg="#F59E0B"
          >
            <ModernInput
              label="Nombre maximum de joueurs"
              value={formData.maxPlayers}
              onChangeText={text => updateFormData('maxPlayers', text)}
              placeholder="15"
              error={errors.maxPlayers}
              icon="users"
              keyboardType="number-pad"
              maxLength={2}
            />

            <ModernInput
              label="Ville (optionnel)"
              value={formData.locationCity}
              onChangeText={text => updateFormData('locationCity', text)}
              placeholder="Paris, Lyon, Marseille..."
              icon="map-pin"
              maxLength={100}
            />
          </SectionCard>
        </ScrollView>

        {/* Bouton Sauvegarder */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="save" size={22} color="#FFF" />
                  <Text style={styles.submitText}>Enregistrer</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// Styles identiques à CreateTeamScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: DIMENSIONS.SPACING_XL,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    ...SHADOWS.LARGE,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  headerTitle: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: '#FFFFFF',
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  headerSubtitle: {
    fontSize: FONTS.SIZE.MD,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DIMENSIONS.CONTAINER_PADDING,
    paddingBottom: DIMENSIONS.SPACING_XXL,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
    padding: DIMENSIONS.SPACING_LG,
    marginBottom: DIMENSIONS.SPACING_LG,
    ...SHADOWS.MEDIUM,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: '#1F2937',
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  sectionDescription: {
    fontSize: FONTS.SIZE.SM,
    color: '#6B7280',
    lineHeight: FONTS.SIZE.SM * FONTS.LINE_HEIGHT.NORMAL,
  },
  sectionContent: {
    gap: DIMENSIONS.SPACING_MD,
  },
  inputContainer: {
    gap: DIMENSIONS.SPACING_XS,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: '#374151',
  },
  inputCounter: {
    fontSize: FONTS.SIZE.XS,
    color: '#9CA3AF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginLeft: DIMENSIONS.SPACING_MD,
  },
  input: {
    flex: 1,
    padding: DIMENSIONS.SPACING_MD,
    fontSize: FONTS.SIZE.MD,
    color: '#1F2937',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: DIMENSIONS.SPACING_MD,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
  },
  errorText: {
    fontSize: FONTS.SIZE.SM,
    color: '#EF4444',
  },
  skillSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING_SM,
  },
  skillCard: {
    flex: 1,
    minWidth: '45%',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  skillCardSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
    ...SHADOWS.SMALL,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  skillIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  skillLabel: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: '#374151',
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  skillLabelSelected: {
    color: '#22C55E',
  },
  skillDescription: {
    fontSize: FONTS.SIZE.XS,
    color: '#6B7280',
    textAlign: 'center',
  },
  skillDescriptionSelected: {
    color: '#16A34A',
  },
  footer: {
    padding: DIMENSIONS.CONTAINER_PADDING,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...SHADOWS.MEDIUM,
  },
  submitButton: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING_MD,
    gap: DIMENSIONS.SPACING_SM,
  },
  submitText: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: '#FFFFFF',
  },
});
