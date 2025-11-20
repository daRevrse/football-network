// ====== src/screens/dashboard/DashboardScreen.js - VERSION CORRIGÉE ======
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
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';
import { logout } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280; // Hauteur maximale de l'en-tête
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90; // Hauteur minimale (barre de nav)
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Composant StatCard moderne
const StatCard = ({ icon, value, label, gradient }) => (
  <View style={styles.statCard}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statGradient}
    >
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={22} color="#FFF" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </View>
);

// Composant QuickAction moderne
const QuickAction = ({ icon, label, onPress, gradient }) => (
  <TouchableOpacity
    style={styles.quickAction}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.quickActionGradient}
    >
      <Icon name={icon} size={20} color="#FFF" />
    </LinearGradient>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// Composant ActivityItem moderne
const ActivityItem = ({ activity }) => {
  const getActivityConfig = type => {
    const configs = {
      match_invitation: {
        icon: 'mail',
        color: '#3B82F6',
        bgColor: '#3B82F620',
      },
      team_update: {
        icon: 'user-plus',
        color: '#22C55E',
        bgColor: '#22C55E20',
      },
      match_reminder: {
        icon: 'clock',
        color: '#F59E0B',
        bgColor: '#F59E0B20',
      },
      achievement: {
        icon: 'award',
        color: '#8B5CF6',
        bgColor: '#8B5CF620',
      },
    };
    return configs[type] || configs.match_invitation;
  };

  const config = getActivityConfig(activity.type);

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityLeft}>
        <View
          style={[styles.activityIcon, { backgroundColor: config.bgColor }]}
        >
          <Icon name={config.icon} size={18} color={config.color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
          <Text style={styles.activityTime}>{activity.time}</Text>
        </View>
      </View>
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor:
              activity.status === 'pending' ? '#F59E0B' : '#22C55E',
          },
        ]}
      />
    </View>
  );
};

