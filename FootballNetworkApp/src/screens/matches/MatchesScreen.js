// ====== src/screens/matches/MatchesScreen.js - NOUVEAU DESIGN + BACKEND ======
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { matchesApi } from '../../services/api';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 140;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Helper pour formater les dates
const formatDate = dateString => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Demain à ${date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

// Helper pour statut du match
const getMatchStatus = match => {
  const now = new Date();
  const matchDate = new Date(match.matchDate);

  if (match.status === 'completed') {
    return { label: 'Terminé', color: '#6B7280', icon: 'check-circle' };
  } else if (match.status === 'cancelled') {
    return { label: 'Annulé', color: '#EF4444', icon: 'x-circle' };
  } else if (match.status === 'in_progress') {
    return { label: 'En cours', color: '#22C55E', icon: 'play-circle' };
  } else if (matchDate < now) {
    return { label: 'Passé', color: '#9CA3AF', icon: 'clock' };
  } else {
    return { label: 'À venir', color: '#3B82F6', icon: 'calendar' };
  }
};

// Composant MatchCard
const MatchCard = ({ match, onPress }) => {
  const status = getMatchStatus(match);

  return (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.matchCardGradient}
      >
        {/* Header avec statut */}
        <View style={styles.matchHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.color + '20' },
            ]}
          >
            <Icon name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          <Text style={styles.matchDate}>{formatDate(match.matchDate)}</Text>
        </View>

        {/* Équipes */}
        <View style={styles.teamsContainer}>
          {/* Équipe 1 */}
          <View style={styles.teamSection}>
            <View style={styles.teamIconContainer}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.teamIcon}
              >
                <Icon name="shield" size={24} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
            {match.score.home !== null && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{match.score.home}</Text>
              </View>
            )}
          </View>

          {/* VS */}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Équipe 2 */}
          <View style={styles.teamSection}>
            <View style={styles.teamIconContainer}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.teamIcon}
              >
                <Icon name="shield" size={24} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.teamName} numberOfLines={1}>
              {match.awayTeam.name}
            </Text>
            {match.score.away !== null && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{match.score.away}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer avec lieu */}
        {match.location && (
          <View style={styles.matchFooter}>
            <Icon name="map-pin" size={14} color="#6B7280" />
            <Text style={styles.locationText}>
              {match.location.name || 'Lieu à confirmer'}
            </Text>
          </View>
        )}

        {/* Flèche */}
        <Icon
          name="chevron-right"
          size={24}
          color="#CBD5E1"
          style={styles.chevron}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Composant QuickStat
const QuickStat = ({ icon, value, label, gradient }) => (
  <View style={styles.quickStat}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.quickStatGradient}
    >
      <Icon name={icon} size={20} color="#FFF" />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </LinearGradient>
  </View>
);

// Composant EmptyState
const EmptyState = ({ activeTab, onCreateMatch }) => (
  <View style={styles.emptyState}>
    <LinearGradient
      colors={['#22C55E20', '#22C55E10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.emptyStateGradient}
    >
      <View style={styles.emptyIconContainer}>
        <Icon name="calendar" size={48} color="#22C55E" />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'upcoming' ? 'Aucun match à venir' : 'Aucun match'}
      </Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'upcoming'
          ? 'Créez un nouveau match ou attendez une invitation'
          : 'Pas de matchs dans cette catégorie'}
      </Text>
      {activeTab === 'upcoming' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onCreateMatch}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyButtonGradient}
          >
            <Icon name="plus" size={20} color="#FFF" />
            <Text style={styles.emptyButtonText}>Créer un match</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </LinearGradient>
  </View>
);

