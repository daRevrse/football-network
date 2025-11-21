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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { UserApi } from '../../services/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

// Input Dark
const DarkInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View
      style={[
        styles.inputContainer,
        multiline && { height: 100, alignItems: 'flex-start' },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={18}
          color={THEME.TEXT_SEC}
          style={{ marginRight: 10 }}
        />
      )}
      <TextInput
        style={[styles.input, multiline && { paddingTop: 0 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={THEME.TEXT_SEC}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

export const EditProfileScreen = ({ navigation }) => {
  const user = useSelector(state => state.auth.user);
  const [formData, setFormData] = useState({ ...user });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const updateField = (field, value) =>
    setFormData(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await UserApi.updateProfile(formData);
      if (result.success) navigation.goBack();
      else Alert.alert('Erreur', result.error);
    } catch (e) {
      Alert.alert('Erreur', 'Problème technique');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.5,
    });
    if (result.assets?.[0]?.uri) {
      setUploadingImage(true);
      // Simulation d'upload
      setTimeout(() => {
        updateField('profilePicture', result.assets[0].uri);
        setUploadingImage(false);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Simple */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier Profil</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={THEME.ACCENT} />
          ) : (
            <Text style={styles.saveText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              onPress={handlePhoto}
              style={styles.avatarWrapper}
            >
              {formData.profilePicture ? (
                <Image
                  source={{ uri: formData.profilePicture }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Icon name="user" size={40} color={THEME.ACCENT} />
                </View>
              )}
              <View style={styles.camBadge}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Icon name="camera" size={14} color="#FFF" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.photoLabel}>Changer la photo</Text>
          </View>

          {/* Formulaire */}
          <DarkInput
            label="Prénom"
            value={formData.firstName}
            onChangeText={v => updateField('firstName', v)}
            icon="user"
          />
          <DarkInput
            label="Nom"
            value={formData.lastName}
            onChangeText={v => updateField('lastName', v)}
            icon="user"
          />
          <DarkInput
            label="Poste"
            value={formData.position}
            onChangeText={v => updateField('position', v)}
            placeholder="Ex: Attaquant"
            icon="target"
          />
          <DarkInput
            label="Ville"
            value={formData.locationCity}
            onChangeText={v => updateField('locationCity', v)}
            icon="map-pin"
          />
          <DarkInput
            label="Bio"
            value={formData.bio}
            onChangeText={v => updateField('bio', v)}
            multiline
            placeholder="Décrivez votre style de jeu..."
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  headerTitle: { color: THEME.TEXT, fontSize: 16, fontWeight: 'bold' },
  cancelText: { color: THEME.TEXT_SEC, fontSize: 16 },
  saveText: { color: THEME.ACCENT, fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20 },
  photoSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { position: 'relative', marginBottom: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.ACCENT,
  },
  camBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.BG,
  },
  photoLabel: { color: '#3B82F6', fontSize: 14 },
  inputGroup: { marginBottom: 20 },
  label: {
    color: THEME.TEXT_SEC,
    marginBottom: 8,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  inputContainer: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  input: { flex: 1, color: THEME.TEXT, fontSize: 16 },
});