export const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { myTeams } = useSelector(state => state.teams || { myTeams: [] });
  const { upcomingMatches, invitations } = useSelector(
    state => state.matches || { upcomingMatches: [], invitations: [] },
  );
  const { unreadCount } = useSelector(
    state => state.notifications || { unreadCount: 0 },
  );

  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Thème dynamique - DOIT ÊTRE APPELÉ TOUJOURS AU NIVEAU RACINE
  const { colors: COLORS, isDark } = useTheme('auto');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const stats = {
    matchesThisWeek: upcomingMatches?.length || 0,
    teamsCount: myTeams?.length || 0,
    pendingInvitations:
      invitations?.filter(inv => inv.status === 'pending').length || 0,
    totalGoals: 12,
  };

  const quickActions = [
    {
      id: 'create-match',
      title: 'Créer un match',
      iconName: 'calendar',
      gradient: ['#22C55E', '#16A34A'],
      onPress: () => navigation.navigate('Matches', { screen: 'CreateMatch' }),
    },
    {
      id: 'find-team',
      title: 'Trouver une équipe',
      iconName: 'search',
      gradient: ['#3B82F6', '#2563EB'],
      onPress: () => navigation.navigate('Search'),
    },
    {
      id: 'create-team',
      title: 'Créer une équipe',
      iconName: 'users',
      gradient: ['#8B5CF6', '#7C3AED'],
      onPress: () => navigation.navigate('Teams', { screen: 'CreateTeam' }),
    },
    {
      id: 'my-profile',
      title: 'Mon profil',
      iconName: 'user',
      gradient: ['#F59E0B', '#D97706'],
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'match_invitation',
      title: 'Nouvelle invitation de match',
      description: 'FC Barcelone vs Real Madrid - Demain 15h',
      time: 'Il y a 2h',
      status: 'pending',
    },
    {
      id: '2',
      type: 'team_update',
      title: "Nouveau membre dans l'équipe",
      description: 'Jean Dupont a rejoint Les Tigres',
      time: 'Il y a 4h',
      status: 'read',
    },
    {
      id: '3',
      type: 'match_reminder',
      title: 'Rappel de match',
      description: 'Votre match commence dans 2 heures',
      time: 'Il y a 6h',
      status: 'read',
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Nouveau succès débloqué',
      description: 'Buteur prolifique - 10 buts marqués',
      time: 'Hier',
      status: 'read',
    },
  ];

  // Animations du header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2], // Disparaît à mi-chemin
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerContentTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -50], // Léger mouvement vers le haut pour le contenu
    extrapolate: 'clamp',
  });

  const appNameScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8], // Réduit la taille du titre
    extrapolate: 'clamp',
  });

  const appNameTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 10], // Le déplace légèrement
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header avec Gradient */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight, // Applique la hauteur dynamique
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
                styles.headerLeft,
                { transform: [{ translateY: appNameTranslateY }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.appNameContainer,
                  { transform: [{ scale: appNameScale }] },
                ]}
              >
                <Icon name="dribbble" size={28} color="#FFF" />
                <Text style={styles.appName}>FootConnect</Text>
              </Animated.View>
              {/* Le message de bienvenue disparaît */}
              <Animated.Text
                style={[styles.greeting, { opacity: headerContentOpacity }]}
              >
                Bonjour, {user?.firstName || 'Joueur'} 👋
              </Animated.Text>
            </Animated.View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Icon name="bell" size={22} color="#FFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Icon name="settings" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats disparaissent au scroll */}
          <Animated.View
            style={[
              styles.quickStatsContainer,
              {
                opacity: headerContentOpacity,
                transform: [{ translateY: headerContentTranslateY }],
              },
            ]}
          >
            <View style={styles.quickStat}>
              <Icon name="calendar" size={20} color="#FFF" />
              <Text style={styles.quickStatValue}>{stats.matchesThisWeek}</Text>
              <Text style={styles.quickStatLabel}>Matchs cette semaine</Text>
            </View>
            <View style={styles.quickStat}>
              <Icon name="users" size={20} color="#FFF" />
              <Text style={styles.quickStatValue}>{stats.teamsCount}</Text>
              <Text style={styles.quickStatLabel}>Équipes</Text>
            </View>
            <View style={styles.quickStat}>
              <Icon name="mail" size={20} color="#FFF" />
              <Text style={styles.quickStatValue}>
                {stats.pendingInvitations}
              </Text>
              <Text style={styles.quickStatLabel}>Invitations</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Contenu scrollable */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT + 24 }, // Padding initial basé sur la hauteur max
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }, // IMPORTANT: Mettre à false car on anime la hauteur (layout)
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#22C55E']}
            tintColor="#22C55E"
            // Déplace l'indicateur de rafraîchissement sous l'en-tête
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
        {/* Statistiques détaillées */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
            Mes Statistiques
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="target"
              value={stats.matchesThisWeek}
              label="Matchs cette semaine"
              gradient={['#22C55E', '#16A34A']}
            />
            <StatCard
              icon="users"
              value={stats.teamsCount}
              label="Mes équipes"
              gradient={['#3B82F6', '#2563EB']}
            />
            <StatCard
              icon="inbox"
              value={stats.pendingInvitations}
              label="Invitations en attente"
              gradient={['#F59E0B', '#D97706']}
            />
            <StatCard
              icon="award"
              value={stats.totalGoals}
              label="Buts marqués"
              gradient={['#8B5CF6', '#7C3AED']}
            />
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
            Actions rapides
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(action => (
              <QuickAction
                key={action.id}
                icon={action.iconName}
                label={action.title}
                onPress={action.onPress}
                gradient={action.gradient}
              />
            ))}
          </View>
        </View>

        {/* Activité récente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Activité récente
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: COLORS.PRIMARY }]}>
                Tout voir
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {recentActivity.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </View>
        </View>

        {/* Espace en bas pour le FAB */}
        <View style={{ height: 80 }} />
      </Animated.ScrollView>

      {/* Bouton de déconnexion flottant */}
      <TouchableOpacity
        style={styles.logoutFab}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoutFabGradient}
        >
          <Icon name="log-out" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden', // Important pour cacher le contenu qui dépasse
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    // paddingTop est maintenant défini dynamiquement
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.MEDIUM,
  },
  statGradient: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.SMALL,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#6B7280',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.SMALL,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1F2937',
  },
  activityDescription: {
    fontSize: 13,
    marginBottom: 4,
    color: '#6B7280',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoutFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.LARGE,
  },
  logoutFabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