export const MatchesScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, all
  const [stats, setStats] = useState({
    totalMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
  });

  const scrollY = useRef(new Animated.Value(0)).current;

  // Charger les matchs au focus
  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, []),
  );

  const loadMatches = async () => {
    try {
      setLoading(true);
      const result = await matchesApi.getMyMatches();

      console.log('result', result);

      if (result.success) {
        setMatches(result.data);

        // Calculer les stats
        const now = new Date();
        const upcoming = result.data.filter(
          m =>
            new Date(m.matchDate) > now &&
            // m.status !== 'cancelled' &&
            // m.status !== 'completed',
            m.status === 'confirmed',
        ).length;
        const completed = result.data.filter(
          m => m.status === 'completed',
        ).length;

        setStats({
          totalMatches: result.data.length,
          upcomingMatches: upcoming,
          completedMatches: completed,
        });
      } else {
        Alert.alert(
          'Erreur',
          result.error || 'Impossible de charger les matchs',
        );
      }
    } catch (error) {
      console.error('Load matches error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  }, []);

  const handleMatchPress = match => {
    navigation.navigate('MatchDetail', {
      matchId: match.id,
    });
  };

  const handleCreateMatch = () => {
    navigation.navigate('CreateMatch');
  };

  const handleInvitations = () => {
    navigation.navigate('Invitations');
  };

  // Animations du header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerContentTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  const headerTitleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const headerTitleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0],
    extrapolate: 'clamp',
  });

  // Filtrer les matchs selon l'onglet actif
  const filteredMatches = matches.filter(match => {
    const now = new Date();
    const matchDate = new Date(match.matchDate);

    if (activeTab === 'upcoming') {
      return (
        matchDate > now &&
        // match.status !== 'cancelled' &&
        // match.status !== 'completed'
        match.status === 'confirmed'
      );
    } else if (activeTab === 'past') {
      return matchDate < now || match.status === 'completed';
    }
    return true; // all
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
          },
        ]}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A', '#15803D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <Animated.View
              style={[
                styles.headerTitleContainer,
                {
                  transform: [
                    { translateY: headerTitleTranslateY },
                    { scale: headerTitleScale },
                  ],
                },
              ]}
            >
              <Text style={styles.headerTitle}>Mes Matchs</Text>
              <Animated.Text
                style={[
                  styles.headerSubtitle,
                  { opacity: headerContentOpacity },
                ]}
              >
                {matches.length} {matches.length > 1 ? 'matchs' : 'match'}
              </Animated.Text>
            </Animated.View>
            <TouchableOpacity
              style={styles.invitationButton}
              onPress={handleInvitations}
            >
              <Icon name="mail" size={20} color="#FFF" />
              {/* Badge notification (si invitations en attente) */}
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <Animated.View
            style={[
              styles.quickStatsContainer,
              {
                opacity: headerContentOpacity,
                transform: [{ translateY: headerContentTranslateY }],
              },
            ]}
          >
            <QuickStat
              icon="calendar"
              value={stats.totalMatches}
              label="Total"
              gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
            />
            <QuickStat
              icon="clock"
              value={stats.upcomingMatches}
              label="À venir"
              gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
            />
            <QuickStat
              icon="check-circle"
              value={stats.completedMatches}
              label="Joués"
              gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
            />
          </Animated.View>
        </LinearGradient>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            {activeTab === 'upcoming' ? (
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <Icon name="clock" size={16} color="#FFF" />
                <Text style={styles.tabTextActive}>À venir</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabContent}>
                <Icon name="clock" size={16} color="#6B7280" />
                <Text style={styles.tabText}>À venir</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => setActiveTab('past')}
          >
            {activeTab === 'past' ? (
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <Icon name="check-circle" size={16} color="#FFF" />
                <Text style={styles.tabTextActive}>Passés</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabContent}>
                <Icon name="check-circle" size={16} color="#6B7280" />
                <Text style={styles.tabText}>Passés</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            {activeTab === 'all' ? (
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <Icon name="list" size={16} color="#FFF" />
                <Text style={styles.tabTextActive}>Tous</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabContent}>
                <Icon name="list" size={16} color="#6B7280" />
                <Text style={styles.tabText}>Tous</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Liste des matchs */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#22C55E']}
            tintColor="#22C55E"
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
        {filteredMatches.length === 0 ? (
          <EmptyState activeTab={activeTab} onCreateMatch={handleCreateMatch} />
        ) : (
          filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onPress={() => handleMatchPress(match)}
            />
          ))
        )}
      </Animated.ScrollView>

      {/* Bouton FAB Créer */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleCreateMatch}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Icon name="plus" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  invitationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStat: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickStatGradient: {
    padding: 12,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabActive: {
    ...SHADOWS.SMALL,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  matchCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.MEDIUM,
  },
  matchCardGradient: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamIconContainer: {
    marginBottom: 8,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  scoreContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
  },
  emptyState: {
    paddingVertical: 60,
  },
  emptyStateGradient: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
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
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.LARGE,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
