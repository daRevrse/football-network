// ====== src/screens/teams/CreateTeamScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { ModernInput, ModernButton } from '../../components/common';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Composant Card de section
const SectionCard = ({ title, description, icon, children, COLORS }) => (
  <View style={[styles.sectionCard, { backgroundColor: COLORS.WHITE }]}>
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name={icon} size={20} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
          {title}
        </Text>
        {description && (
          <Text
            style={[
              styles.sectionDescription,
              { color: COLORS.TEXT_SECONDARY },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Composant de sélection de niveau amélioré
const SkillLevelSelector = React.memo(({ value, onSelect, COLORS }) => {
  const skillLevels = [
    {
      value: 'beginner',
      label: 'Débutant',
      color: '#94A3B8',
      icon: 'smile',
      description: 'Pour le plaisir',
    },
    {
      value: 'amateur',
      label: 'Amateur',
      color: '#3B82F6',
      icon: 'thumbs-up',
      description: 'Régulièrement',
    },
    {
      value: 'intermediate',
      label: 'Intermédiaire',
      color: '#F59E0B',
      icon: 'award',
      description: 'Bon niveau',
    },
    {
      value: 'advanced',
      label: 'Avancé',
      color: '#EF4444',
      icon: 'zap',
      description: 'Très technique',
    },
    {
      value: 'expert',
      label: 'Expert',
      color: '#8B5CF6',
      icon: 'star',
      description: 'Compétition',
    },
  ];

  return (
    <View style={styles.skillSelector}>
      {skillLevels.map(level => {
        const isSelected = value === level.value;
        return (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.skillCard,
              {
                backgroundColor: isSelected
                  ? level.color
                  : COLORS.BACKGROUND_LIGHT,
                borderColor: isSelected ? level.color : COLORS.BORDER,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => onSelect(level.value)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.skillIconContainer,
                {
                  backgroundColor: isSelected
                    ? 'rgba(255,255,255,0.2)'
                    : 'transparent',
                },
              ]}
            >
              <Icon
                name={level.icon}
                size={20}
                color={isSelected ? '#FFFFFF' : level.color}
              />
            </View>
            <Text
              style={[
                styles.skillLabel,
                { color: isSelected ? '#FFFFFF' : COLORS.TEXT_PRIMARY },
              ]}
            >
              {level.label}
            </Text>
            {isSelected && (
              <Icon
                name="check"
                size={16}
                color="#FFFFFF"
                style={styles.checkmark}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

// Composant de compteur pour le nombre de joueurs
const PlayerCounter = ({ value, onChange, COLORS }) => {
  const increment = () => {
    const current = parseInt(value) || 11;
    if (current < 30) onChange((current + 1).toString());
  };

  const decrement = () => {
    const current = parseInt(value) || 11;
    if (current > 5) onChange((current - 1).toString());
  };

  return (
    <View style={styles.counterContainer}>
      <Text style={[styles.counterLabel, { color: COLORS.TEXT_PRIMARY }]}>
        Nombre de joueurs
      </Text>
      <View style={styles.counter}>
        <TouchableOpacity
          style={[
            styles.counterButton,
            { backgroundColor: COLORS.BACKGROUND_LIGHT },
          ]}
          onPress={decrement}
        >
          <Icon name="minus" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>

        <View
          style={[
            styles.counterValue,
            { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
          ]}
        >
          <Icon name="users" size={20} color={COLORS.PRIMARY} />
          <Text style={[styles.counterText, { color: COLORS.PRIMARY }]}>
            {value || '11'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.counterButton,
            { backgroundColor: COLORS.BACKGROUND_LIGHT },
          ]}
          onPress={increment}
        >
          <Icon name="plus" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.counterHint, { color: COLORS.TEXT_MUTED }]}>
        Entre 5 et 30 joueurs
      </Text>
    </View>
  );
};

export const CreateTeamScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { colors: COLORS, isDark } = useTheme('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skillLevel: 'amateur',
    locationCity: '',
    maxPlayers: '11',
  });
  const [errors, setErrors] = useState({});

  const updateField = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de l'équipe est requis";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Une description est requise';
    } else if (formData.description.trim().length < 10) {
      newErrors.description =
        'La description doit contenir au moins 10 caractères';
    }

    if (!formData.locationCity.trim()) {
      newErrors.locationCity = 'La ville est requise';
    }

    const maxPlayers = parseInt(formData.maxPlayers);
    if (isNaN(maxPlayers) || maxPlayers < 5 || maxPlayers > 30) {
      newErrors.maxPlayers = 'Le nombre de joueurs doit être entre 5 et 30';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      console.log('Création équipe:', formData);

      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        '🎉 Équipe créée !',
        `L'équipe "${formData.name}" a été créée avec succès. Vous pouvez maintenant inviter des joueurs !`,
        [
          {
            text: 'Voir mon équipe',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        "Impossible de créer l'équipe. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, navigation]);

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header avec gradient */}
        {/* <View style={[styles.header, { backgroundColor: COLORS.PRIMARY }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="x" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Icon name="plus-circle" size={32} color={COLORS.WHITE} />
            </View>
            <Text style={styles.headerTitle}>Nouvelle équipe</Text>
            <Text style={styles.headerSubtitle}>
              Quelques infos pour commencer
            </Text>
          </View>
        </View> */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section Identité */}
          <SectionCard
            title="Identité"
            description="Comment s'appelle votre équipe ?"
            icon="flag"
            COLORS={COLORS}
          >
            <ModernInput
              label="Nom de l'équipe"
              value={formData.name}
              onChangeText={value => updateField('name', value)}
              placeholder="Ex: Les Tigres de Paris"
              error={errors.name}
              leftIconName="flag"
              maxLength={50}
            />

            <ModernInput
              label="Description"
              value={formData.description}
              onChangeText={value => updateField('description', value)}
              placeholder="Décrivez votre équipe en quelques mots..."
              error={errors.description}
              leftIconName="file-text"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </SectionCard>

          {/* Section Niveau */}
          <SectionCard
            title="Niveau de jeu"
            description="Sélectionnez le niveau de votre équipe"
            icon="trending-up"
            COLORS={COLORS}
          >
            <SkillLevelSelector
              value={formData.skillLevel}
              onSelect={value => updateField('skillLevel', value)}
              COLORS={COLORS}
            />
          </SectionCard>

          {/* Section Localisation */}
          <SectionCard
            title="Localisation"
            description="Où se trouve votre équipe ?"
            icon="map-pin"
            COLORS={COLORS}
          >
            <ModernInput
              label="Ville"
              value={formData.locationCity}
              onChangeText={value => updateField('locationCity', value)}
              placeholder="Ex: Paris, Lyon, Marseille..."
              error={errors.locationCity}
              leftIconName="map-pin"
              maxLength={50}
            />
          </SectionCard>

          {/* Section Effectif */}
          <SectionCard
            title="Effectif"
            description="Combien de joueurs maximum ?"
            icon="users"
            COLORS={COLORS}
          >
            <PlayerCounter
              value={formData.maxPlayers}
              onChange={value => updateField('maxPlayers', value)}
              COLORS={COLORS}
            />
          </SectionCard>
        </ScrollView>

        {/* Footer fixe */}
        <View
          style={[
            styles.footer,
            { backgroundColor: COLORS.WHITE, borderTopColor: COLORS.BORDER },
          ]}
        >
          <View style={styles.footerContent}>
            <View style={styles.footerInfo}>
              <Icon name="info" size={16} color={COLORS.TEXT_MUTED} />
              <Text style={[styles.footerText, { color: COLORS.TEXT_MUTED }]}>
                Vous pourrez modifier ces informations plus tard
              </Text>
            </View>

            <ModernButton
              title="Créer l'équipe"
              onPress={handleSubmit}
              disabled={isLoading}
              isLoading={isLoading}
              variant="primary"
              leftIconName="check"
            />
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
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  sectionDescription: {
    fontSize: FONTS.SIZE.SM,
    lineHeight: FONTS.SIZE.SM * FONTS.LINE_HEIGHT.NORMAL,
  },
  sectionContent: {
    gap: DIMENSIONS.SPACING_MD,
  },
  skillSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING_SM,
  },
  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_SM,
    paddingRight: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    position: 'relative',
    ...SHADOWS.SMALL,
  },
  skillIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_SM,
  },
  skillLabel: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  skillDescription: {
    display: 'none',
  },
  checkmark: {
    marginLeft: DIMENSIONS.SPACING_XS,
  },
  counterContainer: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_MD,
  },
  counterLabel: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_MD,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  counterValue: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_LG,
    paddingVertical: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_SM,
  },
  counterText: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  counterHint: {
    fontSize: FONTS.SIZE.XS,
  },
  footer: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingTop: DIMENSIONS.SPACING_MD,
    paddingBottom:
      Platform.OS === 'ios' ? DIMENSIONS.SPACING_XL : DIMENSIONS.SPACING_MD,
    borderTopWidth: 1,
    ...SHADOWS.MEDIUM,
  },
  footerContent: {
    gap: DIMENSIONS.SPACING_MD,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
  },
  footerText: {
    fontSize: FONTS.SIZE.XS,
    flex: 1,
  },
});
