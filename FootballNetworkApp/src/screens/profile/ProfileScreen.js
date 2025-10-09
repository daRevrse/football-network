// ====== src/screens/profile/ProfileScreen.js ======
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Constantes pour l'animation
const HEADER_MAX_HEIGHT = 340;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Composant StatCard
const StatCard = ({ icon, value, label, color, COLORS }) => (
  <View style={[styles.statCard, { backgroundColor: COLORS.WHITE }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.statValue, { color: COLORS.TEXT_PRIMARY }]}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color: COLORS.TEXT_SECONDARY }]}>
      {label}
    </Text>
  </View>
);

// Composant TeamCard
const TeamCard = ({ team, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.teamCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
  >
    <View
      style={[styles.teamIcon, { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT }]}
    >
      <Icon name="dribbble" size={24} color={COLORS.PRIMARY} />
    </View>
    <View style={styles.teamInfo}>
      <Text style={[styles.teamName, { color: COLORS.TEXT_PRIMARY }]}>
        {team.name}
      </Text>
      <View style={styles.teamMeta}>
        <View style={styles.teamMetaItem}>
          <Icon name="users" size={12} color={COLORS.TEXT_MUTED} />
          <Text style={[styles.teamMetaText, { color: COLORS.TEXT_SECONDARY }]}>
            {team.members} membres
          </Text>
        </View>
        {team.role && (
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor:
                  team.role === 'owner'
                    ? COLORS.PRIMARY_LIGHT
                    : COLORS.WARNING_LIGHT,
              },
            ]}
          >
            <Icon
              name={team.role === 'owner' ? 'star' : 'award'}
              size={10}
              color={team.role === 'owner' ? COLORS.PRIMARY : COLORS.WARNING}
            />
            <Text
              style={[
                styles.roleText,
                {
                  color:
                    team.role === 'owner' ? COLORS.PRIMARY : COLORS.WARNING,
                },
              ]}
            >
              {team.role === 'owner' ? 'Propriétaire' : 'Capitaine'}
            </Text>
          </View>
        )}
      </View>
    </View>
    <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
  </TouchableOpacity>
);

// Composant MatchCard
const MatchCard = ({ match, COLORS }) => (
  <View style={[styles.matchCard, { backgroundColor: COLORS.WHITE }]}>
    <View style={styles.matchHeader}>
      <View style={styles.matchTeams}>
        <Text style={[styles.matchTeamName, { color: COLORS.TEXT_PRIMARY }]}>
          {match.homeTeam}
        </Text>
        <View style={styles.matchScore}>
          <Text style={[styles.matchScoreText, { color: COLORS.TEXT_PRIMARY }]}>
            {match.homeScore}
          </Text>
          <Text style={[styles.matchSeparator, { color: COLORS.TEXT_MUTED }]}>
            -
          </Text>
          <Text style={[styles.matchScoreText, { color: COLORS.TEXT_PRIMARY }]}>
            {match.awayScore}
          </Text>
        </View>
        <Text style={[styles.matchTeamName, { color: COLORS.TEXT_PRIMARY }]}>
          {match.awayTeam}
        </Text>
      </View>
      <View
        style={[
          styles.matchResult,
          {
            backgroundColor:
              match.result === 'win'
                ? COLORS.SUCCESS_LIGHT
                : match.result === 'loss'
                ? COLORS.ERROR_LIGHT
                : COLORS.TEXT_MUTED + '20',
          },
        ]}
      >
        <Text
          style={[
            styles.matchResultText,
            {
              color:
                match.result === 'win'
                  ? COLORS.SUCCESS
                  : match.result === 'loss'
                  ? COLORS.ERROR
                  : COLORS.TEXT_MUTED,
            },
          ]}
        >
          {match.result === 'win' ? 'V' : match.result === 'loss' ? 'D' : 'N'}
        </Text>
      </View>
    </View>
    <View style={styles.matchFooter}>
      <View style={styles.matchMetaItem}>
        <Icon name="calendar" size={12} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.matchMetaText, { color: COLORS.TEXT_SECONDARY }]}>
          {match.date}
        </Text>
      </View>
      <View style={styles.matchMetaItem}>
        <Icon name="map-pin" size={12} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.matchMetaText, { color: COLORS.TEXT_SECONDARY }]}>
          {match.location}
        </Text>
      </View>
    </View>
  </View>
);

