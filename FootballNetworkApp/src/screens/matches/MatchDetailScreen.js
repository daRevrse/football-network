// ====== src/screens/matches/MatchDetailScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { matchesApi } from '../../services/api';
import { API_CONFIG } from '../../utils/constants/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

const StatRow = ({ label, value, icon }) => (
  <View style={styles.statRow}>
    <View style={styles.statLabelRow}>
      <Icon name={icon} size={16} color={THEME.TEXT_SEC} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export const MatchDetailScreen = ({ route, navigation }) => {
  const { matchId } = route.params;
  const { user } = useSelector(state => state.auth);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoreModal, setScoreModal] = useState(false);
  const [scores, setScores] = useState({ home: '', away: '' });

  useFocusEffect(
    useCallback(() => {
      loadMatch();
    }, [matchId]),
  );

  const loadMatch = async () => {
    try {
      setLoading(true);
      const res = await matchesApi.getMatchById(matchId);
      if (res.success) {
        setMatch(res.data);
        // Initialiser les scores s'ils existent
        if (res.data.score) {
          setScores({
            home: res.data.score.home?.toString() || '',
            away: res.data.score.away?.toString() || '',
          });
        }
      }
    } catch (e) {
      console.error('Load match error:', e);
      Alert.alert('Erreur', 'Impossible de charger le match');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    if (!scores.home || !scores.away) {
      Alert.alert('Erreur', 'Veuillez saisir les deux scores');
      return;
    }

    const res = await matchesApi.updateMatchScore(
      matchId,
      parseInt(scores.home),
      parseInt(scores.away),
    );
    if (res.success) {
      setScoreModal(false);
      Alert.alert('Succès', 'Score mis à jour');
      loadMatch();
    } else {
      Alert.alert('Erreur', res.error || 'Impossible de mettre à jour le score');
    }
  };

  const handleShare = async () => {
    try {
      const message = `Match: ${match.homeTeam.name} vs ${match.awayTeam?.name || 'À confirmer'}\n` +
        `Date: ${new Date(match.matchDate).toLocaleDateString('fr-FR')}\n` +
        `Lieu: ${match.location?.name || 'Non défini'}`;

      await Share.share({
        message,
        title: 'Partager le match',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (loading || !match)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.ACCENT} size="large" />
      </View>
    );

  // Déterminer les permissions
  const userType = user?.userType;
  const isOrganizer = match.organizer_id === user?.id;
  const isHomeManager = match.homeTeam?.manager_id === user?.id;
  const isAwayManager = match.awayTeam?.manager_id === user?.id;
  const isManager = userType === 'manager' && (isHomeManager || isAwayManager || isOrganizer);
  const isReferee = userType === 'referee' && match.referee_id === user?.id;
  const canManage = isManager || isOrganizer;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER SCOREBOARD */}
      <View style={styles.scoreboard}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>

        <Text style={styles.leagueText}>{match.type || 'Match Amical'}</Text>

        <View style={styles.teamsContainer}>
          <View style={styles.teamCol}>
            <View style={styles.logoBox}>
              {match.homeTeam.logoUrl ? (
                <Image
                  source={{
                    uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${match.homeTeam.logoUrl}`,
                  }}
                  style={styles.logoImage}
                />
              ) : (
                <Text style={styles.logoText}>{match.homeTeam.name[0]}</Text>
              )}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {match.homeTeam.name}
            </Text>
          </View>

          <View style={styles.scoreCol}>
            <Text style={styles.scoreBig}>
              {match.score.home ?? '-'} : {match.score.away ?? '-'}
            </Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>
                {match.status === 'in_progress'
                  ? 'EN COURS'
                  : match.status === 'completed'
                  ? 'TERMINE'
                  : match.status === 'confirmed'
                  ? 'CONFIRME'
                  : match.status === 'cancelled'
                  ? 'ANNULE'
                  : 'EN ATTENTE'}
              </Text>
            </View>
          </View>

          <View style={styles.teamCol}>
            <View
              style={[
                styles.logoBox,
                { backgroundColor: '#3B82F620', borderColor: '#3B82F650' },
              ]}
            >
              {match.awayTeam?.logoUrl ? (
                <Image
                  source={{
                    uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${match.awayTeam.logoUrl}`,
                  }}
                  style={styles.logoImage}
                />
              ) : match.awayTeam ? (
                <Text style={[styles.logoText, { color: '#3B82F6' }]}>
                  {match.awayTeam.name[0]}
                </Text>
              ) : (
                <Icon name="help-circle" size={24} color="#94A3B8" />
              )}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {match.awayTeam?.name || 'En attente...'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ALERTE SI MATCH CONFIRMÉ SANS ARBITRE */}
        {match.status === 'confirmed' && !match.referee_id && canManage && (
          <View style={styles.warningBox}>
            <Icon name="alert-triangle" size={16} color="#F59E0B" />
            <Text style={styles.warningText}>
              Attention: Aucun arbitre assigné pour ce match confirmé
            </Text>
          </View>
        )}

        {/* ALERTE SI MATCH EN ATTENTE D'ÉQUIPE ADVERSE */}
        {!match.awayTeam && canManage && (
          <View style={styles.infoBox}>
            <Icon name="info" size={16} color="#3B82F6" />
            <Text style={styles.infoText}>
              Match en attente d'une équipe adverse
            </Text>
          </View>
        )}

        {/* ACTIONS - Accessibles aux managers et organisateurs */}
        <View style={styles.actionsRow}>
          {/* Éditer - Manager uniquement avant le match */}
          {canManage && ['pending', 'confirmed'].includes(match.status) && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                // TODO: Navigation vers l'écran d'édition
                Alert.alert('Info', 'Édition de match à venir');
              }}
            >
              <Icon name="edit" size={20} color="#3B82F6" />
              <Text style={[styles.actionText, { color: '#3B82F6' }]}>Éditer</Text>
            </TouchableOpacity>
          )}

          {/* Mettre à jour le score - Manager ou Arbitre pendant ou après le match */}
          {(canManage || isReferee) &&
            ['in_progress', 'completed'].includes(match.status) && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setScoreModal(true)}
              >
                <Icon name="target" size={20} color={THEME.ACCENT} />
                <Text style={styles.actionText}>Score</Text>
              </TouchableOpacity>
            )}

          {/* Partager - Accessible à tous */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Icon name="share-2" size={20} color={THEME.TEXT} />
            <Text style={[styles.actionText, { color: THEME.TEXT }]}>
              Partager
            </Text>
          </TouchableOpacity>
        </View>

        {/* INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails du match</Text>
          <StatRow
            icon="calendar"
            label="Date"
            value={new Date(match.matchDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
          <StatRow
            icon="clock"
            label="Heure"
            value={new Date(match.matchDate).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          <StatRow
            icon="map-pin"
            label="Lieu"
            value={match.location?.name || 'Non défini'}
          />
          {match.location?.address && (
            <StatRow
              icon="navigation"
              label="Adresse"
              value={match.location.address}
            />
          )}
          <StatRow
            icon="user"
            label="Arbitre"
            value={match.referee?.name || match.refereeContact || 'Non assigné'}
          />
          <StatRow
            icon="users"
            label="Organisateur"
            value={match.organizer?.name || match.homeTeam.name}
          />
        </View>

        {/* DESCRIPTION */}
        {match.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{match.notes}</Text>
          </View>
        )}

        {/* ZONE MANAGER - Actions rapides */}
        {canManage && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isReferee ? 'Zone Arbitre' : 'Zone Manager'}
            </Text>

            {/* Confirmer le match - Uniquement si en attente */}
            {match.status === 'pending' && match.awayTeam && (
              <TouchableOpacity
                style={styles.managerAction}
                onPress={() => {
                  // TODO: Ajouter la logique de confirmation
                  Alert.alert('Info', 'Confirmation de match à venir');
                }}
              >
                <Icon name="check-circle" size={18} color={THEME.ACCENT} />
                <Text style={styles.managerActionText}>Confirmer le match</Text>
              </TouchableOpacity>
            )}

            {/* Voir les confirmations de participation */}
            {['confirmed', 'in_progress'].includes(match.status) && (
              <TouchableOpacity
                style={styles.managerAction}
                onPress={() => {
                  // TODO: Navigation vers les participations
                  Alert.alert('Info', 'Participations à venir');
                }}
              >
                <Icon name="users" size={18} color="#3B82F6" />
                <Text style={styles.managerActionText}>
                  Voir les confirmations de présence
                </Text>
              </TouchableOpacity>
            )}

            {/* Gérer la composition - Uniquement si équipe adverse */}
            {['pending', 'confirmed', 'in_progress'].includes(match.status) &&
              match.awayTeam && (
                <TouchableOpacity
                  style={styles.managerAction}
                  onPress={() => {
                    // TODO: Navigation vers la composition
                    Alert.alert('Info', 'Composition à venir');
                  }}
                >
                  <Icon name="clipboard" size={18} color="#8B5CF6" />
                  <Text style={styles.managerActionText}>
                    Gérer la composition
                  </Text>
                </TouchableOpacity>
              )}

            {/* Assigner arbitre - Si pas d'arbitre et avant le match */}
            {['pending', 'confirmed'].includes(match.status) &&
              !match.referee_id &&
              !isReferee && (
                <TouchableOpacity
                  style={styles.managerAction}
                  onPress={() => {
                    // TODO: Navigation vers assignation arbitre
                    Alert.alert('Info', 'Assignation arbitre à venir');
                  }}
                >
                  <Icon name="user-plus" size={18} color="#F59E0B" />
                  <Text style={styles.managerActionText}>
                    Assigner un arbitre
                  </Text>
                </TouchableOpacity>
              )}

            {/* Annuler le match */}
            {['pending', 'confirmed'].includes(match.status) && (
              <TouchableOpacity
                style={[styles.managerAction, { borderColor: '#EF4444' }]}
                onPress={() => {
                  Alert.alert(
                    'Annuler le match',
                    'Êtes-vous sûr de vouloir annuler ce match ?',
                    [
                      { text: 'Non', style: 'cancel' },
                      {
                        text: 'Oui, annuler',
                        style: 'destructive',
                        onPress: async () => {
                          // TODO: Ajouter la logique d'annulation
                          Alert.alert('Info', 'Annulation à venir');
                        },
                      },
                    ],
                  );
                }}
              >
                <Icon name="x-circle" size={18} color="#EF4444" />
                <Text style={[styles.managerActionText, { color: '#EF4444' }]}>
                  Annuler le match
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ZONE ARBITRE - Spécifique pour les arbitres */}
        {isReferee && match.status === 'completed' && !match.scoreVerified && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Validation du score</Text>
            <TouchableOpacity
              style={[styles.managerAction, { backgroundColor: THEME.ACCENT + '20' }]}
              onPress={() => {
                // TODO: Navigation vers validation du score
                Alert.alert('Info', 'Validation du score à venir');
              }}
            >
              <Icon name="check-square" size={18} color={THEME.ACCENT} />
              <Text style={[styles.managerActionText, { color: THEME.ACCENT }]}>
                Valider le score final
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL SCORE */}
      <Modal visible={scoreModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mettre à jour le score</Text>
            <View style={styles.inputsRow}>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={THEME.TEXT_SEC}
                onChangeText={t => setScores(p => ({ ...p, home: t }))}
              />
              <Text style={styles.dash}>-</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={THEME.TEXT_SEC}
                onChangeText={t => setScores(p => ({ ...p, away: t }))}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setScoreModal(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateScore}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.BG,
  },

  // SCOREBOARD HEADER
  scoreboard: {
    backgroundColor: THEME.SURFACE,
    paddingBottom: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
  },
  leagueText: {
    textAlign: 'center',
    color: THEME.TEXT_SEC,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 20,
  },

  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  teamCol: { alignItems: 'center', width: '30%' },
  scoreCol: { alignItems: 'center', width: '40%' },

  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  logoText: { fontSize: 24, fontWeight: 'bold', color: THEME.ACCENT },
  teamName: {
    color: THEME.TEXT,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  scoreBig: {
    fontSize: 36,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: { color: THEME.ACCENT, fontSize: 10, fontWeight: 'bold' },

  content: { padding: 20 },

  // WARNING BOX
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: '#92400E',
    fontSize: 12,
    fontWeight: '500',
  },

  // INFO BOX
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '500',
  },

  // ACTIONS
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.SURFACE,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    gap: 8,
  },
  actionText: { color: THEME.ACCENT, fontWeight: '600' },

  // MANAGER ACTIONS
  managerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: THEME.BG,
    marginBottom: 8,
    gap: 12,
  },
  managerActionText: {
    color: THEME.TEXT,
    fontSize: 14,
    fontWeight: '500',
  },

  // CARD
  card: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  cardTitle: {
    color: THEME.TEXT,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { color: THEME.TEXT_SEC, fontSize: 14 },
  statValue: { color: THEME.TEXT, fontSize: 14, fontWeight: '600' },
  notesText: { color: THEME.TEXT_SEC, lineHeight: 20 },

  // MODAL
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  modalTitle: {
    color: THEME.TEXT,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  scoreInput: {
    backgroundColor: THEME.BG,
    width: 60,
    height: 60,
    borderRadius: 12,
    color: THEME.TEXT,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  dash: { color: THEME.TEXT_SEC, fontSize: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center' },
  cancelText: { color: THEME.TEXT_SEC },
  saveBtn: {
    flex: 1,
    backgroundColor: THEME.ACCENT,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#000', fontWeight: 'bold' },
});
