/**
 * PlayerDashboardScreen - Dashboard joueur premium
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
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Composant QuickAction pour joueur
const QuickAction = ({ icon, label, onPress, color = COLORS.PRIMARY }) => (
  <TouchableOpacity
    style={styles.quickAction}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

export const PlayerDashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

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

  const loadData = async () => {
    try {
      const result = await matchesApi.getMyMatches();
      if (result.success) {
        const matchesData = result.data || [];
        setMatches(matchesData);

        const now = new Date();
        const upcoming = matchesData.filter(
          m =>
            ['pending', 'confirmed'].includes(m.status) &&
            new Date(m.matchDate) > now,
        ).length;

        setStats({
          upcomingMatches: upcoming,
          teamsJoined: user?.teams?.length || 0,
          invitations: 0,
          totalGoals: 0,
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

        <View style={styles.headerContent}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>
                FOOT<Text style={{ color: COLORS.PRIMARY_LIGHT }}>CONNECT</Text>
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
              >
                <Icon name="bell" size={22} color={COLORS.WHITE} />
                {stats.invitations > 0 && <View style={styles.badge} />}
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
                {user?.firstName?.[0] || 'J'}
                {user?.lastName?.[0] || 'D'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bienvenue,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Joueur'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Joueur</Text>
              </View>
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
            tintColor={COLORS.PRIMARY}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="calendar"
            label="Mes Matchs"
            onPress={() => navigation.navigate('Matches')}
            color={COLORS.PRIMARY}
          />
          <QuickAction
            icon="search"
            label="Rechercher"
            onPress={() => navigation.navigate('Search')}
            color={COLORS.INFO}
          />
          <QuickAction
            icon="users"
            label="Mes Équipes"
            onPress={() => navigation.navigate('Teams')}
            color={COLORS.WARNING}
          />
          <QuickAction
            icon="user"
            label="Profil"
            onPress={() => navigation.navigate('Profile')}
            color={COLORS.ROLE_REFEREE}
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
            <ActivityIndicator color={COLORS.PRIMARY} size="small" />
          </View>
        ) : stats.upcomingMatches === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="calendar" size={32} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.emptyText}>Aucun match à venir</Text>
            <Text style={styles.emptySubtext}>Rejoins une équipe pour participer aux matchs</Text>
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
                        <Icon name="map-pin" size={12} color={COLORS.TEXT_SECONDARY} />
                        <Text style={styles.matchMeta} numberOfLines={1}>
                          {match.location?.name || 'Lieu non défini'}
                        </Text>
                        <Icon name="clock" size={12} color={COLORS.TEXT_SECONDARY} style={{ marginLeft: 8 }} />
                        <Text style={styles.matchMeta}>{dateInfo.time}</Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
                  </View>
                </TouchableOpacity>
              );
            })
        )}

        {/* Invitations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Invitations</Text>
          {stats.invitations > 0 && (
            <View style={styles.invitationBadge}>
              <Text style={styles.invitationBadgeText}>{stats.invitations}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.invitationCard}
          onPress={() => navigation.navigate('Matches', { screen: 'Invitations' })}
        >
          <View style={styles.invitationIcon}>
            <Icon name="mail" size={24} color={COLORS.INFO} />
          </View>
          <View style={styles.invitationContent}>
            <Text style={styles.invitationTitle}>
              {stats.invitations > 0
                ? `${stats.invitations} invitation${stats.invitations > 1 ? 's' : ''} en attente`
                : 'Aucune invitation'}
            </Text>
            <Text style={styles.invitationDesc}>
              Consultez vos invitations de match
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

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
  headerContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.ERROR,
    borderWidth: 2,
    borderColor: COLORS.DARK,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.GLASS,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.8,
    marginBottom: 2,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.WHITE,
  },
  roleBadge: {
    backgroundColor: COLORS.ROLE_PLAYER,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.WHITE,
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
    fontSize: 26,
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
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
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
    color: COLORS.WHITE,
    textAlign: 'center',
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
    alignItems: 'center',
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
    fontWeight: '800',
    color: COLORS.WHITE,
  },
  matchMonth: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: '600',
    opacity: 0.9,
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
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 4,
  },

  // INVITATION CARD
  invitationBadge: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  invitationBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  invitationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.INFO}15`,
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
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  invitationDesc: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default PlayerDashboardScreen;
