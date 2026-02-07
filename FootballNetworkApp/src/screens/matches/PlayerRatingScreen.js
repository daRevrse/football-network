// ====== src/screens/matches/PlayerRatingScreen.js ======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { matchesApi } from '../../services/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
};

const RatingButton = ({ value, selected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.ratingBtn,
      selected && styles.ratingBtnSelected,
      value <= 3 && selected && styles.ratingBtnLow,
      value >= 8 && selected && styles.ratingBtnHigh,
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.ratingBtnText,
      selected && styles.ratingBtnTextSelected,
    ]}>
      {value}
    </Text>
  </TouchableOpacity>
);

export const PlayerRatingScreen = ({ route, navigation }) => {
  const { matchId, teamId, teamName, players: initialPlayers } = route.params;
  const [players, setPlayers] = useState([]);
  const [ratings, setRatings] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les notations existantes si disponibles
      const res = await matchesApi.getPlayerRatings(matchId);
      if (res.success && res.data.ratings) {
        const existingRatings = {};
        res.data.ratings.forEach(r => {
          if (r.team.id === teamId) {
            existingRatings[r.player.id] = r.rating;
          }
        });
        setRatings(existingRatings);
      }

      // Utiliser les joueurs passés en paramètre ou charger depuis l'API
      if (initialPlayers && initialPlayers.length > 0) {
        setPlayers(initialPlayers);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPlayerRating = (playerId, rating) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: prev[playerId] === rating ? null : rating,
    }));
  };

  const handleSubmit = async () => {
    const ratingsArray = Object.entries(ratings)
      .filter(([_, rating]) => rating !== null)
      .map(([playerId, rating]) => ({
        playerId: parseInt(playerId),
        rating,
      }));

    if (ratingsArray.length === 0) {
      Alert.alert('Attention', 'Notez au moins un joueur avant de valider');
      return;
    }

    setSaving(true);
    try {
      const res = await matchesApi.ratePlayers(matchId, ratingsArray);
      if (res.success) {
        Alert.alert(
          'Succès',
          `${ratingsArray.length} joueurs notés avec succès`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Erreur', res.error || 'Impossible de sauvegarder les notations');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const getRatingLabel = (rating) => {
    if (!rating) return '';
    if (rating <= 3) return 'Faible';
    if (rating <= 5) return 'Moyen';
    if (rating <= 7) return 'Bon';
    if (rating <= 9) return 'Très bon';
    return 'Exceptionnel';
  };

  const renderPlayer = ({ item }) => {
    const playerRating = ratings[item.id];

    return (
      <View style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <View style={styles.jerseyBadge}>
            <Text style={styles.jerseyText}>{item.jerseyNumber || '--'}</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.position}>{item.position || 'Joueur'}</Text>
          </View>
          {playerRating && (
            <View style={styles.currentRating}>
              <Text style={styles.currentRatingText}>{playerRating}</Text>
              <Text style={styles.ratingLabel}>{getRatingLabel(playerRating)}</Text>
            </View>
          )}
        </View>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
            <RatingButton
              key={value}
              value={value}
              selected={playerRating === value}
              onPress={() => setPlayerRating(item.id, value)}
            />
          ))}
        </View>
      </View>
    );
  };

  const ratedCount = Object.values(ratings).filter(r => r !== null).length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={THEME.ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Noter les joueurs</Text>
          <Text style={styles.subtitle}>{teamName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {ratedCount} / {players.length} joueurs notés
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(ratedCount / players.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={players}
        keyExtractor={item => String(item.id)}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={THEME.TEXT_SEC} />
            <Text style={styles.emptyText}>Aucun joueur à noter</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Icon name="check" size={20} color="#000" />
              <Text style={styles.submitBtnText}>Valider les notations</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
  },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: THEME.TEXT },
  subtitle: { fontSize: 12, color: THEME.TEXT_SEC, marginTop: 2 },
  progressBar: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: { color: THEME.TEXT_SEC, fontSize: 14 },
  progressTrack: {
    height: 6,
    backgroundColor: THEME.BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.ACCENT,
    borderRadius: 3,
  },
  list: { paddingHorizontal: 24, paddingBottom: 100 },
  playerCard: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jerseyBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jerseyText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  playerInfo: { flex: 1, marginLeft: 12 },
  playerName: { fontSize: 16, fontWeight: '600', color: THEME.TEXT },
  position: { fontSize: 12, color: THEME.TEXT_SEC, marginTop: 2 },
  currentRating: { alignItems: 'center' },
  currentRatingText: { fontSize: 24, fontWeight: 'bold', color: THEME.ACCENT },
  ratingLabel: { fontSize: 10, color: THEME.TEXT_SEC, marginTop: 2 },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingBtn: {
    width: 28,
    height: 36,
    borderRadius: 6,
    backgroundColor: THEME.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBtnSelected: { backgroundColor: THEME.ACCENT },
  ratingBtnLow: { backgroundColor: THEME.ERROR },
  ratingBtnHigh: { backgroundColor: THEME.ACCENT },
  ratingBtnText: { fontSize: 14, fontWeight: '600', color: THEME.TEXT_SEC },
  ratingBtnTextSelected: { color: '#000' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: THEME.BG,
    borderTopWidth: 1,
    borderTopColor: THEME.BORDER,
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.ACCENT,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: THEME.TEXT_SEC, marginTop: 16, fontSize: 16 },
});

export default PlayerRatingScreen;
