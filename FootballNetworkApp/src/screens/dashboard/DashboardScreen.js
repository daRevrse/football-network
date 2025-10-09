// ====== src/screens/dashboard/DashboardScreen.js ======
import React, { useRef } from 'react';
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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';
import { logout } from '../../store/slices/authSlice';

const HEADER_MAX_HEIGHT = 120;
const HEADER_MIN_HEIGHT = 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

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

  const [refreshing, setRefreshing] = React.useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Thème dynamique
  const { colors: COLORS, isDark } = useTheme('auto'); // 'auto', 'light', 'dark', ou 'time'

  const onRefresh = React.useCallback(() => {
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
    matchesThisWeek: 2,
    teamsCount: myTeams.length || 0,
    pendingInvitations:
      invitations.filter(inv => inv.status === 'pending').length || 0,
  };

  const quickActions = [
    {
      id: 'create-match',
      title: 'Créer un match',
      iconName: 'calendar',
      color: COLORS.PRIMARY,
      onPress: () => Alert.alert('Info', 'Fonctionnalité en développement'),
    },
    {
      id: 'find-team',
      title: 'Trouver une équipe',
      iconName: 'search',
      color: COLORS.SECONDARY,
      onPress: () => Alert.alert('Info', 'Fonctionnalité en développement'),
    },
    {
      id: 'create-team',
      title: 'Créer une équipe',
      iconName: 'users',
      color: COLORS.SUCCESS,
      onPress: () => navigation.navigate('Teams', { screen: 'CreateTeam' }),
    },
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'match_invitation',
      title: 'Nouvelle invitation de match',
      description: 'FC Barcelone vs Real Madrid',
      time: 'Il y a 2h',
      status: 'pending',
      iconName: 'mail',
    },
    {
      id: '2',
      type: 'team_update',
      title: "Nouveau membre dans l'équipe",
      description: 'Jean Dupont a rejoint Les Tigres',
      time: 'Il y a 4h',
      status: 'info',
      iconName: 'user-plus',
    },
  ];

  // Animations du header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const appNameSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [24, 18],
    extrapolate: 'clamp',
  });

  const iconSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [24, 20],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.PRIMARY}
      />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          { height: headerHeight, backgroundColor: COLORS.PRIMARY },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.appNameContainer}>
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: iconSize.interpolate({
                        inputRange: [18, 24],
                        outputRange: [0.75, 1],
                      }),
                    },
                  ],
                }}
              >
                <Icon name="dribbble" size={24} color={COLORS.BLACK} />
              </Animated.View>
              <Animated.Text
                style={[styles.appName, { fontSize: appNameSize }]}
              >
                FootConnect
              </Animated.Text>
            </View>
            {/* <Animated.Text
              style={[styles.subGreeting, { opacity: headerOpacity }]}
            >
              Bienvenue {user?.firstName || 'Joueur'}
            </Animated.Text> */}
          </View>

          <View style={styles.headerRight}>
            {/* Notifications */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() =>
                Alert.alert('Notifications', 'Fonctionnalité en développement')
              }
            >
              <Icon name="bell" size={22} color={COLORS.BLACK} />
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: COLORS.ERROR,
                      borderColor: COLORS.PRIMARY,
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Icon name="log-out" size={24} color={COLORS.BLACK} />
              {/* <Text style={styles.logoutText}>Déconnexion</Text> */}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Matchs cette semaine"
            value={stats.matchesThisWeek}
            iconName="dribbble"
            color={COLORS.PRIMARY}
            bgColor={COLORS.WHITE}
            textColor={COLORS.TEXT_PRIMARY}
            subtextColor={COLORS.TEXT_SECONDARY}
          />
          <StatCard
            title="Mes équipes"
            value={stats.teamsCount}
            iconName="users"
            color={COLORS.SUCCESS}
            bgColor={COLORS.WHITE}
            textColor={COLORS.TEXT_PRIMARY}
            subtextColor={COLORS.TEXT_SECONDARY}
          />
          <StatCard
            title="Invitations"
            value={stats.pendingInvitations}
            iconName="inbox"
            color={COLORS.WARNING}
            bgColor={COLORS.WHITE}
            textColor={COLORS.TEXT_PRIMARY}
            subtextColor={COLORS.TEXT_SECONDARY}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
            Actions rapides
          </Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: COLORS.WHITE }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: action.color + '20' },
                  ]}
                >
                  <Icon name={action.iconName} size={24} color={action.color} />
                </View>
                <Text
                  style={[styles.actionTitle, { color: COLORS.TEXT_PRIMARY }]}
                >
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
            Activité récente
          </Text>

          {recentActivity.length > 0 ? (
            recentActivity.map(activity => (
              <TouchableOpacity
                key={activity.id}
                style={[styles.activityCard, { backgroundColor: COLORS.WHITE }]}
                activeOpacity={0.7}
              >
                <View style={styles.activityLeft}>
                  <View
                    style={[
                      styles.activityIcon,
                      {
                        backgroundColor:
                          activity.status === 'pending'
                            ? COLORS.WARNING_LIGHT
                            : COLORS.SUCCESS_LIGHT,
                      },
                    ]}
                  >
                    <Icon
                      name={activity.iconName}
                      size={20}
                      color={
                        activity.status === 'pending'
                          ? COLORS.WARNING
                          : COLORS.SUCCESS
                      }
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text
                      style={[
                        styles.activityTitle,
                        { color: COLORS.TEXT_PRIMARY },
                      ]}
                    >
                      {activity.title}
                    </Text>
                    <Text
                      style={[
                        styles.activityDescription,
                        { color: COLORS.TEXT_SECONDARY },
                      ]}
                    >
                      {activity.description}
                    </Text>
                    <Text
                      style={[
                        styles.activityTime,
                        { color: COLORS.TEXT_MUTED },
                      ]}
                    >
                      {activity.time}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        activity.status === 'pending'
                          ? COLORS.WARNING
                          : COLORS.SUCCESS,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View
              style={[styles.emptyState, { backgroundColor: COLORS.WHITE }]}
            >
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: COLORS.BACKGROUND_LIGHT },
                ]}
              >
                <Icon name="activity" size={48} color={COLORS.TEXT_MUTED} />
              </View>
              <Text style={[styles.emptyTitle, { color: COLORS.TEXT_PRIMARY }]}>
                Aucune activité récente
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: COLORS.TEXT_SECONDARY },
                ]}
              >
                Commencez par créer une équipe ou chercher des adversaires !
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

