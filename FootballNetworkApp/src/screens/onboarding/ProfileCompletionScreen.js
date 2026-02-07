/**
 * ProfileCompletionScreen - Complete profile after registration
 * Collects additional information based on role
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../theme/colors';

const POSITIONS = [
  { id: 'goalkeeper', label: 'Gardien', icon: 'shield' },
  { id: 'defender', label: 'Defenseur', icon: 'user' },
  { id: 'midfielder', label: 'Milieu', icon: 'users' },
  { id: 'forward', label: 'Attaquant', icon: 'target' },
  { id: 'any', label: 'Polyvalent', icon: 'star' },
];

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Debutant' },
  { id: 'amateur', label: 'Amateur' },
  { id: 'intermediate', label: 'Intermediaire' },
  { id: 'advanced', label: 'Avance' },
  { id: 'semi_pro', label: 'Semi-pro' },
];

export const ProfileCompletionScreen = ({ navigation, route }) => {
  const { userType } = route.params || { userType: 'player' };

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [bio, setBio] = useState('');
  const [position, setPosition] = useState(null);
  const [skillLevel, setSkillLevel] = useState(null);
  const [city, setCity] = useState('');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'acceder a la galerie photo");
    }
  };

  const handleSkip = () => {
    navigation.navigate('Tutorial', { userType });
  };

  const handleComplete = () => {
    // TODO: Save profile data via API
    navigation.navigate('Tutorial', { userType });
  };

  const isPlayerRole = userType === 'player' || userType === 'manager';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Completez votre profil</Text>
        <Text style={styles.subtitle}>
          Aidez les autres a mieux vous connaitre
        </Text>

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Icon name="camera" size={32} color={COLORS.TEXT_MUTED} />
              </View>
            )}
            <View style={styles.photoBadge}>
              <Icon name="plus" size={16} color={COLORS.TEXT_WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoLabel}>Ajouter une photo</Text>
        </View>

        {/* Bio */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            placeholder="Parlez-nous de vous..."
            placeholderTextColor={COLORS.PLACEHOLDER}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>

        {/* City */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Ville</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Votre ville"
            placeholderTextColor={COLORS.PLACEHOLDER}
            value={city}
            onChangeText={setCity}
          />
        </View>

        {/* Position (for players/managers) */}
        {isPlayerRole && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Position preferee</Text>
            <View style={styles.optionsGrid}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos.id}
                  style={[
                    styles.optionButton,
                    position === pos.id && styles.optionButtonSelected,
                  ]}
                  onPress={() => setPosition(pos.id)}
                >
                  <Icon
                    name={pos.icon}
                    size={20}
                    color={position === pos.id ? COLORS.PRIMARY : COLORS.TEXT_MUTED}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      position === pos.id && styles.optionTextSelected,
                    ]}
                  >
                    {pos.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Skill Level (for players/managers) */}
        {isPlayerRole && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Niveau</Text>
            <View style={styles.skillOptions}>
              {SKILL_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.skillButton,
                    skillLevel === level.id && styles.skillButtonSelected,
                  ]}
                  onPress={() => setSkillLevel(level.id)}
                >
                  <Text
                    style={[
                      styles.skillText,
                      skillLevel === level.id && styles.skillTextSelected,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>Terminer</Text>
          <Icon name="check" size={20} color={COLORS.TEXT_WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: COLORS.TEXT_MUTED,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_MUTED,
    marginBottom: 32,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.BACKGROUND,
  },
  photoLabel: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  bioInput: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  optionButtonSelected: {
    backgroundColor: `${COLORS.PRIMARY}10`,
    borderColor: COLORS.PRIMARY,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.PRIMARY,
  },
  skillOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillButton: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  skillButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  skillText: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
    fontWeight: '500',
  },
  skillTextSelected: {
    color: COLORS.TEXT_WHITE,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_WHITE,
    marginRight: 8,
  },
});

export default ProfileCompletionScreen;
