// ====== src/screens/profile/EditProfileScreen.js - NOUVEAU DESIGN ======
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
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { UserApi } from '../../services/api';

// Composant Input moderne
const ModernInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon,
  multiline,
  ...props
}) => (
  <View style={styles.inputContainer}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
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
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          icon && styles.inputWithIcon,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
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

// Composant SelectButton
const SelectButton = ({ label, value, onPress, icon }) => (
  <TouchableOpacity
    style={styles.selectButton}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.selectLeft}>
      <View style={styles.selectIconContainer}>
        <Icon name={icon} size={20} color="#22C55E" />
      </View>
      <View style={styles.selectTextContainer}>
        <Text style={styles.selectLabel}>{label}</Text>
        <Text style={styles.selectValue}>{value}</Text>
      </View>
    </View>
    <Icon name="chevron-right" size={22} color="#CBD5E1" />
  </TouchableOpacity>
);

export const EditProfileScreen = ({ navigation }) => {
  const user = useSelector(state => state.auth.user);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    position: user?.position || '',
    skillLevel: user?.skillLevel || '',
    locationCity: user?.locationCity || '',
    avatar: user?.avatar || user?.profilePicture || null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const positions = [
    { value: '', label: 'Non spécifié' },
    { value: 'goalkeeper', label: 'Gardien de but' },
    { value: 'defender', label: 'Défenseur' },
    { value: 'midfielder', label: 'Milieu de terrain' },
    { value: 'forward', label: 'Attaquant' },
    { value: 'any', label: 'Polyvalent' },
  ];

  const skillLevels = [
    { value: '', label: 'Non spécifié' },
    { value: 'beginner', label: 'Débutant' },
    { value: 'amateur', label: 'Amateur' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'advanced', label: 'Avancé' },
    { value: 'semi_pro', label: 'Semi-professionnel' },
  ];

  useEffect(() => {
    const hasChanged = Object.keys(formData).some(
      key => formData[key] !== user?.[key],
    );
    setHasChanges(hasChanged);
  }, [formData, user]);

  const updateField = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Minimum 2 caractères';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Minimum 2 caractères';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Maximum 500 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectPhoto = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      });

      if (result.didCancel) return;

      const selectedImage = result.assets?.[0];
      if (selectedImage?.uri) {
        setUploadingImage(true);
        const uploadResult = await UserApi.uploadAvatar(selectedImage.uri);

        if (uploadResult.success) {
          updateField('avatar', uploadResult.data);
          Alert.alert('Succès', 'Photo mise à jour');
        } else {
          Alert.alert('Erreur', uploadResult.error);
        }
        setUploadingImage(false);
      }
    } catch (error) {
      setUploadingImage(false);
      Alert.alert('Erreur', 'Impossible de sélectionner une photo');
    }
  }, [updateField]);

  const handleSelectPosition = useCallback(() => {
    Alert.alert(
      'Position préférée',
      'Sélectionnez votre position',
      positions.map(pos => ({
        text: pos.label,
        onPress: () => updateField('position', pos.value),
      })),
    );
  }, [updateField]);

  const handleSelectSkillLevel = useCallback(() => {
    Alert.alert(
      'Niveau de compétence',
      'Sélectionnez votre niveau',
      skillLevels.map(level => ({
        text: level.label,
        onPress: () => updateField('skillLevel', level.value),
      })),
    );
  }, [updateField]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs');
      return;
    }

    try {
      setIsLoading(true);
      const result = await UserApi.updateProfile(formData);

      if (result.success) {
        Alert.alert('Succès', 'Profil mis à jour', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionLabel = value => {
    return positions.find(p => p.value === value)?.label || 'Non spécifié';
  };

  const getSkillLevelLabel = value => {
    return skillLevels.find(l => l.value === value)?.label || 'Non spécifié';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="x" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Modifier le profil</Text>

        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !hasChanges}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Icon
              name="check"
              size={24}
              color={hasChanges ? '#FFF' : '#FFFFFF60'}
            />
          )}
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo de profil */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleSelectPhoto}
              disabled={uploadingImage}
              activeOpacity={0.7}
            >
              {formData.avatar ? (
                <Image
                  source={{ uri: formData.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={['#22C55E20', '#22C55E10']}
                  style={styles.avatarPlaceholder}
                >
                  <Icon name="user" size={48} color="#22C55E" />
                </LinearGradient>
              )}

              <View style={styles.cameraButton}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.cameraGradient}
                  >
                    <Icon name="camera" size={18} color="#FFF" />
                  </LinearGradient>
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Touchez pour changer la photo</Text>
          </View>

          {/* Informations personnelles */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="user" size={20} color="#22C55E" />
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
            </View>

            <ModernInput
              label="Prénom *"
              value={formData.firstName}
              onChangeText={value => updateField('firstName', value)}
              placeholder="Jean"
              error={errors.firstName}
              icon="user"
            />

            <ModernInput
              label="Nom *"
              value={formData.lastName}
              onChangeText={value => updateField('lastName', value)}
              placeholder="Dupont"
              error={errors.lastName}
              icon="user"
            />

            <ModernInput
              label="Téléphone"
              value={formData.phone}
              onChangeText={value => updateField('phone', value)}
              placeholder="+33 6 12 34 56 78"
              error={errors.phone}
              icon="phone"
              keyboardType="phone-pad"
            />
          </View>

          {/* Informations football */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="activity" size={20} color="#22C55E" />
              <Text style={styles.sectionTitle}>Informations football</Text>
            </View>

            <SelectButton
              label="Position préférée"
              value={getPositionLabel(formData.position)}
              onPress={handleSelectPosition}
              icon="target"
            />

            <SelectButton
              label="Niveau de compétence"
              value={getSkillLevelLabel(formData.skillLevel)}
              onPress={handleSelectSkillLevel}
              icon="award"
            />

            <ModernInput
              label="Biographie"
              value={formData.bio}
              onChangeText={value => updateField('bio', value)}
              placeholder="Parlez-nous de votre passion pour le football..."
              multiline
              numberOfLines={4}
              error={errors.bio}
            />
            <Text style={styles.charCount}>
              {formData.bio.length}/500 caractères
            </Text>
          </View>

          {/* Localisation */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="map-pin" size={20} color="#22C55E" />
              <Text style={styles.sectionTitle}>Localisation</Text>
            </View>

            <ModernInput
              label="Ville"
              value={formData.locationCity}
              onChangeText={value => updateField('locationCity', value)}
              placeholder="Paris"
              icon="map-pin"
            />

            <Text style={styles.hint}>
              💡 Votre ville nous aide à vous proposer des équipes et matchs à
              proximité
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    ...SHADOWS.MEDIUM,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
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
    borderRadius: 18,
    overflow: 'hidden',
  },
  cameraGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...SHADOWS.SMALL,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...SHADOWS.SMALL,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#22C55E15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectTextContainer: {
    flex: 1,
  },
  selectLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  selectValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: -8,
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
  },
});
