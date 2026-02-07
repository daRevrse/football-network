/**
 * CreateMatchScreen - Créer un match
 * Design Foot Connect Premium
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Keyboard,
  StatusBar,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { matchesApi, teamsApi } from '../../services/api';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

// Composant Input Stylisé
const ModernInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline,
  readonly,
  onPress,
  onFocus,
  renderRight,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity
      style={[
        styles.inputContainer,
        multiline && { height: 100, alignItems: 'flex-start' },
        readonly && { opacity: 0.9 },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Icon
        name={icon}
        size={20}
        color={COLORS.PRIMARY}
        style={{ marginRight: 12 }}
      />
      {onPress ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputText, !value && { color: `${COLORS.WHITE}50` }]}>
            {value || placeholder}
          </Text>
        </View>
      ) : (
        <TextInput
          style={[styles.inputText, multiline && { paddingTop: 0 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={`${COLORS.WHITE}50`}
          multiline={multiline}
          editable={!readonly}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={onFocus}
        />
      )}
      {renderRight && renderRight()}
      {onPress && !renderRight && (
        <Icon name="chevron-down" size={20} color={COLORS.WHITE} />
      )}
    </TouchableOpacity>
  </View>
);

// Modal de sélection d'équipe
const TeamSelectorModal = ({
  visible,
  onClose,
  teams,
  onSelect,
  selectedTeamId,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Choisir votre équipe</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="x" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalList}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {teams.map(team => {
            const isSelected = selectedTeamId === team.id;
            return (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.teamOption,
                  isSelected && styles.teamOptionSelected,
                ]}
                onPress={() => {
                  onSelect(team);
                  onClose();
                }}
              >
                <View
                  style={[
                    styles.teamIcon,
                    isSelected && { backgroundColor: COLORS.PRIMARY },
                  ]}
                >
                  <Icon
                    name="shield"
                    size={20}
                    color={isSelected ? COLORS.WHITE : COLORS.PRIMARY}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.teamOptionName,
                      isSelected && { color: COLORS.PRIMARY },
                    ]}
                  >
                    {team.name}
                  </Text>
                  <Text style={styles.teamOptionMeta}>
                    {team.member_count || 0} membres •{' '}
                    {team.location_city || 'Ville non définie'}
                  </Text>
                </View>
                {isSelected && (
                  <Icon name="check" size={20} color={COLORS.PRIMARY} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export const CreateMatchScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const userType = user?.userType;

  const [form, setForm] = useState({
    team1: null,
    opponent: '',
    opponentTeam: null,
    location: '',
    notes: '',
  });
  const [date, setDate] = useState(new Date());

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingOpponent, setSearchingOpponent] = useState(false);
  const searchTimeout = useRef(null);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [myTeams, setMyTeams] = useState([]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 100],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (userType === 'player') {
      Alert.alert(
        'Accès refusé',
        'Seuls les managers peuvent créer des matchs.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { cancelable: false }
      );
    }
  }, [userType, navigation]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const res = await teamsApi.getMyTeams();
        if (res.success) {
          const captainTeams = res.data.filter(
            t => t.role === 'owner' || t.role === 'captain',
          );
          setMyTeams(captainTeams);

          if (captainTeams.length === 0 && userType === 'manager') {
            Alert.alert(
              'Aucune équipe',
              'Vous devez d\'abord créer une équipe pour organiser un match.',
              [
                { text: 'Créer une équipe', onPress: () => navigation.navigate('Teams', { screen: 'CreateTeam' }) },
                { text: 'Retour', onPress: () => navigation.goBack(), style: 'cancel' },
              ]
            );
          } else if (captainTeams.length > 0) {
            setForm(f => ({ ...f, team1: captainTeams[0] }));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTeams(false);
      }
    };

    if (userType !== 'player') loadTeams();
  }, [userType, navigation]);

  const handleOpponentChange = text => {
    setForm(prev => ({ ...prev, opponent: text, opponentTeam: null }));

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length > 2) {
      setSearchingOpponent(true);
      setShowSuggestions(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await teamsApi.searchTeams({ search: text, limit: 5 });
          if (res.success) {
            const filtered = res.data.filter(t => t.id !== form.team1?.id);
            setSuggestions(filtered);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setSearchingOpponent(false);
        }
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchingOpponent(false);
    }
  };

  const selectOpponent = team => {
    setForm(prev => ({ ...prev, opponent: team.name, opponentTeam: team }));
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleCreate = async () => {
    if (!form.team1) return Alert.alert('Erreur', 'Veuillez sélectionner votre équipe');
    if (!form.opponentTeam) return Alert.alert('Erreur', 'Veuillez sélectionner une équipe adverse');
    if (!form.location) return Alert.alert('Erreur', 'Veuillez indiquer le lieu du match');

    setLoading(true);
    try {
      const res = await matchesApi.createMatchInvitation({
        senderTeamId: form.team1.id,
        receiverTeamId: form.opponentTeam.id,
        proposedDate: date.toISOString(),
        proposedLocationId: null,
        message: form.notes || `Match proposé au ${form.location}`,
      });

      if (res.success) {
        Alert.alert(
          'Invitation envoyée !',
          `L'équipe ${form.opponentTeam.name} a reçu votre invitation.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Erreur', res.error || 'Impossible d\'envoyer l\'invitation');
      }
    } catch (e) {
      console.error('Erreur création match:', e);
      Alert.alert('Erreur', 'Problème technique');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setDate(newDate);
    }
  };

  if (loadingTeams) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (myTeams.length === 0) {
    return (
      <View style={[styles.container, styles.center, { padding: 40 }]}>
        <View style={styles.emptyIconBox}>
          <Icon name="shield-off" size={48} color={COLORS.PRIMARY} />
        </View>
        <Text style={styles.emptyTitle}>Aucune équipe trouvée</Text>
        <Text style={styles.emptyText}>
          Vous devez être manager d'une équipe pour organiser un match.
        </Text>
        <TouchableOpacity
          style={styles.createTeamBtn}
          onPress={() => navigation.navigate('Teams', { screen: 'CreateTeam' })}
        >
          <LinearGradient colors={GRADIENTS.button} style={styles.createTeamGradient}>
            <Text style={styles.createTeamText}>Créer une équipe</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK} />

      {/* Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK, COLORS.DARK]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="x" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitleSmall}>Nouveau Match</Text>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <View style={styles.iconCircle}>
            <Icon name="calendar" size={32} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.headerTitleBig}>Organiser un match</Text>
          <Text style={styles.headerSubtitle}>Défiez une autre équipe</Text>
        </Animated.View>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <ModernInput
            label="Votre Équipe (Domicile)"
            value={form.team1?.name}
            icon="shield"
            placeholder="Sélectionner..."
            onPress={() => setShowTeamModal(true)}
          />

          <View style={{ zIndex: 10 }}>
            <ModernInput
              label="Adversaire (Extérieur)"
              value={form.opponent}
              onChangeText={handleOpponentChange}
              placeholder="Rechercher une équipe adverse"
              icon="users"
              renderRight={() =>
                searchingOpponent ? (
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                ) : form.opponentTeam ? (
                  <Icon name="check-circle" size={20} color={COLORS.SUCCESS} />
                ) : null
              }
              onFocus={() => {
                if (form.opponent.length > 2 && suggestions.length > 0) setShowSuggestions(true);
              }}
            />

            {form.opponentTeam && !showSuggestions && (
              <View style={styles.selectedTeamBadge}>
                <Icon name="check-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.selectedTeamText}>{form.opponentTeam.name} sélectionnée</Text>
                <TouchableOpacity
                  onPress={() => {
                    setForm(prev => ({ ...prev, opponent: '', opponentTeam: null }));
                    setSuggestions([]);
                  }}
                  style={styles.clearSelection}
                >
                  <Icon name="x" size={16} color={COLORS.WHITE} />
                </TouchableOpacity>
              </View>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map(team => (
                  <TouchableOpacity
                    key={team.id}
                    style={styles.suggestionItem}
                    onPress={() => selectOpponent(team)}
                  >
                    <View style={styles.suggestionIcon}>
                      <Icon name="shield" size={14} color={COLORS.WHITE} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionName}>{team.name}</Text>
                      <Text style={styles.suggestionDetails}>
                        {team.locationCity || team.location_city || 'Ville inconnue'} •{' '}
                        {team.currentPlayers || team.member_count || 0} membres
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={COLORS.WHITE} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <ModernInput
                label="Date"
                value={date.toLocaleDateString()}
                onPress={() => setShowDatePicker(true)}
                icon="calendar"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <ModernInput
                label="Heure"
                value={date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                onPress={() => setShowTimePicker(true)}
                icon="clock"
              />
            </View>
          </View>

          <ModernInput
            label="Lieu du match"
            value={form.location}
            onChangeText={t => setForm({ ...form, location: t })}
            placeholder="Stade, Adresse, Ville..."
            icon="map-pin"
          />

          <ModernInput
            label="Notes / Informations"
            value={form.notes}
            onChangeText={t => setForm({ ...form, notes: t })}
            placeholder="Type de terrain, format (5v5, 11v11)..."
            icon="align-left"
            multiline
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
            <LinearGradient colors={GRADIENTS.button} style={styles.submitBtnGradient}>
              {loading ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <Text style={styles.btnText}>CONFIRMER LE MATCH</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />
      )}
      {showTimePicker && (
        <DateTimePicker value={date} mode="time" display="default" onChange={onTimeChange} />
      )}

      <TeamSelectorModal
        visible={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        teams={myTeams}
        selectedTeamId={form.team1?.id}
        onSelect={team => setForm(p => ({ ...p, team1: team }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    ...SHADOWS.medium,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitleSmall: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitleBig: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerSubtitle: {
    color: COLORS.WHITE,
    fontSize: 14,
    opacity: 0.7,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },

  content: {
    padding: 24,
    paddingTop: 30,
  },
  row: {
    flexDirection: 'row',
  },

  // Inputs
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  inputText: {
    flex: 1,
    color: COLORS.WHITE,
    fontSize: 16,
    padding: 0,
  },

  // Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    zIndex: 1000,
    elevation: 10,
    ...SHADOWS.medium,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionName: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionDetails: {
    color: COLORS.WHITE,
    fontSize: 12,
    opacity: 0.6,
  },

  // Selected Team
  selectedTeamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.SUCCESS}15`,
    borderWidth: 1,
    borderColor: COLORS.SUCCESS,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  selectedTeamText: {
    flex: 1,
    color: COLORS.SUCCESS,
    fontSize: 13,
    fontWeight: '600',
  },
  clearSelection: {
    padding: 4,
  },

  // Footer
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.DARK,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  submitBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  submitBtnGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Empty State
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  emptyTitle: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    color: COLORS.WHITE,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    opacity: 0.7,
  },
  createTeamBtn: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  createTeamGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createTeamText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.DARK,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 8,
  },
  modalList: {
    width: '100%',
  },

  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  teamOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: `${COLORS.PRIMARY}15`,
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamOptionName: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamOptionMeta: {
    color: COLORS.WHITE,
    fontSize: 12,
    opacity: 0.6,
  },
});
