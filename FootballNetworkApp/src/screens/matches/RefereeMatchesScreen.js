// ====== src/screens/matches/RefereeMatchesScreen.js ======
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useFocusEffect} from '@react-navigation/native';
import {matchesApi} from '../../services/api/matchesApi';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  WARNING: '#F59E0B',
  INFO: '#3B82F6',
};

// Badge de statut de match
const StatusBadge = ({status}) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'pending':
        return {bg: '#F59E0B20', color: '#F59E0B', label: 'En attente'};
      case 'confirmed':
        return {bg: '#3B82F620', color: '#3B82F6', label: 'Confirmé'};
      case 'in_progress':
        return {bg: '#22C55E20', color: '#22C55E', label: 'En cours'};
      case 'completed':
        return {bg: '#64748B20', color: '#64748B', label: 'Terminé'};
      case 'cancelled':
        return {bg: '#EF444420', color: '#EF4444', label: 'Annulé'};
      default:
        return {bg: '#64748B20', color: '#64748B', label: status};
    }
  };

  const style = getStatusStyle();

  return (
    <View
      style={[
        styles.statusBadge,
        {backgroundColor: style.bg, borderColor: style.color + '40'},
      ]}>
      <Text style={[styles.statusText, {color: style.color}]}>
        {style.label}
      </Text>
    </View>
  );
};

