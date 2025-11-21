// ====== src/screens/dashboard/DashboardScreen.js ======
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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { logout } from '../../store/slices/authSlice';
import { SHADOWS } from '../../styles/theme';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Thème "Night Mode" (cohérent avec l'auth)
const THEME = {
  BG: '#0F172A', // Slate 900
  SURFACE: '#1E293B', // Slate 800
  SURFACE_LIGHT: '#334155', // Slate 700
  TEXT: '#F8FAFC', // Slate 50
  TEXT_SEC: '#94A3B8', // Slate 400
  ACCENT: '#22C55E', // Green 500
  BORDER: '#334155',
};

// Composant StatCard "Dark Glass"
const StatCard = ({ icon, value, label, color }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <View style={[styles.statIconBox, { backgroundColor: `${color}20` }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    {/* Petit effet de lueur */}
    <View style={[styles.statGlow, { backgroundColor: color }]} />
  </View>
);

// Composant QuickAction "Neon Button"
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

// Composant ActivityItem "Timeline Dark"
const ActivityItem = ({ activity, isLast }) => {
  const getConfig = type => {
    switch (type) {
      case 'match_invitation':
        return { icon: 'mail', color: '#3B82F6' }; // Blue
      case 'team_update':
        return { icon: 'users', color: THEME.ACCENT }; // Green
      case 'match_reminder':
        return { icon: 'clock', color: '#F59E0B' }; // Amber
      case 'achievement':
        return { icon: 'award', color: '#8B5CF6' }; // Purple
      default:
        return { icon: 'activity', color: THEME.TEXT_SEC };
    }
  };

  const config = getConfig(activity.type);

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityLeft}>
        <View style={[styles.timelineLine, isLast && { display: 'none' }]} />
        <View style={[styles.activityIconRing, { borderColor: config.color }]}>
          <View
            style={[styles.activityIconDot, { backgroundColor: config.color }]}
          />
        </View>
      </View>

      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityTime}>{activity.time}</Text>
        </View>
        <Text style={styles.activityDescription} numberOfLines={2}>
          {activity.description}
        </Text>
      </View>
    </View>
  );
};

export const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  // Données simulées (à remplacer par vos sélecteurs Redux réels)
  const stats = {
    matchesThisWeek: 3,
    teamsCount: 2,
    pendingInvitations: 4,
    totalGoals: 12,
  };

  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Quitter le terrain ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Sortir',
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

  const headerTitleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER DYNAMIQUE */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        {/* Image de fond ou Gradient sophistiqué */}
        <LinearGradient
          colors={['#166534', '#0F172A']} // Green 800 vers Slate 900
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerBackground}
        />

        {/* Effet de grille ou texture (optionnel) */}
        <Animated.View
          style={[styles.headerTexture, { opacity: imageOpacity }]}
        />

        <View style={styles.headerContent}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Animated.View style={{ transform: [{ scale: headerTitleScale }] }}>
              <Text style={styles.logoText}>
                FOOT<Text style={{ color: THEME.ACCENT }}>NETWORK</Text>
              </Text>
            </Animated.View>

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

          {/* Info Utilisateur (Disparait au scroll) */}
          <Animated.View style={[styles.userInfo, { opacity: imageOpacity }]}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || 'J'}
                {user?.lastName?.[0] || 'D'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bon retour,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Joueur'}</Text>
            </View>
          </Animated.View>

          {/* Quick Stats Row (Disparait au scroll) */}
          <Animated.View
            style={[styles.quickStatsRow, { opacity: imageOpacity }]}
          >
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>
                {stats.matchesThisWeek}
              </Text>
              <Text style={styles.quickStatLabel}>Matchs</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.teamsCount}</Text>
              <Text style={styles.quickStatLabel}>Équipes</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>8.5</Text>
              <Text style={styles.quickStatLabel}>Note</Text>
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
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="calendar"
            label="Créer Match"
            onPress={() =>
              navigation.navigate('Matches', { screen: 'CreateMatch' })
            }
          />
          <QuickAction
            icon="search"
            label="Trouver"
            onPress={() => navigation.navigate('Search')}
          />
          <QuickAction
            icon="users"
            label="Créer Équipe"
            onPress={() =>
              navigation.navigate('Teams', { screen: 'CreateTeam' })
            }
          />
          <QuickAction
            icon="user"
            label="Profil"
            onPress={() => navigation.navigate('Profile')}
          />
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="activity"
            value="En forme"
            label="Statut physique"
            color={THEME.ACCENT}
          />
          <StatCard
            icon="target"
            value={`${stats.totalGoals} Buts`}
            label="Saison actuelle"
            color="#3B82F6"
          />
          <StatCard
            icon="award"
            value="3 MVP"
            label="Distinctions"
            color="#F59E0B"
          />
          <StatCard
            icon="trending-up"
            value="+12%"
            label="Performance"
            color="#8B5CF6"
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernières actualités</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            {[
              {
                id: 1,
                type: 'match_invitation',
                title: 'Invitation reçue',
                description: 'Match vs Les Lions - Demain 20h',
                time: '2h',
              },
              {
                id: 2,
                type: 'team_update',
                title: 'Nouveau joueur',
                description: 'Alex a rejoint votre équipe',
                time: '5h',
              },
              {
                id: 3,
                type: 'match_reminder',
                title: 'Rappel',
                description: "N'oubliez pas vos maillots !",
                time: '1j',
              },
            ].map((item, index, arr) => (
              <ActivityItem
                key={item.id}
                activity={item}
                isLast={index === arr.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Espace pour le scroll */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Floating Logout Button (plus discret) */}
      {/* <TouchableOpacity
        style={styles.fab}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Icon name="power" size={24} color={THEME.TEXT} />
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BG,
  },
  // HEADER
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    backgroundColor: THEME.BG, // Fallback
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.2,
  },
  headerContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
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
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: THEME.BG,
  },
  // USER INFO
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  greeting: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  // QUICK STATS ROW
  quickStatsRow: {
    flexDirection: 'row',
    marginTop: 32,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  quickStatLabel: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  // SCROLL CONTENT
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  seeAllLink: {
    color: THEME.ACCENT,
    fontSize: 14,
    fontWeight: '600',
  },
  // QUICK ACTIONS
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickAction: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    ...SHADOWS.SMALL,
  },
  quickActionLabel: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
    textAlign: 'center',
  },
  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: THEME.SURFACE,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    height: 110,
    justifyContent: 'space-between',
  },
  statIconBox: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
  },
  statGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  // ACTIVITY
  activityCard: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  activityItem: {
    flexDirection: 'row',
    minHeight: 70,
  },
  activityLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 24,
    bottom: -10,
    width: 2,
    backgroundColor: THEME.BORDER,
  },
  activityIconRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    marginTop: 4,
  },
  activityIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityTitle: {
    color: THEME.TEXT,
    fontWeight: '600',
    fontSize: 14,
  },
  activityTime: {
    color: THEME.TEXT_SEC,
    fontSize: 12,
  },
  activityDescription: {
    color: THEME.TEXT_SEC,
    fontSize: 13,
    lineHeight: 18,
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
