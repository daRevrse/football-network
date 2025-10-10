// ====== src/screens/teams/EditTeamScreen.js ======
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { ModernInput } from '../../components/common/ModernInput';
import { SectionCard } from '../../components/common/SectionCard';

export const EditTeamScreen = ({ route, navigation }) => {
  const { teamId, team: initialTeam } = route.params || {};
  const isDark = useSelector(state => state.theme?.isDark || false);

  // État du formulaire (pré-rempli avec les données de l'équipe)
  const [formData, setFormData] = useState({
    name: initialTeam?.name || '',
    description: initialTeam?.description || '',
    skillLevel: initialTeam?.skillLevel || '',
    locationCity: initialTeam?.locationCity || '',
    locationLatitude: initialTeam?.locationLatitude || null,
    locationLongitude: initialTeam?.locationLongitude || null,
    type: initialTeam?.type || '',
    maxPlayers: initialTeam?.maxPlayers?.toString() || '11',
    logo: initialTeam?.logo || null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Détecter les changements
  useEffect(() => {
    const hasChanged = Object.keys(formData).some(
      key => formData[key] !== initialTeam?.[key],
    );
    setHasChanges(hasChanged);
  }, [formData, initialTeam]);

  // Mettre à jour un champ
  const updateField = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  // Niveaux de compétence
  const skillLevels = [
    { value: 'beginner', label: 'Débutant', color: '#94A3B8', icon: '🌱' },
    { value: 'amateur', label: 'Amateur', color: '#3B82F6', icon: '⚽' },
    {
      value: 'intermediate',
      label: 'Intermédiaire',
      color: '#F59E0B',
      icon: '🔥',
    },
    { value: 'advanced', label: 'Avancé', color: '#EF4444', icon: '⚡' },
    { value: 'semi_pro', label: 'Semi-pro', color: '#8B5CF6', icon: '🏆' },
  ];

  // Types d'équipe
  const teamTypes = [
    {
      value: 'competitive',
      label: 'Compétition',
      icon: '🏆',
      description: 'Matchs sérieux et compétitifs',
    },
    {
      value: 'recreational',
      label: 'Loisir',
      icon: '🎉',
      description: 'Pour le plaisir et la convivialité',
    },
    {
      value: 'mixed',
      label: 'Mixte',
      icon: '🌟',
      description: 'Équilibre entre fun et compétition',
    },
  ];

  // Sélectionner un logo
  const handleSelectLogo = useCallback(() => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Erreur', 'Impossible de sélectionner le logo');
        return;
      }

      if (response.assets && response.assets[0]) {
        updateField('logo', response.assets[0].uri);
      }
    });
  }, [updateField]);

  // Validation du formulaire
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Le nom de l'équipe est requis";
    } else if (formData.name.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description =
        'La description ne peut pas dépasser 500 caractères';
    }

    if (!formData.skillLevel) {
      newErrors.skillLevel = 'Le niveau de compétence est requis';
    }

    if (!formData.type) {
      newErrors.type = "Le type d'équipe est requis";
    }

    if (!formData.locationCity?.trim()) {
      newErrors.locationCity = 'La ville est requise';
    }

    const maxPlayers = parseInt(formData.maxPlayers);
    if (isNaN(maxPlayers) || maxPlayers < 5 || maxPlayers > 30) {
      newErrors.maxPlayers = 'Le nombre de joueurs doit être entre 5 et 30';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Sauvegarder les modifications
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Appeler l'API pour mettre à jour l'équipe
      // await dispatch(updateTeam({ teamId, ...formData })).unwrap();

      // Simulation
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Succès',
        `L'équipe "${formData.name}" a été mise à jour avec succès`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        "Impossible de mettre à jour l'équipe. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, navigation]);

  // Annuler les modifications
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Annuler les modifications',
        'Êtes-vous sûr de vouloir annuler vos modifications ?',
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  // Supprimer l'équipe
  const handleDeleteTeam = useCallback(() => {
    Alert.alert(
      "Supprimer l'équipe",
      `Êtes-vous sûr de vouloir supprimer "${formData.name}" ?\n\nCette action est IRRÉVERSIBLE. Tous les matchs, membres et données associés seront définitivement supprimés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              "Tapez le nom de l'équipe pour confirmer la suppression",
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Confirmer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // TODO: Appeler l'API pour supprimer l'équipe
                      // await dispatch(deleteTeam(teamId)).unwrap();
                      Alert.alert('Succès', 'Équipe supprimée', [
                        {
                          text: 'OK',
                          onPress: () => navigation.navigate('MyTeams'),
                        },
                      ]);
                    } catch (error) {
                      Alert.alert('Erreur', "Impossible de supprimer l'équipe");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [formData.name, navigation]);

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.PRIMARY }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Icon name="x" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Modifier l'équipe</Text>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={!hasChanges || isLoading}
        >
          {isLoading ? (
            <Text style={styles.saveButtonText}>...</Text>
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                !hasChanges && styles.saveButtonTextDisabled,
              ]}
            >
              Enregistrer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo de l'équipe */}
          <SectionCard
            title="Logo de l'équipe"
            icon="image"
            style={styles.logoSection}
          >
            <View style={styles.logoContainer}>
              <TouchableOpacity
                style={styles.logoWrapper}
                onPress={handleSelectLogo}
              >
                {formData.logo ? (
                  <Image source={{ uri: formData.logo }} style={styles.logo} />
                ) : (
                  <View
                    style={[
                      styles.logoPlaceholder,
                      { backgroundColor: COLORS.PRIMARY_LIGHT },
                    ]}
                  >
                    <Icon name="shield" size={48} color={COLORS.PRIMARY} />
                  </View>
                )}

                <View
                  style={[
                    styles.cameraButton,
                    { backgroundColor: COLORS.PRIMARY },
                  ]}
                >
                  <Icon name="camera" size={18} color={COLORS.WHITE} />
                </View>
              </TouchableOpacity>

              <Text style={[styles.logoHint, { color: COLORS.TEXT_MUTED }]}>
                Touchez pour modifier le logo
              </Text>
            </View>
          </SectionCard>

          {/* Informations de base */}
          <SectionCard
            title="Informations de base"
            description="Identité de votre équipe"
            icon="info"
          >
            <ModernInput
              icon="shield"
              placeholder="Nom de l'équipe"
              value={formData.name}
              onChangeText={value => updateField('name', value)}
              error={errors.name}
              autoCapitalize="words"
              maxLength={50}
            />

            <ModernInput
              icon="edit-3"
              placeholder="Description (optionnel)"
              value={formData.description}
              onChangeText={value => updateField('description', value)}
              error={errors.description}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            {formData.description && (
              <Text
                style={[styles.characterCount, { color: COLORS.TEXT_MUTED }]}
              >
                {formData.description.length} / 500 caractères
              </Text>
            )}
          </SectionCard>

          {/* Type d'équipe */}
          <SectionCard
            title="Type d'équipe"
            description="Définissez l'esprit de votre équipe"
            icon="flag"
          >
            <View style={styles.typesList}>
              {teamTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor:
                        formData.type === type.value
                          ? COLORS.PRIMARY_LIGHT
                          : COLORS.WHITE,
                      borderColor:
                        formData.type === type.value
                          ? COLORS.PRIMARY
                          : COLORS.BORDER_LIGHT,
                    },
                  ]}
                  onPress={() => updateField('type', type.value)}
                >
                  <Text style={styles.typeEmoji}>{type.icon}</Text>
                  <View style={styles.typeContent}>
                    <Text
                      style={[
                        styles.typeLabel,
                        {
                          color:
                            formData.type === type.value
                              ? COLORS.PRIMARY
                              : COLORS.TEXT_PRIMARY,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text
                      style={[
                        styles.typeDescription,
                        { color: COLORS.TEXT_MUTED },
                      ]}
                    >
                      {type.description}
                    </Text>
                  </View>

                  {formData.type === type.value && (
                    <View style={styles.checkIcon}>
                      <Icon
                        name="check-circle"
                        size={24}
                        color={COLORS.PRIMARY}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {errors.type && (
              <Text style={[styles.errorText, { color: COLORS.ERROR }]}>
                {errors.type}
              </Text>
            )}
          </SectionCard>

          {/* Niveau de compétence */}
          <SectionCard
            title="Niveau de l'équipe"
            description="Évaluez le niveau général"
            icon="award"
          >
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
                  <Text style={styles.skillEmoji}>{level.icon}</Text>
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
          </SectionCard>

          {/* Configuration */}
          <SectionCard
            title="Configuration"
            description="Paramètres de l'équipe"
            icon="settings"
          >
            <ModernInput
              icon="users"
              placeholder="Nombre maximum de joueurs"
              value={formData.maxPlayers}
              onChangeText={value => updateField('maxPlayers', value)}
              error={errors.maxPlayers}
              keyboardType="number-pad"
              maxLength={2}
            />

            <ModernInput
              icon="map-pin"
              placeholder="Ville"
              value={formData.locationCity}
              onChangeText={value => updateField('locationCity', value)}
              error={errors.locationCity}
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[
                styles.mapButton,
                { backgroundColor: COLORS.PRIMARY_LIGHT },
              ]}
              onPress={() =>
                Alert.alert('Info', 'Fonctionnalité bientôt disponible')
              }
            >
              <Icon name="map" size={20} color={COLORS.PRIMARY} />
              <Text style={[styles.mapButtonText, { color: COLORS.PRIMARY }]}>
                Sélectionner sur la carte
              </Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Zone de danger */}
          <SectionCard
            title="Zone de danger"
            description="Actions irréversibles"
            icon="alert-triangle"
            iconColor={COLORS.ERROR}
            style={styles.dangerSection}
          >
            <TouchableOpacity
              style={[
                styles.dangerButton,
                { backgroundColor: COLORS.ERROR_LIGHT },
              ]}
              onPress={handleDeleteTeam}
            >
              <Icon name="trash-2" size={20} color={COLORS.ERROR} />
              <Text style={[styles.dangerButtonText, { color: COLORS.ERROR }]}>
                Supprimer l'équipe
              </Text>
            </TouchableOpacity>

            <Text style={[styles.dangerWarning, { color: COLORS.TEXT_MUTED }]}>
              ⚠️ Cette action supprimera définitivement l'équipe, tous les
              membres et l'historique des matchs.
            </Text>
          </SectionCard>

          {/* Espace en bas */}
          <View style={{ height: DIMENSIONS.SPACING_XXL }} />
        </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: DIMENSIONS.SPACING_MD,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.SMALL,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  saveButton: {
    width: 100,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.WHITE,
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingVertical: DIMENSIONS.SPACING_LG,
  },
  logoSection: {
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_MD,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    ...SHADOWS.MEDIUM,
  },
  logoHint: {
    fontSize: FONTS.SIZE.SM,
    textAlign: 'center',
  },
  characterCount: {
    fontSize: FONTS.SIZE.XS,
    textAlign: 'right',
    marginTop: DIMENSIONS.SPACING_XS,
  },
  typesList: {
    gap: DIMENSIONS.SPACING_SM,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 2,
    position: 'relative',
  },
  typeEmoji: {
    fontSize: 32,
    marginRight: DIMENSIONS.SPACING_MD,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  typeDescription: {
    fontSize: FONTS.SIZE.SM,
    lineHeight: FONTS.SIZE.SM * 1.4,
  },
  checkIcon: {
    marginLeft: DIMENSIONS.SPACING_SM,
  },
  skillList: {
    gap: DIMENSIONS.SPACING_SM,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 2,
  },
  skillEmoji: {
    fontSize: 24,
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
  errorText: {
    fontSize: FONTS.SIZE.SM,
    marginTop: DIMENSIONS.SPACING_XS,
  },
  dangerSection: {
    marginTop: DIMENSIONS.SPACING_XL,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  dangerButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  dangerWarning: {
    fontSize: FONTS.SIZE.SM,
    textAlign: 'center',
    lineHeight: FONTS.SIZE.SM * 1.5,
  },
});
