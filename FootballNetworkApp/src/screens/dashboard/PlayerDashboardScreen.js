// ====== src/screens/dashboard/PlayerDashboardScreen.js ======
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { logout } from '../../store/slices/authSlice';
import { matchesApi } from '../../services/api/matchesApi';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 260;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  SURFACE_LIGHT: '#334155',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

// Composant StatCard
const StatCard = ({ icon, value, label, color }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <View style={[styles.statIconBox, { backgroundColor: `${color}20` }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <View style={[styles.statGlow, { backgroundColor: color }]} />
  </View>
);

// Composant QuickAction pour joueur
const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity
    style={styles.quickAction}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.quickActionIcon}>
      <Icon name={icon} size={24} color={THEME.TEXT} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

export const PlayerDashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  // État pour les stats dynamiques
  const [stats, setStats] = useState({
    upcomingMatches: 0,
    teamsJoined: 0,
    invitations: 0,
    totalGoals: 0,
  });
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Charger les données
  const loadData = async () => {
    try {
      const result = await matchesApi.getMyMatches();
      if (result.success) {
        const matchesData = result.data || [];
        setMatches(matchesData);

        // Calculer les stats
        const now = new Date();
        const upcoming = matchesData.filter(
          m =>
            ['pending', 'confirmed'].includes(m.status) &&
            new Date(m.matchDate) > now,
        ).length;

        // Récupérer les invitations depuis Redux
        const invitationsCount = 0; // TODO: À connecter avec Redux quand disponible

        setStats({
          upcomingMatches: upcoming,
          teamsJoined: user?.teams?.length || 0,
          invitations: invitationsCount,
          totalGoals: 0, // TODO: À calculer depuis les stats de match
        });
      }
    } catch (e) {
      console.error('Load data error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  // Animations Header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER DYNAMIQUE */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#3B82F6', '#0F172A']} // Blue vers Slate 900 pour joueur
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerBackground}
        />

        <Animated.View
          style={[styles.headerTexture, { opacity: imageOpacity }]}
        />

        <View style={styles.headerContent}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.logoText}>
              FOOT<Text style={{ color: THEME.ACCENT }}>NETWORK</Text>
            </Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
              >
                <Icon name="bell" size={22} color={THEME.TEXT} />
                {stats.invitations > 0 && <View style={styles.badge} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Profile', { screen: 'Settings' })}
              >
                <Icon name="settings" size={22} color={THEME.TEXT} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Utilisateur */}
          <Animated.View style={[styles.userInfo, { opacity: imageOpacity }]}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || 'J'}
                {user?.lastName?.[0] || 'D'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bienvenue,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Joueur'}</Text>
              <Text style={styles.userRole}>Joueur</Text>
            </View>
          </Animated.View>

          {/* Quick Stats Row */}
          <Animated.View
            style={[styles.quickStatsRow, { opacity: imageOpacity }]}
          >
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>
                {stats.upcomingMatches}
              </Text>
              <Text style={styles.quickStatLabel}>Matchs</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.teamsJoined}</Text>
              <Text style={styles.quickStatLabel}>Équipes</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.totalGoals}</Text>
              <Text style={styles.quickStatLabel}>Buts</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* SCROLL CONTENT */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.ACCENT}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
        {/* Quick Actions pour JOUEUR */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="calendar"
            label="Mes Matchs"
            onPress={() => navigation.navigate('Matches')}
          />
          <QuickAction
            icon="search"
            label="Rechercher"
            onPress={() => navigation.navigate('Search')}
          />
          <QuickAction
            icon="users"
            label="Mes Équipes"
            onPress={() => navigation.navigate('Teams')}
          />
          <QuickAction
            icon="user"
            label="Profil"
            onPress={() => navigation.navigate('Profile')}
          />
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="target"
            value={stats.totalGoals}
            label="Buts marqués"
            color="#3B82F6"
          />
          <StatCard
            icon="award"
            value="8.5"
            label="Note moyenne"
            color="#F59E0B"
          />
          <StatCard
            icon="zap"
            value="En forme"
            label="Condition"
            color={THEME.ACCENT}
          />
          <StatCard
            icon="shield"
            value={stats.teamsJoined}
            label="Équipes"
            color="#8B5CF6"
          />
        </View>

        {/* Prochains matchs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prochains Matchs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={THEME.ACCENT} size="small" />
          </View>
        ) : stats.upcomingMatches === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="calendar" size={32} color={THEME.TEXT_SEC} />
            <Text style={styles.emptyText}>Aucun match à venir</Text>
          </View>
        ) : (
          matches
            .filter(
              m =>
                ['pending', 'confirmed'].includes(m.status) &&
                new Date(m.matchDate) > new Date(),
            )
            .slice(0, 2)
            .map(match => {
              const formatDate = dateString => {
                const date = new Date(dateString);
                return {
                  day: date.getDate(),
                  month: date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
                  time: date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                };
              };

              const dateInfo = formatDate(match.matchDate);

              return (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchCard}
                  onPress={() => navigation.navigate('Matches', { screen: 'MatchDetail', params: { matchId: match.id } })}
                >
                  <View style={styles.matchHeader}>
                    <View style={styles.matchDateBox}>
                      <Text style={styles.matchDay}>{dateInfo.day}</Text>
                      <Text style={styles.matchMonth}>{dateInfo.month}</Text>
                    </View>
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchTeams} numberOfLines={1}>
                        {match.homeTeam?.name || 'Équipe A'} vs {match.awayTeam?.name || 'Équipe B'}
                      </Text>
                      <View style={styles.matchMetaRow}>
                        <Icon name="map-pin" size={12} color={THEME.TEXT_SEC} />
                        <Text style={styles.matchMeta} numberOfLines={1}>
                          {match.location?.name || 'Lieu non défini'}
                        </Text>
                        <Icon name="clock" size={12} color={THEME.TEXT_SEC} style={{ marginLeft: 8 }} />
                        <Text style={styles.matchMeta}>{dateInfo.time}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
        )}

        {/* Invitations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Invitations</Text>
          <View style={styles.invitationBadge}>
            <Text style={styles.invitationBadgeText}>{stats.invitations}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.invitationCard}
          onPress={() => navigation.navigate('Matches', { screen: 'Invitations' })}
        >
          <View style={styles.invitationIcon}>
            <Icon name="mail" size={24} color="#3B82F6" />
          </View>
          <View style={styles.invitationContent}>
            <Text style={styles.invitationTitle}>
              Vous avez {stats.invitations} invitation{stats.invitations > 1 ? 's' : ''}
            </Text>
            <Text style={styles.invitationDesc}>
              Consultez vos invitations de match
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={THEME.TEXT_SEC} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 20 },

  // HEADER
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  headerContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.TEXT,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  userRole: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 16,
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // QUICK ACTIONS
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginTop: 24,
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.TEXT,
    textAlign: 'center',
  },

  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
  },
  statGlow: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.1,
  },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },

  // MATCH CARD
  matchCard: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  matchDateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  matchDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  matchMonth: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  matchInfo: {
    flex: 1,
  },
  matchTeams: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.TEXT,
    marginBottom: 6,
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchMeta: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
    marginLeft: 4,
  },
  matchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  matchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  matchActionText: {
    fontSize: 13,
    color: THEME.ACCENT,
    fontWeight: '600',
  },

  // INVITATION CARD
  invitationBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  invitationBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  invitationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invitationContent: {
    flex: 1,
  },
  invitationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.TEXT,
    marginBottom: 4,
  },
  invitationDesc: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
  },

  // LOADING & EMPTY STATES
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    marginTop: 12,
  },
});
