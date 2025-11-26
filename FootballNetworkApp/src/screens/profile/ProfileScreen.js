// ====== src/screens/profile/ProfileScreen.js ======
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
import { UserApi } from '../../services/api';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';
import { SHADOWS } from '../../styles/theme';
import { logout } from '../../store/slices/authSlice';
import { API_CONFIG } from '../../utils/constants';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 340;

// Thème Dark
const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  SURFACE_LIGHT: '#334155',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  DANGER: '#EF4444',
};

// StatCard "Neon Block"
const StatCard = ({ icon, value, label, color }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// QuickAction "Dark Button"
const QuickAction = ({ icon, label, onPress, color = THEME.ACCENT }) => (
  <TouchableOpacity
    style={styles.quickAction}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.quickActionIcon, { borderColor: color }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

export const ProfileScreen = ({ navigation }) => {
  const { logoutUser } = useAuthImproved();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
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
      if (profileResult.success) setUser(profileResult.data);

      const statsResult = await UserApi.getStats();
      if (statsResult.success) setStats(statsResult.data);

      console.log('profileResult', profileResult);
      console.log('statsResult', statsResult);
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

  // Animations
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 2],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['#14532d', '#0F172A']}
          style={styles.headerGradient}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="settings" size={22} color={THEME.TEXT} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={22} color={THEME.TEXT} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {user?.profilePictureUrl ? (
                <Image
                  source={{
                    uri:
                      API_CONFIG.BASE_URL.replace('/api', '') +
                      user.profilePictureUrl,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.editBadge}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Icon name="edit-2" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.position}>
              {user?.position?.toUpperCase()} • {user?.locationCity}
            </Text>

            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {user?.skillLevel || 'Niveau ?'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* CONTENT */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.ACCENT}
          />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="activity"
            value={stats.matchesCount}
            label="Matchs"
            color="#3B82F6"
          />
          <StatCard
            icon="trophy"
            value={stats.winsCount}
            label="Victoires"
            color={THEME.ACCENT}
          />
          <StatCard
            icon="shield"
            value={stats.teamsCount}
            label="Equipes"
            color="#F59E0B"
          />
          <StatCard
            icon="zap"
            value={stats.winRate}
            label="Winrate %"
            color="#8B5CF6"
          />
        </View>

        {/* Menu Rapide */}
        <Text style={styles.sectionTitle}>Menu Principal</Text>
        <View style={styles.menuGrid}>
          <QuickAction
            icon="user"
            label="Modifier"
            onPress={() => navigation.navigate('EditProfile')}
            color="#3B82F6"
          />
          <QuickAction
            icon="shield"
            label="Confidentialité"
            onPress={() => navigation.navigate('Privacy')}
            color="#8B5CF6"
          />
          <QuickAction
            icon="help-circle"
            label="Support"
            onPress={() => navigation.navigate('Help')}
            color="#F59E0B"
          />
          <QuickAction
            icon="power"
            label="Déconnexion"
            color={THEME.DANGER}
            onPress={() =>
              Alert.alert('Déconnexion', 'Quitter ?', [
                { text: 'Non', style: 'cancel' },
                {
                  text: 'Oui',
                  style: 'destructive',
                  onPress: () => dispatch(logout()),
                },
              ])
            }
          />
        </View>

        {/* Espace pour le scroll */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BG,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.DANGER,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: THEME.ACCENT,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: THEME.ACCENT,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.ACCENT,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.BG,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  position: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  tagText: {
    color: THEME.ACCENT,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT + 20,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.TEXT,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    borderWidth: 1,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
  },
});
