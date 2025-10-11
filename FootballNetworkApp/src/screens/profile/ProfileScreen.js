// ====== src/screens/profile/ProfileScreen.js - NOUVEAU DESIGN ======
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Image,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { UserApi } from '../../services/api';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

// Composant StatCard moderne
const StatCard = ({ icon, value, label, gradient, COLORS }) => (
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

// Composant TeamCard moderne
const TeamCard = ({ team, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.teamCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <LinearGradient
      colors={['#22C55E15', '#22C55E05']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.teamGradientBg}
    >
      <View style={styles.teamIconContainer}>
        <Icon name="shield" size={28} color="#22C55E" />
      </View>
      <View style={styles.teamInfo}>
        <Text style={[styles.teamName, { color: COLORS.TEXT_PRIMARY }]}>
          {team.name}
        </Text>
        <View style={styles.teamMeta}>
          <View style={styles.teamMetaItem}>
            <Icon name="users" size={14} color={COLORS.TEXT_MUTED} />
            <Text
              style={[styles.teamMetaText, { color: COLORS.TEXT_SECONDARY }]}
            >
              {team.members} membres
            </Text>
          </View>
          {team.role && (
            <View style={styles.roleBadge}>
              <Icon
                name={team.role === 'owner' ? 'crown' : 'award'}
                size={12}
                color="#F59E0B"
              />
              <Text style={styles.roleText}>
                {team.role === 'owner' ? 'Capitaine' : 'Membre'}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Icon name="chevron-right" size={24} color={COLORS.TEXT_MUTED} />
    </LinearGradient>
  </TouchableOpacity>
);

// Composant QuickAction
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

export const ProfileScreen = ({ navigation }) => {
  const { colors: COLORS } = useTheme('auto');
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    wins: 0,
    goals: 0,
    assists: 0,
  });

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profileResult = await UserApi.getProfile();
      if (profileResult.success) {
        setUser(profileResult.data);
      }

      const statsResult = await UserApi.getStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, []);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const getPositionLabel = position => {
    const positions = {
      goalkeeper: 'Gardien',
      defender: 'Défenseur',
      midfielder: 'Milieu',
      forward: 'Attaquant',
      any: 'Polyvalent',
    };
    return positions[position] || position;
  };

  const getSkillLevelLabel = level => {
    const levels = {
      beginner: 'Débutant',
      amateur: 'Amateur',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      semi_pro: 'Semi-pro',
    };
    return levels[level] || level;
  };

  if (loading && !user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec Gradient */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
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
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="settings" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={22} color="#FFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarContainer}>
            {user?.profilePicture || user?.avatar ? (
              <Image
                source={{ uri: user.profilePicture || user.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="user" size={48} color="#FFF" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Icon name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {user?.position && (
            <View style={styles.badgesContainer}>
              <View style={styles.badge}>
                <Icon name="target" size={12} color="#FFF" />
                <Text style={styles.badgeText}>
                  {getPositionLabel(user.position)}
                </Text>
              </View>
              {user?.skillLevel && (
                <View style={styles.badge}>
                  <Icon name="award" size={12} color="#FFF" />
                  <Text style={styles.badgeText}>
                    {getSkillLevelLabel(user.skillLevel)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Contenu scrollable */}
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
            tintColor="#22C55E"
          />
        }
      >
        {/* Statistiques */}
        <View style={styles.statsSection}>
          <StatCard
            icon="target"
            value={stats.totalMatches}
            label="Matchs"
            gradient={['#8B5CF6', '#7C3AED']}
            COLORS={COLORS}
          />
          <StatCard
            icon="trophy"
            value={stats.wins}
            label="Victoires"
            gradient={['#22C55E', '#16A34A']}
            COLORS={COLORS}
          />
          <StatCard
            icon="zap"
            value={stats.goals}
            label="Buts"
            gradient={['#F59E0B', '#D97706']}
            COLORS={COLORS}
          />
          <StatCard
            icon="award"
            value={stats.assists}
            label="Passes D."
            gradient={['#3B82F6', '#2563EB']}
            COLORS={COLORS}
          />
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActionsSection}>
          <QuickAction
            icon="edit-3"
            label="Modifier"
            onPress={() => navigation.navigate('EditProfile')}
            gradient={['#22C55E', '#16A34A']}
          />
          <QuickAction
            icon="shield"
            label="Confidentialité"
            onPress={() => navigation.navigate('Privacy')}
            gradient={['#3B82F6', '#2563EB']}
          />
          <QuickAction
            icon="help-circle"
            label="Aide"
            onPress={() => navigation.navigate('Help')}
            gradient={['#F59E0B', '#D97706']}
          />
          <QuickAction
            icon="log-out"
            label="Déconnexion"
            onPress={() => {
              Alert.alert(
                'Déconnexion',
                'Voulez-vous vraiment vous déconnecter ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: () => navigation.navigate('Auth'),
                  },
                ],
              );
            }}
            gradient={['#EF4444', '#DC2626']}
          />
        </View>

        {/* Section Mes équipes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Mes équipes
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Teams')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {teams.length > 0 ? (
            teams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                onPress={() =>
                  navigation.navigate('Teams', {
                    screen: 'TeamDetail',
                    params: { teamId: team.id },
                  })
                }
                COLORS={COLORS}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#F3F4F620', '#F3F4F610']}
                style={styles.emptyStateGradient}
              >
                <Icon name="users" size={56} color="#CBD5E1" />
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: COLORS.TEXT_SECONDARY },
                  ]}
                >
                  Aucune équipe pour le moment
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('Teams')}
                >
                  <LinearGradient
                    colors={['#22C55E', '#16A34A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyStateButtonGradient}
                  >
                    <Icon name="plus" size={18} color="#FFF" />
                    <Text style={styles.emptyStateButtonText}>
                      Rejoindre une équipe
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    height: HEADER_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 18,
    height: 18,
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#22C55E',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    marginTop: HEADER_HEIGHT - 40,
  },
  scrollContent: {
    paddingTop: 20,
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 44) / 2,
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
  },
  quickActionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
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
    color: '#6B7280',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
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
    color: '#22C55E',
    fontWeight: '600',
  },
  teamCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOWS.SMALL,
  },
  teamGradientBg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  teamIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#22C55E15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teamMetaText: {
    fontSize: 13,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
