// ====== src/screens/matches/CreateMatchScreen.js - NOUVEAU DESIGN + BACKEND ======
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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { matchesApi, teamsApi } from '../../services/api';

// Composant ModernInput (réutilisable)
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
  editable = true,
  onPress,
  ...props
}) => {
  const InputComponent = onPress ? TouchableOpacity : View;

  return (
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
      <InputComponent
        style={[
          styles.inputWrapper,
          error && styles.inputWrapperError,
          multiline && styles.inputWrapperMultiline,
          !editable && styles.inputWrapperDisabled,
        ]}
        onPress={onPress}
        disabled={!onPress}
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
          editable={editable && !onPress}
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            multiline && styles.inputMultiline,
          ]}
          {...props}
        />
        {onPress && <Icon name="chevron-down" size={20} color="#9CA3AF" />}
      </InputComponent>
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

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

// Modal de sélection d'équipe
const TeamSelectorModal = ({
  visible,
  onClose,
  teams,
  onSelect,
  selectedTeam,
}) => (
  <Modal visible={visible} animationType="slide" transparent={true}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Sélectionnez une équipe</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Icon name="x" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          {teams.map(team => (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.teamOption,
                selectedTeam?.id === team.id && styles.teamOptionSelected,
              ]}
              onPress={() => {
                onSelect(team);
                onClose();
              }}
            >
              <View style={styles.teamOptionIcon}>
                <Icon name="shield" size={24} color="#22C55E" />
              </View>
              <View style={styles.teamOptionInfo}>
                <Text style={styles.teamOptionName}>{team.name}</Text>
                <Text style={styles.teamOptionMeta}>
                  {team.member_count} membres
                </Text>
              </View>
              {selectedTeam?.id === team.id && (
                <Icon name="check" size={20} color="#22C55E" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export const CreateMatchScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [myTeams, setMyTeams] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [formData, setFormData] = useState({
    team1: null, // Mon équipe
    opponentName: '',
    scheduledDate: new Date(),
    location: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMyTeams();
  }, []);

  const loadMyTeams = async () => {
    try {
      setLoadingTeams(true);
      const result = await teamsApi.getMyTeams();

      if (result.success) {
        // Filtrer seulement les équipes où je suis capitaine
        const captainTeams = result.data.filter(
          t => t.role === 'owner' || t.role === 'captain',
        );
        setMyTeams(captainTeams);

        // Pré-sélectionner la première équipe
        if (captainTeams.length > 0) {
          setFormData(prev => ({ ...prev, team1: captainTeams[0] }));
        }
      }
    } catch (error) {
      console.error('Load teams error:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.team1) {
      newErrors.team1 = 'Sélectionnez votre équipe';
    }

    if (!formData.opponentName.trim()) {
      newErrors.opponentName = "Nom de l'adversaire requis";
    } else if (formData.opponentName.trim().length < 3) {
      newErrors.opponentName = 'Minimum 3 caractères';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Lieu requis';
    }

    // Vérifier que la date est dans le futur
    if (formData.scheduledDate < new Date()) {
      newErrors.scheduledDate = 'La date doit être dans le futur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(formData.scheduledDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      updateFormData('scheduledDate', newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(formData.scheduledDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      updateFormData('scheduledDate', newDate);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs du formulaire');
      return;
    }

    try {
      setIsLoading(true);

      const matchData = {
        team1_id: formData.team1.id,
        opponent_name: formData.opponentName.trim(),
        scheduled_at: formData.scheduledDate.toISOString(),
        location: formData.location.trim(),
        description: formData.description.trim() || undefined,
      };

      const result = await matchesApi.createMatch(matchData);

      if (result.success) {
        Alert.alert('Succès', 'Le match a été créé avec succès !', [
          {
            text: 'Voir le match',
            onPress: () => {
              navigation.navigate('MatchDetail', {
                matchId: result.data.id,
              });
            },
          },
        ]);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer le match');
      }
    } catch (error) {
      console.error('Create match error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingTeams) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (myTeams.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="users" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Aucune équipe</Text>
        <Text style={styles.emptyDescription}>
          Vous devez être capitaine d'une équipe pour créer un match
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Teams')}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyButtonGradient}
          >
            <Icon name="plus" size={20} color="#FFF" />
            <Text style={styles.emptyButtonText}>Créer une équipe</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
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
            <Icon name="calendar" size={32} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>Nouveau match</Text>
          <Text style={styles.headerSubtitle}>
            Organisez votre prochain match
          </Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Section Équipes */}
          <SectionCard
            title="Équipes"
            description="Qui joue ?"
            icon="users"
            iconBg="#22C55E"
          >
            <ModernInput
              label="Votre équipe"
              value={formData.team1?.name || ''}
              placeholder="Sélectionnez votre équipe"
              error={errors.team1}
              icon="shield"
              editable={false}
              onPress={() => setShowTeamModal(true)}
            />

            <ModernInput
              label="Équipe adverse"
              value={formData.opponentName}
              onChangeText={text => updateFormData('opponentName', text)}
              placeholder="Nom de l'équipe adverse"
              error={errors.opponentName}
              icon="shield"
              maxLength={100}
            />
          </SectionCard>

          {/* Section Date et Heure */}
          <SectionCard
            title="Date et Heure"
            description="Quand se joue le match ?"
            icon="calendar"
            iconBg="#3B82F6"
          >
            <ModernInput
              label="Date"
              value={formData.scheduledDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              placeholder="Sélectionnez la date"
              error={errors.scheduledDate}
              icon="calendar"
              editable={false}
              onPress={() => setShowDatePicker(true)}
            />

            <ModernInput
              label="Heure"
              value={formData.scheduledDate.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              placeholder="Sélectionnez l'heure"
              icon="clock"
              editable={false}
              onPress={() => setShowTimePicker(true)}
            />
          </SectionCard>

          {/* Section Lieu */}
          <SectionCard
            title="Lieu"
            description="Où se joue le match ?"
            icon="map-pin"
            iconBg="#F59E0B"
          >
            <ModernInput
              label="Adresse ou nom du terrain"
              value={formData.location}
              onChangeText={text => updateFormData('location', text)}
              placeholder="Ex: Stade Municipal, 123 Rue..."
              error={errors.location}
              icon="map-pin"
              maxLength={200}
            />
          </SectionCard>

          {/* Section Notes */}
          <SectionCard
            title="Notes"
            description="Informations complémentaires"
            icon="file-text"
            iconBg="#8B5CF6"
          >
            <ModernInput
              label="Description (optionnel)"
              value={formData.description}
              onChangeText={text => updateFormData('description', text)}
              placeholder="Précisions sur le match, équipement nécessaire..."
              icon="align-left"
              multiline
              maxLength={500}
            />
          </SectionCard>
        </ScrollView>

        {/* Footer avec bouton */}
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
                  <Icon name="check" size={22} color="#FFF" />
                  <Text style={styles.submitText}>Créer le match</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <TeamSelectorModal
        visible={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        teams={myTeams}
        selectedTeam={formData.team1}
        onSelect={team => updateFormData('team1', team)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={formData.scheduledDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={formData.scheduledDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

// Styles (similaires à CreateTeamScreen)
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
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
    paddingHorizontal: DIMENSIONS.SPACING_MD,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F3F4F6',
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: DIMENSIONS.SPACING_SM,
  },
  input: {
    flex: 1,
    paddingVertical: DIMENSIONS.SPACING_MD,
    fontSize: FONTS.SIZE.MD,
    color: '#1F2937',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  teamOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  teamOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22C55E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamOptionInfo: {
    flex: 1,
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  teamOptionMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
});
