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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
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
      if (res.success) setMatch(res.data);
    } catch (e) {
      Alert.alert('Erreur', 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    const res = await matchesApi.updateMatchScore(
      matchId,
      parseInt(scores.home),
      parseInt(scores.away),
    );
    if (res.success) {
      setScoreModal(false);
      loadMatch();
    } else Alert.alert('Erreur', res.error);
  };

  if (loading || !match)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.ACCENT} />
      </View>
    );

  const isOwner = match.is_organizer;

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
                  : 'PREVU'}
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
              {match.awayTeam.logoUrl ? (
                <Image
                  source={{
                    uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${match.awayTeam.logoUrl}`,
                  }}
                  style={styles.logoImage}
                />
              ) : (
                <Text style={[styles.logoText, { color: '#3B82F6' }]}>
                  {match.awayTeam.name[0]}
                </Text>
              )}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {match.awayTeam.name}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ACTIONS */}
        {isOwner && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setScoreModal(true)}
            >
              <Icon name="edit-2" size={20} color={THEME.ACCENT} />
              <Text style={styles.actionText}>Score</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Icon name="share-2" size={20} color={THEME.TEXT} />
              <Text style={[styles.actionText, { color: THEME.TEXT }]}>
                Partager
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails du match</Text>
          <StatRow
            icon="calendar"
            label="Date"
            value={new Date(match.matchDate).toLocaleDateString()}
          />
          <StatRow
            icon="clock"
            label="Heure"
            value={new Date(match.matchDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          <StatRow
            icon="map-pin"
            label="Lieu"
            value={match.location?.name || 'Non défini'}
          />
          <StatRow
            icon="user"
            label="Arbitre"
            value={match.refereeContact || 'Non assigné'}
          />
        </View>

        {/* DESCRIPTION */}
        {match.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{match.notes}</Text>
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