// Composant StatCard
const StatCard = ({
  title,
  value,
  iconName,
  color,
  bgColor,
  textColor,
  subtextColor,
}) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Icon name={iconName} size={24} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: subtextColor }]}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    justifyContent: 'flex-end',
    paddingBottom: DIMENSIONS.SPACING_SM,
    ...SHADOWS.MEDIUM,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  appName: {
    color: '#FFFFFF',
    fontWeight: FONTS.WEIGHT.BOLD,
    marginLeft: DIMENSIONS.SPACING_SM,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: FONTS.SIZE.SM,
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: DIMENSIONS.SPACING_SM,
    marginRight: DIMENSIONS.SPACING_XS,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: FONTS.SIZE.XXS,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_XS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    // borderWidth: 1,
    // borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginLeft: DIMENSIONS.SPACING_XXS,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingVertical: DIMENSIONS.SPACING_LG,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACING_LG,
    gap: DIMENSIONS.SPACING_SM,
  },
  statCard: {
    flex: 1,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_MD,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  statValue: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  statTitle: {
    fontSize: FONTS.SIZE.XS,
    textAlign: 'center',
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  section: {
    marginBottom: DIMENSIONS.SPACING_XL,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DIMENSIONS.SPACING_SM,
  },
  actionCard: {
    flex: 1,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_MD,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  actionTitle: {
    fontSize: FONTS.SIZE.SM,
    textAlign: 'center',
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_MD,
    marginBottom: DIMENSIONS.SPACING_SM,
    ...SHADOWS.SMALL,
  },
  activityLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  activityDescription: {
    fontSize: FONTS.SIZE.SM,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  activityTime: {
    fontSize: FONTS.SIZE.XS,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: DIMENSIONS.SPACING_SM,
  },
  emptyState: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_XL,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  emptyTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_SM,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: FONTS.SIZE.MD,
    textAlign: 'center',
    lineHeight: FONTS.SIZE.MD * FONTS.LINE_HEIGHT.RELAXED,
  },
});
