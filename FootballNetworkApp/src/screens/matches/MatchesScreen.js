/**
 * MatchesScreen - Mes Matchs
 * Design Foot Connect Premium
 */

import React, { useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { matchesApi } from '../../services/api';
import { API_CONFIG } from '../../utils/constants';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

// Helper Date
const formatDate = dateString => {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return `Aujourd'hui • ${date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper Status
const getStatusInfo = status => {
  switch (status) {
    case 'in_progress':
      return { label: 'EN DIRECT', color: COLORS.ERROR, icon: 'activity' };
    case 'completed':
      return { label: 'TERMINÉ', color: COLORS.SUCCESS, icon: 'check' };
    case 'cancelled':
      return { label: 'ANNULÉ', color: COLORS.ERROR, icon: 'x' };
    case 'confirmed':
      return { label: 'CONFIRMÉ', color: COLORS.PRIMARY, icon: 'check-circle' };
    default:
      return { label: 'À VENIR', color: COLORS.INFO, icon: 'calendar' };
  }
};

// Composant Avatar d'Équipe
const TeamAvatar = ({ name, logoUrl, size = 48 }) => {
  if (logoUrl) {
    return (
      <Image
        source={{ uri: API_CONFIG.BASE_URL.replace('/api', '') + logoUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 3,
          backgroundColor: COLORS.WHITE,
          borderWidth: 2,
          borderColor: COLORS.PRIMARY,
        }}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={GRADIENTS.button}
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.GLASS_BORDER,
      }}
    >
      <Text style={{ fontSize: size * 0.4, fontWeight: 'bold', color: COLORS.WHITE }}>
        {name ? name.charAt(0).toUpperCase() : '?'}
      </Text>
    </LinearGradient>
  );
};

const MatchCard = ({ match, onPress }) => {
  const statusInfo = getStatusInfo(match.status);
  const isScoreVisible =
    match.status === 'completed' || match.status === 'in_progress';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={[COLORS.DARK_CARD, COLORS.DARK_ELEVATED]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Header Carte */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { borderColor: statusInfo.color }]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(match.matchDate)}</Text>
        </View>

        {/* Teams Row */}
        <View style={styles.teamsRow}>
          {/* Home Team */}
          <View style={styles.teamSide}>
            <TeamAvatar
              name={match.homeTeam.name}
              logoUrl={match.homeTeam.logoUrl}
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
          </View>

          {/* Score / VS */}
          <View
            style={[styles.scoreBox, isScoreVisible && styles.scoreBoxActive]}
          >
            {isScoreVisible ? (
              <Text style={styles.scoreText}>
                {match.score.home} - {match.score.away}
              </Text>
            ) : (
              <Text style={styles.vsText}>VS</Text>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamSide}>
            {match.awayTeam ? (
              <>
                <TeamAvatar
                  name={match.awayTeam.name}
                  logoUrl={match.awayTeam.logoUrl}
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.awayTeam.name}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.avatarPlaceholder}>
                  <Icon name="help-circle" size={24} color={COLORS.WHITE} />
                </View>
                <Text style={[styles.teamName, { opacity: 0.6 }]}>
                  En attente
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Location Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <Icon name="map-pin" size={12} color={COLORS.WHITE} />
            <Text style={styles.locationText} numberOfLines={1}>
              {match.location?.name ||
                match.location?.address ||
                'Lieu à définir'}
            </Text>
          </View>
          {match.isOrganizer && (
            <View style={styles.organizerBadge}>
              <Icon name="star" size={10} color={COLORS.DARK} />
              <Text style={styles.organizerText}>ORGANISATEUR</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const MatchesScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const userType = user?.userType;

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('upcoming');

  const canCreateMatch = userType === 'manager';

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, []),
  );

  const loadMatches = async () => {
    try {
      setLoading(true);
      const result = await matchesApi.getMyMatches();
      if (result.success) setMatches(result.data || result.matches || []);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitations = () => {
    navigation.navigate('Invitations');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const filteredMatches = matches.filter(m => {
    const isPast =
      new Date(m.matchDate) < new Date() ||
      m.status === 'completed' ||
      m.status === 'cancelled';
    return filter === 'past' ? isPast : !isPast;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK, COLORS.DARK]}
        style={styles.header}
      >
        <Text style={styles.title}>Mes Matchs</Text>
        <View style={styles.headerActions}>
          {canCreateMatch && (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateMatch')}
            >
              <Icon name="plus" size={22} color={COLORS.WHITE} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.invitationButton}
            onPress={handleInvitations}
          >
            <Icon name="mail" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'upcoming' && styles.tabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              filter === 'upcoming' && styles.tabTextActive,
            ]}
          >
            À venir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'past' && styles.tabActive]}
          onPress={() => setFilter('past')}
        >
          <Text
            style={[styles.tabText, filter === 'past' && styles.tabTextActive]}
          >
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {filteredMatches.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Icon name="calendar" size={48} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.emptyText}>
              Aucun match {filter === 'upcoming' ? 'prévu' : 'trouvé'}
            </Text>
            {filter === 'upcoming' && canCreateMatch && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('CreateMatch')}
              >
                <LinearGradient
                  colors={GRADIENTS.button}
                  style={styles.emptyBtnGradient}
                >
                  <Icon name="plus" size={18} color={COLORS.WHITE} />
                  <Text style={styles.emptyBtnText}>Organiser un match</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onPress={() =>
                navigation.navigate('MatchDetail', { matchId: match.id })
              }
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.WHITE,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  invitationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },

  // TABS
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
    marginTop: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.DARK_CARD,
  },
  tabActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  tabText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
    opacity: 0.7,
  },
  tabTextActive: {
    color: COLORS.WHITE,
    opacity: 1,
  },

  content: {
    paddingHorizontal: 24,
  },

  // CARD
  card: {
    marginBottom: 16,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    ...SHADOWS.medium,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '90%',
  },

  scoreBox: {
    minWidth: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.DARK,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 12,
  },
  scoreBoxActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: `${COLORS.PRIMARY}15`,
  },
  scoreText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  vsText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.6,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GLASS_BORDER,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    color: COLORS.WHITE,
    fontSize: 12,
    flex: 1,
    opacity: 0.8,
  },

  organizerBadge: {
    backgroundColor: COLORS.WARNING,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  organizerText: {
    color: COLORS.DARK,
    fontSize: 9,
    fontWeight: 'bold',
  },

  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  emptyText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyBtn: {
    marginTop: 20,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
  },
  emptyBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
