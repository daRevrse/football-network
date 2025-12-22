// ====== src/screens/dashboard/RefereeDashboardScreen.js ======
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
import { logout } from '../../store/slices/authSlice';
import { useFocusEffect } from '@react-navigation/native';
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
  WARNING: '#F59E0B',
  INFO: '#3B82F6',
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

// Composant QuickAction pour arbitre
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

// Badge de statut de match
const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'pending':
        return { bg: '#F59E0B20', color: '#F59E0B', label: 'En attente' };
      case 'confirmed':
        return { bg: '#3B82F620', color: '#3B82F6', label: 'Confirmé' };
      case 'in_progress':
        return { bg: '#22C55E20', color: '#22C55E', label: 'En cours' };
      case 'completed':
        return { bg: '#64748B20', color: '#64748B', label: 'Terminé' };
      default:
        return { bg: '#64748B20', color: '#64748B', label: status };
    }
  };

  const style = getStatusStyle();

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: style.bg, borderColor: style.color + '40' },
      ]}
    >
      <Text style={[styles.statusText, { color: style.color }]}>
        {style.label}
      </Text>
    </View>
  );
};

export const RefereeDashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadMatches = async () => {
    try {
      const result = await matchesApi.getRefereeMatches();
      if (result.success) {
        setMatches(result.data || []);
      }
    } catch (e) {
      console.error('Load matches error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, []),
  );

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

  // Stats pour arbitre
  const now = new Date();
  const stats = {
    totalMatches: matches.length,
    upcomingMatches: matches.filter(
      m =>
        ['pending', 'confirmed'].includes(m.status) &&
        new Date(m.matchDate) > now,
    ).length,
    completedMatches: matches.filter(m => m.status === 'completed').length,
    toValidate: matches.filter(
      m => m.status === 'completed' && !m.scoreVerified,
    ).length,
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

  const formatDate = dateString => {
    if (!dateString) return 'Date non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
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

  // Prochains matchs à arbitrer
  const upcomingMatches = matches
    .filter(
      m =>
        ['pending', 'confirmed'].includes(m.status) &&
        new Date(m.matchDate) > now,
    )
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER DYNAMIQUE */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#F59E0B', '#0F172A']} // Orange/Amber vers Slate 900 pour arbitre
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
                {stats.toValidate > 0 && <View style={styles.badge} />}
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
                {user?.firstName?.[0] || 'A'}
                {user?.lastName?.[0] || 'R'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bienvenue,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Arbitre'}</Text>
              <Text style={styles.userRole}>Arbitre</Text>
            </View>
          </Animated.View>

          {/* Quick Stats Row */}
          <Animated.View
            style={[styles.quickStatsRow, { opacity: imageOpacity }]}
          >
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>
                {stats.totalMatches}
              </Text>
              <Text style={styles.quickStatLabel}>Total</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.upcomingMatches}</Text>
              <Text style={styles.quickStatLabel}>À venir</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.toValidate}</Text>
              <Text style={styles.quickStatLabel}>À valider</Text>
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
        {/* Quick Actions pour ARBITRE */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="calendar"
            label="Mes Matchs"
            color={THEME.WARNING}
            onPress={() => navigation.navigate('Matches')}
          />
          <QuickAction
            icon="check-square"
            label="À Valider"
            color={THEME.INFO}
            onPress={() => navigation.navigate('Matches')}
          />
          <QuickAction
            icon="bar-chart-2"
            label="Statistiques"
            color={THEME.ACCENT}
            onPress={() => navigation.navigate('Profile')}
          />
          <QuickAction
            icon="user"
            label="Profil"
            color="#8B5CF6"
            onPress={() => navigation.navigate('Profile')}
          />
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="calendar"
            value={stats.totalMatches}
            label="Matchs assignés"
            color={THEME.WARNING}
            onPress={() => navigation.navigate('Matches')}
          />
          <StatCard
            icon="clock"
            value={stats.upcomingMatches}
            label="À venir"
            color={THEME.INFO}
            onPress={() => navigation.navigate('Matches')}
          />
          <StatCard
            icon="check-circle"
            value={stats.completedMatches}
            label="Complétés"
            color={THEME.ACCENT}
            onPress={() => navigation.navigate('Matches')}
          />
          <StatCard
            icon="alert-circle"
            value={stats.toValidate}
            label="À valider"
            color="#EF4444"
            onPress={() => navigation.navigate('Matches')}
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
            <ActivityIndicator color={THEME.ACCENT} size="large" />
          </View>
        ) : upcomingMatches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="calendar" size={32} color={THEME.TEXT_SEC} />
            <Text style={styles.emptyText}>Aucun match à venir</Text>
          </View>
        ) : (
          upcomingMatches.map(match => (
            <TouchableOpacity
              key={match.id}
              style={styles.matchCard}
              onPress={() => navigation.navigate('Matches')}
            >
              <View style={styles.matchHeader}>
                <View style={styles.matchDateBox}>
                  <Text style={styles.matchDay}>
                    {formatDate(match.matchDate).split(' ')[0]}
                  </Text>
                  <Text style={styles.matchMonth}>
                    {formatDate(match.matchDate).split(' ')[1].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTeams} numberOfLines={1}>
                    {match.homeTeam?.name || 'Équipe A'} vs{' '}
                    {match.awayTeam?.name || 'Équipe B'}
                  </Text>
                  <View style={styles.matchMetaRow}>
                    <Icon name="map-pin" size={12} color={THEME.TEXT_SEC} />
                    <Text style={styles.matchMeta} numberOfLines={1}>
                      {match.location?.name || 'Lieu non défini'}
                    </Text>
                    <Icon
                      name="clock"
                      size={12}
                      color={THEME.TEXT_SEC}
                      style={{ marginLeft: 8 }}
                    />
                    <Text style={styles.matchMeta}>
                      {formatTime(match.matchDate)}
                    </Text>
                  </View>
                </View>
                <StatusBadge status={match.status} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Scores à valider */}
        {stats.toValidate > 0 && (
          <>
            <Text style={styles.sectionTitle}>Scores à Valider</Text>
            <TouchableOpacity
              style={styles.validateCard}
              onPress={() => navigation.navigate('Matches')}
            >
              <View style={styles.validateIcon}>
                <Icon name="alert-circle" size={24} color="#EF4444" />
              </View>
              <View style={styles.validateContent}>
                <Text style={styles.validateTitle}>
                  {stats.toValidate} score{stats.toValidate > 1 ? 's' : ''} à
                  valider
                </Text>
                <Text style={styles.validateDesc}>
                  Des matchs terminés nécessitent votre validation
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={THEME.TEXT_SEC} />
            </TouchableOpacity>
          </>
        )}

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
    borderColor: THEME.WARNING,
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
    color: THEME.WARNING,
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
    color: THEME.WARNING,
    fontWeight: '600',
  },

  // LOADING
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  // EMPTY CARD
  emptyCard: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    marginTop: 12,
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
    alignItems: 'center',
  },
  matchDateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: THEME.WARNING,
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
    marginRight: 8,
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

  // VALIDATE CARD
  validateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  validateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF444420',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  validateContent: {
    flex: 1,
  },
  validateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.TEXT,
    marginBottom: 4,
  },
  validateDesc: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
  },
});