// Composant MenuItem
const MenuItem = ({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
  COLORS,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <View
        style={[
          styles.menuIcon,
          {
            backgroundColor: danger
              ? COLORS.ERROR_LIGHT
              : COLORS.PRIMARY_ULTRA_LIGHT,
          },
        ]}
      >
        <Icon
          name={icon}
          size={18}
          color={danger ? COLORS.ERROR : COLORS.PRIMARY}
        />
      </View>
      <Text
        style={[
          styles.menuLabel,
          { color: danger ? COLORS.ERROR : COLORS.TEXT_PRIMARY },
        ]}
      >
        {label}
      </Text>
    </View>
    {value && (
      <Text style={[styles.menuValue, { color: COLORS.TEXT_SECONDARY }]}>
        {value}
      </Text>
    )}
    {showChevron && (
      <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
    )}
  </TouchableOpacity>
);

export const ProfileScreen = ({ navigation }) => {
  const { colors: COLORS, isDark } = useTheme('auto');
  const [refreshing, setRefreshing] = useState(false);

  // Animation du scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // Données mockées (à remplacer par API)
  const [user] = useState({
    id: 1,
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    phone: '+33 6 12 34 56 78',
    position: 'Milieu de terrain',
    skillLevel: 'intermediate',
    city: 'Paris',
    joinedDate: 'Janvier 2024',
    totalMatches: 47,
    wins: 28,
    goals: 12,
    assists: 18,
  });

  const [teams] = useState([
    {
      id: 1,
      name: 'Les Tigres de Paris',
      members: 11,
      role: 'owner',
    },
    {
      id: 2,
      name: 'FC Montmartre',
      members: 9,
      role: 'captain',
    },
    {
      id: 3,
      name: 'Racing Club 75',
      members: 15,
      role: null,
    },
  ]);

  const [recentMatches] = useState([
    {
      id: 1,
      homeTeam: 'Les Tigres',
      awayTeam: 'FC Olympique',
      homeScore: 3,
      awayScore: 2,
      result: 'win',
      date: '15 Mar 2024',
      location: 'Paris 15e',
    },
    {
      id: 2,
      homeTeam: 'Racing Club',
      awayTeam: 'Les Tigres',
      homeScore: 1,
      awayScore: 1,
      result: 'draw',
      date: '08 Mar 2024',
      location: 'Paris 18e',
    },
    {
      id: 3,
      homeTeam: 'Les Tigres',
      awayTeam: 'AS Montparnasse',
      homeScore: 0,
      awayScore: 2,
      result: 'loss',
      date: '01 Mar 2024',
      location: 'Paris 14e',
    },
  ]);

  // Animations du header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.6],
    extrapolate: 'clamp',
  });

  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const userInfoOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleFontSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [24, 16],
    extrapolate: 'clamp',
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleEditProfile = () => {
    Alert.alert('Info', 'Fonctionnalité en développement');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleNotifications = () => {
    Alert.alert('Info', 'Fonctionnalité en développement');
  };

  const handlePrivacy = () => {
    Alert.alert('Info', 'Fonctionnalité en développement');
  };

  const handleHelp = () => {
    Alert.alert('Info', 'Fonctionnalité en développement');
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => {} },
    ]);
  };

  const getSkillLevelLabel = () => {
    const labels = {
      beginner: 'Débutant',
      amateur: 'Amateur',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert',
    };
    return labels[user.skillLevel] || 'Non défini';
  };

  const getSkillLevelColor = () => {
    const colors = {
      beginner: '#94A3B8',
      amateur: '#3B82F6',
      intermediate: '#F59E0B',
      advanced: '#EF4444',
      expert: '#8B5CF6',
    };
    return colors[user.skillLevel] || '#6B7280';
  };

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header Animé */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: COLORS.PRIMARY,
            height: headerHeight,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSettings}
          >
            <Icon name="settings" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEditProfile}
          >
            <Icon name="edit-2" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Animated.View
            style={[
              styles.avatar,
              {
                transform: [
                  { scale: avatarScale },
                  { translateY: avatarTranslateY },
                ],
              },
            ]}
          >
            <Icon name="user" size={40} color={COLORS.WHITE} />
          </Animated.View>

          <Animated.Text
            style={[
              styles.userName,
              {
                fontSize: titleFontSize,
              },
            ]}
          >
            {user.name}
          </Animated.Text>

          <Animated.View
            style={[
              styles.userInfo,
              {
                opacity: userInfoOpacity,
              },
            ]}
          >
            <View style={styles.userInfoRow}>
              <Icon name="target" size={14} color={COLORS.WHITE} />
              <Text style={styles.userInfoText}>{user.position}</Text>
            </View>
            <View style={styles.userInfoRow}>
              <Icon name="map-pin" size={14} color={COLORS.WHITE} />
              <Text style={styles.userInfoText}>{user.city}</Text>
            </View>
            <View
              style={[
                styles.skillBadge,
                { backgroundColor: getSkillLevelColor() },
              ]}
            >
              <Icon name="star" size={12} color="#FFFFFF" />
              <Text style={styles.skillBadgeText}>{getSkillLevelLabel()}</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="calendar"
            value={user.totalMatches}
            label="Matchs"
            color={COLORS.PRIMARY}
            COLORS={COLORS}
          />
          <StatCard
            icon="award"
            value={user.wins}
            label="Victoires"
            color={COLORS.SUCCESS}
            COLORS={COLORS}
          />
          <StatCard
            icon="target"
            value={user.goals}
            label="Buts"
            color={COLORS.SECONDARY}
            COLORS={COLORS}
          />
          <StatCard
            icon="zap"
            value={user.assists}
            label="Passes D."
            color={COLORS.WARNING}
            COLORS={COLORS}
          />
        </View>

        {/* Mes Équipes */}
        <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.sectionHeader}>
            <Icon name="users" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Mes Équipes
            </Text>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
              ]}
              onPress={() => navigation.navigate('CreateTeam')}
            >
              <Icon name="plus" size={16} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.teamsList}>
            {teams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                onPress={() =>
                  navigation.navigate('TeamDetail', {
                    teamId: team.id,
                    teamName: team.name,
                  })
                }
                COLORS={COLORS}
              />
            ))}
          </View>
        </View>

        {/* Matchs Récents */}
        <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.sectionHeader}>
            <Icon name="activity" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Matchs Récents
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: COLORS.PRIMARY }]}>
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.matchesList}>
            {recentMatches.map(match => (
              <MatchCard key={match.id} match={match} COLORS={COLORS} />
            ))}
          </View>
        </View>

        {/* Paramètres */}
        <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.sectionHeader}>
            <Icon name="settings" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Paramètres
            </Text>
          </View>

          <View style={styles.menuList}>
            <MenuItem
              icon="bell"
              label="Notifications"
              onPress={handleNotifications}
              COLORS={COLORS}
            />
            <MenuItem
              icon="lock"
              label="Confidentialité"
              onPress={handlePrivacy}
              COLORS={COLORS}
            />
            <MenuItem
              icon="help-circle"
              label="Aide & Support"
              onPress={handleHelp}
              COLORS={COLORS}
            />
            <MenuItem
              icon="info"
              label="À propos"
              value="v1.0.0"
              showChevron={false}
              COLORS={COLORS}
            />
            <MenuItem
              icon="log-out"
              label="Déconnexion"
              onPress={handleLogout}
              danger={true}
              showChevron={false}
              COLORS={COLORS}
            />
          </View>
        </View>
      </Animated.ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: DIMENSIONS.SPACING_LG,
    ...SHADOWS.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    marginBottom: DIMENSIONS.SPACING_MD,
    gap: DIMENSIONS.SPACING_SM,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    fontWeight: FONTS.WEIGHT.BOLD,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  userInfo: {
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
  },
  userInfoText: {
    fontSize: FONTS.SIZE.SM,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_XS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XS,
    marginTop: DIMENSIONS.SPACING_XS,
  },
  skillBadgeText: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + DIMENSIONS.SPACING_SM,
    padding: DIMENSIONS.CONTAINER_PADDING,
    paddingBottom: DIMENSIONS.SPACING_XXL,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  statCard: {
    flex: 1,
    padding: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  statValue: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONTS.SIZE.XXS,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    textAlign: 'center',
  },
  section: {
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginBottom: DIMENSIONS.SPACING_LG,
    ...SHADOWS.SMALL,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginLeft: DIMENSIONS.SPACING_SM,
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  teamsList: {
    gap: DIMENSIONS.SPACING_SM,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
  },
  teamMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  teamMetaText: {
    fontSize: FONTS.SIZE.XS,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: 2,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XXS,
  },
  roleText: {
    fontSize: FONTS.SIZE.XXS,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  matchesList: {
    gap: DIMENSIONS.SPACING_SM,
  },
  matchCard: {
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  matchTeams: {
    flex: 1,
    alignItems: 'center',
  },
  matchTeamName: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    textAlign: 'center',
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    marginVertical: DIMENSIONS.SPACING_XS,
  },
  matchScoreText: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  matchSeparator: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  matchResult: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchResultText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  matchFooter: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_MD,
    paddingTop: DIMENSIONS.SPACING_SM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  matchMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  matchMetaText: {
    fontSize: FONTS.SIZE.XS,
  },
  menuList: {
    gap: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_MD,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  menuLabel: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  menuValue: {
    fontSize: FONTS.SIZE.SM,
    marginRight: DIMENSIONS.SPACING_SM,
  },
});
