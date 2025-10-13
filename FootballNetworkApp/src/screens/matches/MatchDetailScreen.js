// ====== src/screens/matches/MatchDetailScreen.js - NOUVEAU DESIGN + BACKEND ======
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { matchesApi } from '../../services/api';

const { width } = Dimensions.get('window');

// Helpers
const formatDate = dateString => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getMatchStatus = match => {
  if (match.status === 'completed') {
    return { label: 'Terminé', color: '#6B7280', icon: 'check-circle' };
  } else if (match.status === 'cancelled') {
    return { label: 'Annulé', color: '#EF4444', icon: 'x-circle' };
  } else if (match.status === 'in_progress') {
    return { label: 'En cours', color: '#22C55E', icon: 'play-circle' };
  } else {
    return { label: 'À venir', color: '#3B82F6', icon: 'calendar' };
  }
};

// Modal de score
const ScoreModal = ({ visible, onClose, onSubmit, match }) => {
  const [team1Score, setTeam1Score] = useState(
    match?.team1_score?.toString() || '0',
  );
  const [team2Score, setTeam2Score] = useState(
    match?.team2_score?.toString() || '0',
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      Alert.alert('Erreur', 'Scores invalides');
      return;
    }

    setSubmitting(true);
    await onSubmit(score1, score2);
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.scoreModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Entrer le score</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreInputContainer}>
            <View style={styles.scoreTeamSection}>
              <Text style={styles.scoreTeamName}>{match?.team1_name}</Text>
              <TextInput
                style={styles.scoreInput}
                value={team1Score}
                onChangeText={setTeam1Score}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <Text style={styles.scoreVS}>-</Text>

            <View style={styles.scoreTeamSection}>
              <Text style={styles.scoreTeamName}>{match?.team2_name}</Text>
              <TextInput
                style={styles.scoreInput}
                value={team2Score}
                onChangeText={setTeam2Score}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.scoreSubmitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreSubmitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="check" size={20} color="#FFF" />
                  <Text style={styles.scoreSubmitText}>Valider le score</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const MatchDetailScreen = ({ route, navigation }) => {
  const { matchId } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMatchDetails();
    }, [matchId]),
  );

  const loadMatchDetails = async () => {
    try {
      setLoading(true);
      const result = await matchesApi.getMatchById(matchId);
      console.log('result', result);

      if (result.success) {
        setMatch(result.data);
      } else {
        Alert.alert('Erreur', result.error);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load match error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatchDetails();
    setRefreshing(false);
  }, [matchId]);

  const handleUpdateScore = async (score1, score2) => {
    try {
      const result = await matchesApi.updateMatchScore(matchId, score1, score2);

      if (result.success) {
        Alert.alert('Succès', 'Score mis à jour');
        setScoreModalVisible(false);
        loadMatchDetails();
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleCancelMatch = () => {
    Alert.alert(
      'Annuler le match',
      'Êtes-vous sûr de vouloir annuler ce match ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await matchesApi.cancelMatch(matchId);
              if (result.success) {
                Alert.alert('Match annulé', '', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!match) return null;

  const status = getMatchStatus(match);
  const isOrganizer = match.is_organizer;
  const canEditScore =
    isOrganizer && match.status !== 'cancelled' && match.status !== 'completed';

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
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          {isOrganizer && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Alert.alert(
                  'Options',
                  'Choisissez une action',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    canEditScore && {
                      text: 'Entrer le score',
                      onPress: () => setScoreModalVisible(true),
                    },
                    match.status === 'scheduled' && {
                      text: 'Annuler le match',
                      style: 'destructive',
                      onPress: handleCancelMatch,
                    },
                  ].filter(Boolean),
                );
              }}
            >
              <Icon name="more-vertical" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerContent}>
          <View
            style={[
              styles.statusBadgeLarge,
              { backgroundColor: status.color + '40' },
            ]}
          >
            <Icon name={status.icon} size={16} color="#FFF" />
            <Text style={styles.statusTextLarge}>{status.label}</Text>
          </View>
          <Text style={styles.matchDateLarge}>
            {formatDate(match.matchDate)}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#22C55E']}
            tintColor="#22C55E"
          />
        }
      >
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F9FAFB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.scoreCardGradient}
          >
            <View style={styles.teamsRow}>
              {/* Team 1 */}
              <View style={styles.teamColumn}>
                <View style={styles.teamIconLarge}>
                  <LinearGradient
                    colors={['#22C55E', '#16A34A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.teamIconGradient}
                  >
                    <Icon name="shield" size={32} color="#FFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.teamNameLarge}>{match.homeTeam.name}</Text>
                {match.score.home !== null && (
                  <Text style={styles.scoreLarge}>{match.score.home}</Text>
                )}
              </View>

              {/* VS */}
              <View style={styles.vsContainerLarge}>
                <Text style={styles.vsTextLarge}>VS</Text>
              </View>

              {/* Team 2 */}
              <View style={styles.teamColumn}>
                <View style={styles.teamIconLarge}>
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.teamIconGradient}
                  >
                    <Icon name="shield" size={32} color="#FFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.teamNameLarge}>{match.awayTeam.name}</Text>
                {match.score.away !== null && (
                  <Text style={styles.scoreLarge}>{match.score.away}</Text>
                )}
              </View>
            </View>

            {canEditScore && (
              <TouchableOpacity
                style={styles.editScoreButton}
                onPress={() => setScoreModalVisible(true)}
              >
                <Icon name="edit-2" size={16} color="#22C55E" />
                <Text style={styles.editScoreText}>
                  {match.team1_score !== null
                    ? 'Modifier le score'
                    : 'Entrer le score'}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* Informations */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Informations</Text>

          <View style={styles.infoRow}>
            <Icon name="map-pin" size={18} color="#6B7280" />
            <Text style={styles.infoLabel}>Lieu</Text>
            <Text style={styles.infoValue}>{match.location?.name || '-'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="calendar" size={18} color="#6B7280" />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(match.matchDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="clock" size={18} color="#6B7280" />
            <Text style={styles.infoLabel}>Heure</Text>
            <Text style={styles.infoValue}>
              {new Date(match.matchDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {match.type && (
            <View style={styles.descriptionSection}>
              <Icon name="file-text" size={18} color="#6B7280" />
              <View style={styles.descriptionContent}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.descriptionText}>{match.type}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Score Modal */}
      <ScoreModal
        visible={scoreModalVisible}
        onClose={() => setScoreModalVisible(false)}
        onSubmit={handleUpdateScore}
        match={match}
      />
    </View>
  );
};

// Styles compacts pour MatchDetailScreen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    ...SHADOWS.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: { alignItems: 'center' },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  statusTextLarge: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  matchDateLarge: { fontSize: 16, color: 'rgba(255,255,255,0.95)' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  scoreCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    ...SHADOWS.LARGE,
  },
  scoreCardGradient: { padding: 24 },
  teamsRow: { flexDirection: 'row', alignItems: 'center' },
  teamColumn: { flex: 1, alignItems: 'center' },
  teamIconLarge: { marginBottom: 12 },
  teamIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamNameLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreLarge: { fontSize: 32, fontWeight: '700', color: '#1F2937' },
  vsContainerLarge: { paddingHorizontal: 20 },
  vsTextLarge: { fontSize: 16, fontWeight: '700', color: '#9CA3AF' },
  editScoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    gap: 8,
  },
  editScoreText: { fontSize: 14, fontWeight: '600', color: '#22C55E' },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.MEDIUM,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  infoLabel: { flex: 1, fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  descriptionSection: {
    flexDirection: 'row',
    paddingTop: 12,
    gap: 12,
  },
  descriptionContent: { flex: 1 },
  descriptionText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scoreModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTeamSection: { flex: 1, alignItems: 'center' },
  scoreTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreInput: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  scoreVS: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9CA3AF',
    paddingHorizontal: 20,
  },
  scoreSubmitButton: { borderRadius: 12, overflow: 'hidden' },
  scoreSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  scoreSubmitText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
