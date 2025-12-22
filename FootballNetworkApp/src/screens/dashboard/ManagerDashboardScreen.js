// ====== src/screens/dashboard/ManagerDashboardScreen.js ======
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
import { teamsApi } from '../../services/api/teamsApi';

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
const StatCard = ({ icon, value, label, color, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.statIconBox, { backgroundColor: `${color}20` }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <View style={[styles.statGlow, { backgroundColor: color }]} />
  </TouchableOpacity>
);

// Composant QuickAction pour manager
const QuickAction = ({ icon, label, onPress, color = THEME.ACCENT }) => (
  <TouchableOpacity
    style={styles.quickAction}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

export const ManagerDashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  // État pour les stats dynamiques
  const [stats, setStats] = useState({
    teamsManaged: 0,
    upcomingMatches: 0,
    pendingInvitations: 0,
    totalPlayers: 0,
  });
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Charger les données
  const loadData = async () => {
    try {
      // Charger les équipes gérées
      const teamsResult = await teamsApi.getMyTeams();
      const matchesResult = await matchesApi.getMyMatches();

      if (teamsResult.success) {
        const teamsData = teamsResult.data || [];
        setTeams(teamsData);

        // Calculer le nombre total de joueurs
        const totalPlayers = teamsData.reduce(
          (sum, team) => sum + (team.memberCount || 0),
          0,
        );

        // Calculer les matchs à venir
        const now = new Date();
        const matchesData = matchesResult.success ? matchesResult.data || [] : [];
        setMatches(matchesData);

        const upcoming = matchesData.filter(
          m =>
            ['pending', 'confirmed'].includes(m.status) &&
            new Date(m.matchDate) > now,
        ).length;

        setStats({
          teamsManaged: teamsData.length,
          upcomingMatches: upcoming,
          pendingInvitations: 0, // TODO: À connecter avec Redux
          totalPlayers: totalPlayers,
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
          colors={['#166534', '#0F172A']} // Green 800 vers Slate 900 pour manager
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
                {stats.pendingInvitations > 0 && <View style={styles.badge} />}
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
                {user?.firstName?.[0] || 'M'}
                {user?.lastName?.[0] || 'G'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bienvenue,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Manager'}</Text>
              <Text style={styles.userRole}>Manager</Text>
            </View>
          </Animated.View>

          {/* Quick Stats Row */}
          <Animated.View
            style={[styles.quickStatsRow, { opacity: imageOpacity }]}
          >
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>
                {stats.teamsManaged}
              </Text>
              <Text style={styles.quickStatLabel}>Équipes</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.upcomingMatches}</Text>
              <Text style={styles.quickStatLabel}>Matchs</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.totalPlayers}</Text>
              <Text style={styles.quickStatLabel}>Joueurs</Text>
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
        {/* Quick Actions pour MANAGER */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="calendar"
            label="Créer Match"
            color={THEME.ACCENT}
            onPress={() =>
              navigation.navigate('Matches', { screen: 'CreateMatch' })
            }
          />
          <QuickAction
            icon="users"
            label="Créer Équipe"
            color="#3B82F6"
            onPress={() =>
              navigation.navigate('Teams', { screen: 'CreateTeam' })
            }
          />
          <QuickAction
            icon="user-plus"
            label="Recruter"
            color="#8B5CF6"
            onPress={() => navigation.navigate('Search')}
          />
          <QuickAction
            icon="bar-chart-2"
            label="Statistiques"
            color="#F59E0B"
            onPress={() => navigation.navigate('Teams')}
          />
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="shield"
            value={stats.teamsManaged}
            label="Équipes gérées"
            color={THEME.ACCENT}
            onPress={() => navigation.navigate('Teams')}
          />
          <StatCard
            icon="calendar"
            value={stats.upcomingMatches}
            label="Matchs à venir"
            color="#3B82F6"
            onPress={() => navigation.navigate('Matches')}
          />
          <StatCard
            icon="users"
            value={stats.totalPlayers}
            label="Joueurs totaux"
            color="#8B5CF6"
            onPress={() => navigation.navigate('Teams')}
          />
          <StatCard
            icon="mail"
            value={stats.pendingInvitations}
            label="Invitations"
            color="#F59E0B"
            onPress={() => navigation.navigate('Matches', { screen: 'Invitations' })}
          />
        </View>

        {/* Prochains matchs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matchs à gérer</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <View style={styles.matchDateBox}>
              <Text style={styles.matchDay}>15</Text>
              <Text style={styles.matchMonth}>DÉC</Text>
            </View>
            <View style={styles.matchInfo}>
              <Text style={styles.matchTeams}>Mon Équipe vs Adversaires FC</Text>
              <View style={styles.matchMetaRow}>
                <Icon name="map-pin" size={12} color={THEME.TEXT_SEC} />
                <Text style={styles.matchMeta}>Stade Municipal</Text>
                <Icon name="clock" size={12} color={THEME.TEXT_SEC} style={{ marginLeft: 8 }} />
                <Text style={styles.matchMeta}>18:00</Text>
              </View>
            </View>
          </View>
          <View style={styles.matchActions}>
            <TouchableOpacity style={styles.matchActionBtn}>
              <Icon name="users" size={16} color="#3B82F6" />
              <Text style={[styles.matchActionText, { color: '#3B82F6' }]}>Gérer compo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.matchActionBtn}>
              <Icon name="check-circle" size={16} color={THEME.ACCENT} />
              <Text style={styles.matchActionText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gestion des équipes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Équipes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Teams')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={THEME.ACCENT} size="small" />
          </View>
        ) : teams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="shield" size={32} color={THEME.TEXT_SEC} />
            <Text style={styles.emptyText}>Aucune équipe gérée</Text>
            <TouchableOpacity
              style={styles.createTeamBtn}
              onPress={() => navigation.navigate('Teams', { screen: 'CreateTeam' })}
            >
              <Text style={styles.createTeamText}>Créer une équipe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          teams.slice(0, 2).map(team => (
            <TouchableOpacity
              key={team.id}
              style={styles.teamCard}
              onPress={() => navigation.navigate('Teams', { screen: 'TeamDetail', params: { teamId: team.id } })}
            >
              <View style={styles.teamIcon}>
                <Icon name="shield" size={24} color={THEME.ACCENT} />
              </View>
              <View style={styles.teamContent}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamMeta}>
                  {team.memberCount || 0} joueur{team.memberCount > 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.teamActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('Teams', { screen: 'TeamDetail', params: { teamId: team.id } });
                }}
              >
                <Icon name="settings" size={18} color={THEME.TEXT_SEC} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        {/* Actions de recrutement */}
        <Text style={styles.sectionTitle}>Recrutement</Text>
        <TouchableOpacity
          style={styles.recruitCard}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={styles.recruitIcon}>
            <Icon name="user-plus" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.recruitContent}>
            <Text style={styles.recruitTitle}>Recruter des joueurs</Text>
            <Text style={styles.recruitDesc}>
              Trouvez des joueurs pour renforcer vos équipes
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
    color: THEME.ACCENT,
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
    color: THEME.ACCENT,
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
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  matchDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  matchMonth: {
    fontSize: 10,
    color: '#000',
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

  // TEAM CARD
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    marginBottom: 12,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamContent: {
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.TEXT,
    marginBottom: 4,
  },
  teamMeta: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
  },
  teamActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.BG,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // RECRUIT CARD
  recruitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  recruitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recruitContent: {
    flex: 1,
  },
  recruitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.TEXT,
    marginBottom: 4,
  },
  recruitDesc: {
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
    marginBottom: 16,
  },
  createTeamBtn: {
    backgroundColor: THEME.ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createTeamText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