// Carte de match
const MatchCard = ({match, onValidateScore, onViewDetails}) => {
  const formatDate = dateString => {
    if (!dateString) return 'Date non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = dateString => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Badge de consensus/désaccord
  const ValidationBadge = () => {
    if (match.hasConsensus) {
      return (
        <View style={styles.consensusBadge}>
          <Icon name="check-circle" size={12} color="#3B82F6" />
          <Text style={styles.consensusText}>Consensus atteint</Text>
        </View>
      );
    }
    if (match.hasDispute) {
      return (
        <View style={[styles.consensusBadge, {backgroundColor: '#FEE2E2', borderColor: '#FCA5A5'}]}>
          <Icon name="alert-circle" size={12} color="#EF4444" />
          <Text style={[styles.consensusText, {color: '#B91C1C'}]}>Désaccord sur le score</Text>
        </View>
      );
    }
    return null;
  };

  const canValidateScore = match.status === 'completed' && !match.scoreVerified;

  return (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={onViewDetails}
      activeOpacity={0.7}>
      {/* Header avec statut */}
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Icon name="calendar" size={16} color={THEME.TEXT_SEC} />
          <Text style={styles.dateText}>
            {formatDate(match.matchDate)} • {formatTime(match.matchDate)}
          </Text>
        </View>
        <StatusBadge status={match.status} />
      </View>

      {/* Badge de validation */}
      <ValidationBadge />

      {/* Équipes */}
      <View style={styles.teamsContainer}>
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <Icon name="shield" size={20} color={THEME.ACCENT} />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam?.name || 'Équipe A'}
            </Text>
          </View>
          {match.status === 'completed' && (
            <Text style={styles.scoreText}>{match.score?.home ?? 0}</Text>
          )}
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <Icon name="shield" size={20} color={THEME.INFO} />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.awayTeam?.name || 'Équipe B'}
            </Text>
          </View>
          {match.status === 'completed' && (
            <Text style={styles.scoreText}>{match.score?.away ?? 0}</Text>
          )}
        </View>
      </View>

      {/* Lieu */}
      <View style={styles.locationRow}>
        <Icon name="map-pin" size={14} color={THEME.TEXT_SEC} />
        <Text style={styles.locationText} numberOfLines={1}>
          {match.location?.name || 'Lieu non défini'}
        </Text>
      </View>

      {/* Action - Valider le score si match terminé */}
      {canValidateScore && (
        <TouchableOpacity
          style={styles.validateButton}
          onPress={() => onValidateScore(match.id)}>
          <Icon name="check-circle" size={20} color="#FFF" />
          <Text style={styles.validateButtonText}>Valider le score</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export const RefereeMatchesScreen = ({navigation}) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed

  const loadMatches = async () => {
    try {
      setLoading(true);
      const result = await matchesApi.getRefereeMatches();
      if (result.success) {
        setMatches(result.data || []);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de charger les matchs');
      }
    } catch (e) {
      console.error('Load matches error:', e);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleValidateScore = matchId => {
    // Naviguer vers l'écran de validation de score
    navigation.navigate('RefereeValidateScore', {matchId});
  };

  const handleViewDetails = matchId => {
    navigation.navigate('MatchDetail', {matchId});
  };

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, []),
  );

  const now = new Date();

  const filteredMatches = matches.filter(match => {
    if (filter === 'upcoming') {
      return (
        ['pending', 'confirmed'].includes(match.status) &&
        new Date(match.matchDate) > now
      );
    }
    if (filter === 'completed') {
      return match.status === 'completed';
    }
    return true; // all
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={THEME.ACCENT} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Dashboard Arbitre</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="bell" size={22} color={THEME.TEXT} />
          </TouchableOpacity>
        </View>

        {/* Statistiques */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{matches.length}</Text>
            <Text style={styles.statLabel}>Total matchs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, {color: THEME.INFO}]}>
              {
                matches.filter(
                  m =>
                    ['pending', 'confirmed'].includes(m.status) &&
                    new Date(m.matchDate) > new Date(),
                ).length
              }
            </Text>
            <Text style={styles.statLabel}>À venir</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, {color: '#64748B'}]}>
              {matches.filter(m => m.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Terminés</Text>
          </View>
        </View>

        {/* Filtres */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}>
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}>
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === 'upcoming' && styles.filterChipActive,
            ]}
            onPress={() => setFilter('upcoming')}>
            <Text
              style={[
                styles.filterText,
                filter === 'upcoming' && styles.filterTextActive,
              ]}>
              À venir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === 'completed' && styles.filterChipActive,
            ]}
            onPress={() => setFilter('completed')}>
            <Text
              style={[
                styles.filterText,
                filter === 'completed' && styles.filterTextActive,
              ]}>
              Complétés
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTE DES MATCHS */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.ACCENT}
          />
        }>
        {filteredMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Icon name="calendar" size={48} color={THEME.TEXT_SEC} />
            </View>
            <Text style={styles.emptyTitle}>Aucun match</Text>
            <Text style={styles.emptyMessage}>
              {filter === 'all'
                ? 'Vous n\'avez aucun match assigné pour le moment'
                : filter === 'upcoming'
                ? 'Aucun match à venir'
                : 'Aucun match complété'}
            </Text>
          </View>
        ) : (
          filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onValidateScore={handleValidateScore}
              onViewDetails={() => handleViewDetails(match.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: THEME.BG},
  center: {justifyContent: 'center', alignItems: 'center'},

  // HEADER
  header: {
    backgroundColor: THEME.SURFACE,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // STATS
  statsRow: {
    flexDirection: 'row',
    backgroundColor: THEME.BG,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  statBox: {flex: 1, alignItems: 'center'},
  statValue: {fontSize: 24, fontWeight: 'bold', color: THEME.ACCENT},
  statLabel: {fontSize: 12, color: THEME.TEXT_SEC, marginTop: 4},
  statDivider: {width: 1, backgroundColor: THEME.BORDER},

  // FILTRES
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.BG,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  filterChipActive: {
    backgroundColor: THEME.ACCENT,
    borderColor: THEME.ACCENT,
  },
  filterText: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },

  // CONTENT
  content: {flex: 1},
  contentContainer: {padding: 20, paddingBottom: 40},

  // MATCH CARD
  matchCard: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: THEME.TEXT_SEC,
  },

  // STATUS BADGE
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // CONSENSUS BADGE
  consensusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  consensusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },

  // TEAMS
  teamsContainer: {
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.TEXT,
    flex: 1,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.ACCENT,
  },
  vsContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.TEXT_SEC,
  },

  // LOCATION
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.BORDER,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: THEME.TEXT_SEC,
    flex: 1,
  },

  // VALIDATE BUTTON
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.ACCENT,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  validateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
