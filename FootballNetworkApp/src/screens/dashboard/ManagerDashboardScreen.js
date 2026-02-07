/**
 * ManagerDashboardScreen - Dashboard Manager Premium
 * Design Foot Connect avec textes blancs
 */

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
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { logout } from '../../store/slices/authSlice';
import { matchesApi } from '../../services/api/matchesApi';
import { teamsApi } from '../../services/api/teamsApi';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Composant QuickAction pour manager
const QuickAction = ({ icon, label, onPress, color = COLORS.PRIMARY }) => (
  <TouchableOpacity
    style={styles.quickAction}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}15`, borderColor: color }]}>
      <Icon name={icon} size={22} color={color} />
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
      const teamsResult = await teamsApi.getMyTeams();
      const matchesResult = await matchesApi.getMyMatches();

      if (teamsResult.success) {
        const teamsData = teamsResult.data || [];
        setTeams(teamsData);

        const totalPlayers = teamsData.reduce(
          (sum, team) => sum + (team.memberCount || 0),
          0,
        );

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
          pendingInvitations: 0,
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* HEADER DYNAMIQUE */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK, COLORS.DARK]}
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
            <View style={styles.logoRow}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>
                FOOT <Text style={{ color: COLORS.PRIMARY_LIGHT }}>CONNECT</Text>
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
              >
                <Icon name="bell" size={22} color={COLORS.WHITE} />
                {stats.pendingInvitations > 0 && <View style={styles.badge} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Profile', { screen: 'Settings' })}
              >
                <Icon name="settings" size={22} color={COLORS.WHITE} />
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
              <View style={styles.roleBadge}>
                <Icon name="briefcase" size={12} color={COLORS.PRIMARY} />
                <Text style={styles.userRole}>Manager</Text>
              </View>
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
            tintColor={COLORS.PRIMARY}
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
            color={COLORS.PRIMARY}
            onPress={() =>
              navigation.navigate('Matches', { screen: 'CreateMatch' })
            }
          />
          <QuickAction
            icon="users"
            label="Créer Équipe"
            color={COLORS.INFO}
            onPress={() =>
              navigation.navigate('Teams', { screen: 'CreateTeam' })
            }
          />
          <QuickAction
            icon="user-plus"
            label="Recruter"
            color={COLORS.ROLE_REFEREE}
            onPress={() => navigation.navigate('Search')}
          />
          <QuickAction
            icon="bar-chart-2"
            label="Stats"
            color={COLORS.WARNING}
            onPress={() => navigation.navigate('Teams')}
          />
        </View>

        {/* Prochains matchs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matchs à gérer</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {matches.length > 0 ? (
          matches.slice(0, 2).map((match, index) => (
            <TouchableOpacity
              key={match.id || index}
              style={styles.matchCard}
              onPress={() => navigation.navigate('Matches')}
            >
              <View style={styles.matchHeader}>
                <View style={styles.matchDateBox}>
                  <Text style={styles.matchDay}>
                    {new Date(match.matchDate).getDate()}
                  </Text>
                  <Text style={styles.matchMonth}>
                    {new Date(match.matchDate).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTeams}>
                    {match.homeTeam?.name || 'Mon Équipe'} vs {match.awayTeam?.name || 'Adversaire'}
                  </Text>
                  <View style={styles.matchMetaRow}>
                    <Icon name="map-pin" size={12} color={COLORS.WHITE} style={{ opacity: 0.7 }} />
                    <Text style={styles.matchMeta}>{match.location?.name || 'Lieu à définir'}</Text>
                    <Icon name="clock" size={12} color={COLORS.WHITE} style={{ marginLeft: 8, opacity: 0.7 }} />
                    <Text style={styles.matchMeta}>
                      {new Date(match.matchDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Icon name="calendar" size={32} color={COLORS.TEXT_MUTED} />
            <Text style={styles.emptyText}>Aucun match à gérer</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('Matches', { screen: 'CreateMatch' })}
            >
              <Text style={styles.createBtnText}>Créer un match</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Gestion des équipes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Équipes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Teams')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.PRIMARY} size="small" />
          </View>
        ) : teams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="shield" size={32} color={COLORS.TEXT_MUTED} />
            <Text style={styles.emptyText}>Aucune équipe gérée</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('Teams', { screen: 'CreateTeam' })}
            >
              <Text style={styles.createBtnText}>Créer une équipe</Text>
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
                <Icon name="shield" size={24} color={COLORS.PRIMARY} />
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
                <Icon name="settings" size={18} color={COLORS.WHITE} />
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
            <Icon name="user-plus" size={24} color={COLORS.ROLE_REFEREE} />
          </View>
          <View style={styles.recruitContent}>
            <Text style={styles.recruitTitle}>Recruter des joueurs</Text>
            <Text style={styles.recruitDesc}>
              Trouvez des joueurs pour renforcer vos équipes
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.DARK },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20 },

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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.WHITE,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ERROR,
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
    backgroundColor: COLORS.GLASS,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.8,
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 123, 64, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 4,
    gap: 4,
  },
  userRole: {
    fontSize: 12,
    color: COLORS.PRIMARY_LIGHT,
    fontWeight: '600',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.GLASS,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.WHITE,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.8,
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: COLORS.GLASS_BORDER,
  },

  // QUICK ACTIONS
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginTop: 24,
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.DARK_CARD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.WHITE,
    textAlign: 'center',
  },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // MATCH CARD
  matchCard: {
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
  },
  matchDateBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  matchDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  matchMonth: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  matchInfo: {
    flex: 1,
  },
  matchTeams: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 6,
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchMeta: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.7,
    marginLeft: 4,
  },

  // TEAM CARD
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 12,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.PRIMARY}15`,
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
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  teamMeta: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.7,
  },
  teamActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // RECRUIT CARD
  recruitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  recruitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.ROLE_REFEREE}15`,
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
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  recruitDesc: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.7,
  },

  // LOADING & EMPTY STATES
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.7,
    marginTop: 12,
    marginBottom: 16,
  },
  createBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default ManagerDashboardScreen;
