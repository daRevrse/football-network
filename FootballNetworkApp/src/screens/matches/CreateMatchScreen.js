// ====== src/screens/matches/CreateMatchScreen.js ======
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
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { matchesApi, teamsApi } from '../../services/api';
import { DIMENSIONS, SHADOWS } from '../../styles/theme';

// Thème Premium Night
const THEME = {
  BG: '#0F172A', // Slate 900
  SURFACE: '#1E293B', // Slate 800
  INPUT_BG: '#334155', // Slate 700
  TEXT: '#F8FAFC', // Slate 50
  TEXT_SEC: '#94A3B8', // Slate 400
  ACCENT: '#22C55E', // Green 500
  BORDER: '#334155', // Slate 700
  PRIMARY: '#3B82F6', // Blue 500
};

// Composant Input Stylisé Dark (Modifié pour supporter les suggestions)
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
        color={THEME.ACCENT}
        style={{ marginRight: 12 }}
      />
      {onPress ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputText, !value && { color: THEME.TEXT_SEC }]}>
            {value || placeholder}
          </Text>
        </View>
      ) : (
        <TextInput
          style={[styles.inputText, multiline && { paddingTop: 0 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={THEME.TEXT_SEC}
          multiline={multiline}
          editable={!readonly}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={onFocus}
        />
      )}
      {renderRight && renderRight()}
      {onPress && !renderRight && (
        <Icon name="chevron-down" size={20} color={THEME.TEXT_SEC} />
      )}
    </TouchableOpacity>
  </View>
);

// Modal de sélection d'équipe (Pour VOTRE équipe)
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
            <Icon name="x" size={24} color={THEME.TEXT} />
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
                    isSelected && { backgroundColor: THEME.ACCENT },
                  ]}
                >
                  <Icon
                    name="shield"
                    size={20}
                    color={isSelected ? '#FFF' : THEME.ACCENT}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.teamOptionName,
                      isSelected && { color: THEME.ACCENT },
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
                  <Icon name="check" size={20} color={THEME.ACCENT} />
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

  // États du formulaire
  const [form, setForm] = useState({
    team1: null,
    opponent: '',
    opponentTeam: null, // Équipe sélectionnée depuis les suggestions
    location: '',
    notes: '',
  });
  const [date, setDate] = useState(new Date());

  // États pour la recherche d'adversaire
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingOpponent, setSearchingOpponent] = useState(false);
  const searchTimeout = useRef(null);

  // États UI
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [myTeams, setMyTeams] = useState([]);

  // Animation Header
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

  // Vérification des permissions
  useEffect(() => {
    if (userType === 'player') {
      Alert.alert(
        'Accès refusé',
        'Seuls les managers peuvent créer des matchs. Rejoignez une équipe en tant que capitaine ou créez votre propre équipe pour organiser des matchs.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    }
  }, [userType, navigation]);

  // Chargement des équipes du capitaine
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

          // Vérifier s'il n'y a aucune équipe à gérer
          if (captainTeams.length === 0 && userType === 'manager') {
            Alert.alert(
              'Aucune équipe',
              'Vous devez d\'abord créer une équipe pour organiser un match.',
              [
                {
                  text: 'Créer une équipe',
                  onPress: () => navigation.navigate('Teams', { screen: 'CreateTeam' }),
                },
                {
                  text: 'Retour',
                  onPress: () => navigation.goBack(),
                  style: 'cancel',
                },
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

    // Ne charger les équipes que si l'utilisateur n'est pas un simple player
    if (userType !== 'player') {
      loadTeams();
    }
  }, [userType, navigation]);

  // Gestion de la recherche d'adversaire
  const handleOpponentChange = text => {
    setForm(prev => ({
      ...prev,
      opponent: text,
      // Réinitialiser l'équipe sélectionnée si on modifie le texte
      opponentTeam: null,
    }));

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length > 2) {
      setSearchingOpponent(true);
      setShowSuggestions(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await teamsApi.searchTeams({ search: text, limit: 5 });
          if (res.success) {
            // Filtrer pour ne pas proposer sa propre équipe
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
    setForm(prev => ({
      ...prev,
      opponent: team.name,
      opponentTeam: team, // Stocker l'équipe complète
    }));
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleCreate = async () => {
    if (!form.team1)
      return Alert.alert('Erreur', 'Veuillez sélectionner votre équipe');

    if (!form.opponentTeam) {
      return Alert.alert(
        'Erreur',
        'Veuillez sélectionner une équipe adverse dans les suggestions',
      );
    }

    if (!form.location)
      return Alert.alert('Erreur', 'Veuillez indiquer le lieu du match');

    setLoading(true);
    try {
      // Créer une invitation de match
      const res = await matchesApi.createMatchInvitation({
        senderTeamId: form.team1.id,
        receiverTeamId: form.opponentTeam.id,
        proposedDate: date.toISOString(),
        proposedLocationId: null, // Vous pouvez implémenter la sélection de lieu plus tard
        message: form.notes || `Match proposé au ${form.location}`,
      });

      if (res.success) {
        Alert.alert(
          'Invitation envoyée !',
          `L'équipe ${form.opponentTeam.name} a reçu votre invitation de match.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert('Erreur', res.error || 'Impossible d\'envoyer l\'invitation');
      }
    } catch (e) {
      console.error('Erreur création match:', e);
      Alert.alert('Erreur', 'Problème technique lors de la création');
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
        <ActivityIndicator size="large" color={THEME.ACCENT} />
      </View>
    );
  }

  if (myTeams.length === 0) {
    return (
      <View style={[styles.container, styles.center, { padding: 40 }]}>
        <Icon name="shield-off" size={64} color={THEME.TEXT_SEC} />
        <Text style={styles.emptyTitle}>Aucune équipe trouvée</Text>
        <Text style={styles.emptyText}>
          Vous devez être manager d'une équipe pour organiser un match.
        </Text>
        <TouchableOpacity
          style={styles.createTeamBtn}
          onPress={() => navigation.navigate('Teams', { screen: 'CreateTeam' })}
        >
          <Text style={styles.createTeamText}>Créer une équipe</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[THEME.ACCENT, '#166534']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Icon name="x" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitleSmall}>Nouveau Match</Text>
          <View style={{ width: 24 }} />
        </View>

        <Animated.View
          style={[styles.headerContent, { opacity: headerOpacity }]}
        >
          <View style={styles.iconCircle}>
            <Icon name="calendar" size={32} color={THEME.ACCENT} />
          </View>
          <Text style={styles.headerTitleBig}>Organiser un match</Text>
          <Text style={styles.headerSubtitle}>Défiez une autre équipe</Text>
        </Animated.View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sélection de l'équipe Domicile */}
          <ModernInput
            label="Votre Équipe (Domicile)"
            value={form.team1?.name}
            icon="shield"
            placeholder="Sélectionner..."
            onPress={() => setShowTeamModal(true)}
          />

          {/* Adversaire avec Suggestions */}
          <View style={{ zIndex: 10 }}>
            <ModernInput
              label="Adversaire (Extérieur)"
              value={form.opponent}
              onChangeText={handleOpponentChange}
              placeholder="Rechercher une équipe adverse"
              icon="users"
              renderRight={() =>
                searchingOpponent ? (
                  <ActivityIndicator size="small" color={THEME.ACCENT} />
                ) : form.opponentTeam ? (
                  <Icon name="check-circle" size={20} color={THEME.ACCENT} />
                ) : null
              }
              onFocus={() => {
                if (form.opponent.length > 2 && suggestions.length > 0)
                  setShowSuggestions(true);
              }}
            />

            {/* Équipe sélectionnée */}
            {form.opponentTeam && !showSuggestions && (
              <View style={styles.selectedTeamBadge}>
                <Icon name="check-circle" size={16} color={THEME.ACCENT} />
                <Text style={styles.selectedTeamText}>
                  {form.opponentTeam.name} sélectionnée
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setForm(prev => ({ ...prev, opponent: '', opponentTeam: null }));
                    setSuggestions([]);
                  }}
                  style={styles.clearSelection}
                >
                  <Icon name="x" size={16} color={THEME.TEXT_SEC} />
                </TouchableOpacity>
              </View>
            )}

            {/* Liste des suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map(team => (
                  <TouchableOpacity
                    key={team.id}
                    style={styles.suggestionItem}
                    onPress={() => selectOpponent(team)}
                  >
                    <View style={styles.suggestionIcon}>
                      <Icon name="shield" size={14} color={THEME.TEXT_SEC} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionName}>{team.name}</Text>
                      <Text style={styles.suggestionDetails}>
                        {team.locationCity || team.location_city || 'Ville inconnue'} •{' '}
                        {team.currentPlayers || team.member_count || 0} membres
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={THEME.TEXT_SEC} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date et Heure */}
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
                value={date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                onPress={() => setShowTimePicker(true)}
                icon="clock"
              />
            </View>
          </View>

          {/* Lieu */}
          <ModernInput
            label="Lieu du match"
            value={form.location}
            onChangeText={t => setForm({ ...form, location: t })}
            placeholder="Stade, Adresse, Ville..."
            icon="map-pin"
          />

          {/* Notes */}
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

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>CONFIRMER LE MATCH</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals Date/Time */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      {/* Modal Sélection Équipe */}
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
  container: { flex: 1, backgroundColor: THEME.BG },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Header Animated
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  headerContent: { alignItems: 'center', marginTop: 10 },
  headerTitleSmall: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  headerTitleBig: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  content: { padding: 24, paddingTop: 30 },
  row: { flexDirection: 'row' },

  // Inputs
  inputGroup: { marginBottom: 20 },
  label: {
    color: THEME.TEXT_SEC,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  inputText: { flex: 1, color: THEME.TEXT, fontSize: 16, padding: 0 },

  // Suggestions Dropdown
  suggestionsContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionName: { color: THEME.TEXT, fontSize: 14, fontWeight: 'bold' },
  suggestionDetails: { color: THEME.TEXT_SEC, fontSize: 12 },

  // Selected Team Badge
  selectedTeamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: THEME.ACCENT,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  selectedTeamText: {
    flex: 1,
    color: THEME.ACCENT,
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
    borderTopColor: THEME.BORDER,
    backgroundColor: THEME.BG,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  submitBtn: {
    backgroundColor: THEME.ACCENT,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  // Empty State
  emptyTitle: {
    color: THEME.TEXT,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    color: THEME.TEXT_SEC,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createTeamBtn: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createTeamText: { color: '#FFF', fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: THEME.TEXT, fontSize: 18, fontWeight: 'bold' },
  modalList: { width: '100%' },

  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  teamOptionSelected: {
    borderColor: THEME.ACCENT,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamOptionName: { color: THEME.TEXT, fontSize: 16, fontWeight: 'bold' },
  teamOptionMeta: { color: THEME.TEXT_SEC, fontSize: 12 },
});
