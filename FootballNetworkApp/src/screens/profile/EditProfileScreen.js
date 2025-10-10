// ====== src/screens/profile/EditProfileScreen.js ======
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
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { ModernInput, SectionCard } from '../../components/common';

export const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const isDark = useSelector(state => state.theme?.isDark || false);

  // État du formulaire
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    position: user?.position || '',
    skillLevel: user?.skillLevel || '',
    locationCity: user?.locationCity || '',
    locationLatitude: user?.locationLatitude || null,
    locationLongitude: user?.locationLongitude || null,
    avatar: user?.avatar || null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Détecter les changements
  useEffect(() => {
    const hasChanged = Object.keys(formData).some(
      key => formData[key] !== user?.[key],
    );
    setHasChanges(hasChanged);
  }, [formData, user]);

  // Mettre à jour un champ
  const updateField = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Effacer l'erreur du champ modifié
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  // Positions disponibles
  const positions = [
    { value: 'goalkeeper', label: 'Gardien', icon: '🧤' },
    { value: 'defender', label: 'Défenseur', icon: '🛡️' },
    { value: 'midfielder', label: 'Milieu', icon: '⚡' },
    { value: 'forward', label: 'Attaquant', icon: '⚽' },
    { value: 'any', label: 'Polyvalent', icon: '🌟' },
  ];

  // Niveaux de compétence
  const skillLevels = [
    { value: 'beginner', label: 'Débutant', color: '#94A3B8' },
    { value: 'amateur', label: 'Amateur', color: '#3B82F6' },
    { value: 'intermediate', label: 'Intermédiaire', color: '#F59E0B' },
    { value: 'advanced', label: 'Avancé', color: '#EF4444' },
    { value: 'expert', label: 'Expert', color: '#8B5CF6' },
  ];

  // Sélectionner une photo
  const handleSelectPhoto = useCallback(() => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Erreur', 'Impossible de sélectionner la photo');
        return;
      }

      if (response.assets && response.assets[0]) {
        updateField('avatar', response.assets[0].uri);
      }
    });
  }, [updateField]);

  // Validation du formulaire
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email?.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'La bio ne peut pas dépasser 500 caractères';
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
      // TODO: Appeler l'API pour mettre à jour le profil
      // await dispatch(updateProfile(formData)).unwrap();

      // Simulation
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert('Succès', 'Votre profil a été mis à jour avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour le profil. Veuillez réessayer.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, navigation]);

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
          <Text style={styles.headerTitle}>Modifier mon profil</Text>
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
          {/* Photo de profil */}
          <SectionCard
            title="Photo de profil"
            icon="camera"
            style={styles.photoSection}
          >
            <View style={styles.photoContainer}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handleSelectPhoto}
              >
                {formData.avatar ? (
                  <Image
                    source={{ uri: formData.avatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: COLORS.PRIMARY_LIGHT },
                    ]}
                  >
                    <Icon name="user" size={48} color={COLORS.PRIMARY} />
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

              <Text style={[styles.photoHint, { color: COLORS.TEXT_MUTED }]}>
                Touchez pour modifier votre photo
              </Text>
            </View>
          </SectionCard>

          {/* Informations personnelles */}
          <SectionCard
            title="Informations personnelles"
            description="Vos informations de base"
            icon="user"
          >
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
          </SectionCard>

          {/* Bio */}
          <SectionCard
            title="À propos de moi"
            description="Parlez un peu de vous"
            icon="edit-3"
          >
            <ModernInput
              icon="edit-3"
              placeholder="Écrivez quelques lignes sur vous..."
              value={formData.bio}
              onChangeText={value => updateField('bio', value)}
              error={errors.bio}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={[styles.characterCount, { color: COLORS.TEXT_MUTED }]}>
              {formData.bio?.length || 0} / 500 caractères
            </Text>
          </SectionCard>

          {/* Position */}
          <SectionCard
            title="Position préférée"
            description="Où jouez-vous sur le terrain ?"
            icon="target"
          >
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
          </SectionCard>

          {/* Niveau de compétence */}
          <SectionCard
            title="Niveau de compétence"
            description="Évaluez votre niveau"
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
          </SectionCard>

          {/* Localisation */}
          <SectionCard
            title="Localisation"
            description="Où jouez-vous habituellement ?"
            icon="map-pin"
          >
            <ModernInput
              icon="map-pin"
              placeholder="Ville"
              value={formData.locationCity}
              onChangeText={value => updateField('locationCity', value)}
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

          {/* Zone dangereuse */}
          <SectionCard
            title="Zone de danger"
            icon="alert-triangle"
            style={styles.dangerSection}
          >
            <TouchableOpacity
              style={[
                styles.dangerButton,
                { backgroundColor: COLORS.ERROR_LIGHT },
              ]}
              onPress={() =>
                Alert.alert(
                  'Supprimer le compte',
                  'Cette action est irréversible. Êtes-vous sûr ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive' },
                  ],
                )
              }
            >
              <Icon name="trash-2" size={20} color={COLORS.ERROR} />
              <Text style={[styles.dangerButtonText, { color: COLORS.ERROR }]}>
                Supprimer mon compte
              </Text>
            </TouchableOpacity>
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
  photoSection: {
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_MD,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
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
  photoHint: {
    fontSize: FONTS.SIZE.SM,
    textAlign: 'center',
  },
  characterCount: {
    fontSize: FONTS.SIZE.XS,
    textAlign: 'right',
    marginTop: DIMENSIONS.SPACING_XS,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING_SM,
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
    fontWeight: FONTS.WEIGHT.MEDIUM,
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
  },
  dangerButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
});
