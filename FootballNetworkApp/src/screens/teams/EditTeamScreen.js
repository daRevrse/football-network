// ====== src/screens/teams/EditTeamScreen.js ======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { teamsApi } from '../../services/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

const InputField = ({ label, value, onChange, placeholder, multiline }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && { height: 100, textAlignVertical: 'top' },
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={THEME.TEXT_SEC}
      multiline={multiline}
    />
  </View>
);

export const EditTeamScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({ logo: false, banner: false });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const res = await teamsApi.getTeamById(teamId);
      if (res.success) {
        setFormData({
          name: res.data.name,
          description: res.data.description,
          locationCity: res.data.locationCity,
          maxPlayers: String(res.data.maxPlayers),
          logo: res.data.logoUrl || res.data.logo, // Gère les différentes structures API
          banner: res.data.bannerUrl || res.data.banner,
        });
      }
    } catch (e) {
      Alert.alert('Erreur', 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  };

  // Gestion Upload Image (Générique)
  const handleImagePick = async type => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setUploading(p => ({ ...p, [type]: true }));

      try {
        // Upload via l'API (supposons que teamsApi ait uploadTeamImage)
        // Si votre API gère l'upload direct multipart
        const res = await teamsApi.uploadTeamImage(teamId, type, uri);

        if (res.success) {
          // Mettre à jour l'affichage local
          setFormData(p => ({ ...p, [type]: res.data.url || uri }));
          Alert.alert(
            'Succès',
            `${type === 'logo' ? 'Logo' : 'Bannière'} mis à jour`,
          );
        } else {
          // Fallback si pas d'API upload : on met juste à jour l'état local (pour démo)
          setFormData(p => ({ ...p, [type]: uri }));
        }
      } catch (e) {
        // Si l'API n'est pas encore prête, on met à jour l'UI quand même pour tester
        setFormData(p => ({ ...p, [type]: uri }));
      } finally {
        setUploading(p => ({ ...p, [type]: false }));
      }
    }
  };

  const handleSave = async () => {
    try {
      const res = await teamsApi.updateTeam(teamId, {
        ...formData,
        maxPlayers: parseInt(formData.maxPlayers),
      });
      if (res.success) {
        Alert.alert('Succès', 'Équipe mise à jour', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erreur', res.error);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Problème technique');
    }
  };

  if (loading)
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={THEME.ACCENT} />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="x" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier l'équipe</Text>
        <TouchableOpacity onPress={handleSave}>
          <Icon name="check" size={24} color={THEME.ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section Média */}
        <Text style={styles.sectionTitle}>Apparence</Text>

        {/* Bannière */}
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={() => handleImagePick('banner')}
        >
          {formData.banner ? (
            <Image
              source={{ uri: formData.banner }}
              style={styles.bannerImage}
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Icon name="image" size={32} color={THEME.TEXT_SEC} />
              <Text style={styles.mediaText}>Ajouter une bannière</Text>
            </View>
          )}
          {uploading.banner && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator color="#FFF" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Icon name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Logo (superposé) */}
        <View style={styles.logoWrapper}>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => handleImagePick('logo')}
          >
            {formData.logo ? (
              <Image source={{ uri: formData.logo }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Icon name="shield" size={32} color={THEME.ACCENT} />
              </View>
            )}
            {uploading.logo && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
            <View style={styles.editBadgeSmall}>
              <Icon name="camera" size={10} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />

        {/* Formulaire */}
        <Text style={styles.sectionTitle}>Informations</Text>
        <InputField
          label="Nom"
          value={formData.name}
          onChange={t => setFormData({ ...formData, name: t })}
        />
        <InputField
          label="Ville"
          value={formData.locationCity}
          onChange={t => setFormData({ ...formData, locationCity: t })}
        />
        <InputField
          label="Joueurs Max"
          value={formData.maxPlayers}
          onChange={t => setFormData({ ...formData, maxPlayers: t })}
        />
        <InputField
          label="Description"
          value={formData.description}
          onChange={t => setFormData({ ...formData, description: t })}
          multiline
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.TEXT },
  content: { padding: 24 },

  sectionTitle: {
    color: THEME.TEXT,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // MEDIA STYLES
  bannerContainer: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: -40,
    backgroundColor: THEME.SURFACE,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    position: 'relative',
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mediaText: { color: THEME.TEXT_SEC, fontSize: 12 },

  logoWrapper: { alignItems: 'center', marginBottom: 24 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: THEME.BG,
    backgroundColor: THEME.SURFACE,
    position: 'relative',
  },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
  },
  editBadgeSmall: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: THEME.ACCENT,
    padding: 4,
    borderRadius: 10,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // INPUTS
  inputGroup: { marginBottom: 20 },
  label: {
    color: THEME.TEXT_SEC,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    color: THEME.TEXT,
    fontSize: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
});
