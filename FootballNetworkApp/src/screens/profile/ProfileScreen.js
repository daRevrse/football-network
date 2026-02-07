/**
 * ProfileScreen - Profil utilisateur premium
 * Design Foot Connect avec textes blancs
 */

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
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserApi } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import { API_CONFIG } from '../../utils/constants';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 320;

// StatCard component
const StatCard = ({ icon, value, label, color }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value || 0}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// QuickAction component
const QuickAction = ({ icon, label, onPress, color = COLORS.PRIMARY }) => (
  <TouchableOpacity
    style={styles.quickAction}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.quickActionIcon, { borderColor: color, backgroundColor: `${color}10` }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// MenuItem component
const MenuItem = ({ icon, label, onPress, color = COLORS.WHITE, danger = false }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.menuItemIcon, { backgroundColor: danger ? `${COLORS.ERROR}15` : `${color}10` }]}>
      <Icon name={icon} size={20} color={danger ? COLORS.ERROR : color} />
    </View>
    <Text style={[styles.menuItemLabel, danger && { color: COLORS.ERROR }]}>{label}</Text>
    <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
  </TouchableOpacity>
);

export const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    matchesCount: 0,
    winsCount: 0,
    teamsCount: 0,
    winRate: 0,
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

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Es-tu sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

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

  const getPositionLabel = (position) => {
    const positions = {
      goalkeeper: 'Gardien',
      defender: 'Défenseur',
      midfielder: 'Milieu',
      forward: 'Attaquant',
      any: 'Polyvalent',
    };
    return positions[position] || position || 'Non défini';
  };

  const getSkillLabel = (skill) => {
    const skills = {
      beginner: 'Débutant',
      amateur: 'Amateur',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
    };
    return skills[skill] || skill || 'Non défini';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

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
          colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK, COLORS.DARK]}
          style={styles.headerGradient}
        >
          {/* Top Row */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="settings" size={22} color={COLORS.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={22} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {user?.profilePictureUrl ? (
                <Image
                  source={{
                    uri: API_CONFIG.BASE_URL.replace('/api', '') + user.profilePictureUrl,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {user?.firstName?.[0] || 'U'}
                    {user?.lastName?.[0] || ''}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.editBadge}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Icon name="edit-2" size={14} color={COLORS.WHITE} />
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>
              {user?.firstName || 'Utilisateur'} {user?.lastName || ''}
            </Text>
            <Text style={styles.position}>
              {getPositionLabel(user?.position)} • {user?.locationCity || 'Ville non définie'}
            </Text>

            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{getSkillLabel(user?.skillLevel)}</Text>
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
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="activity"
            value={stats.matchesCount}
            label="Matchs"
            color={COLORS.INFO}
          />
          <StatCard
            icon="trophy"
            value={stats.winsCount}
            label="Victoires"
            color={COLORS.SUCCESS}
          />
          <StatCard
            icon="shield"
            value={stats.teamsCount}
            label="Équipes"
            color={COLORS.WARNING}
          />
          <StatCard
            icon="zap"
            value={`${stats.winRate || 0}%`}
            label="Winrate"
            color={COLORS.ROLE_REFEREE}
          />
        </View>

        {/* Actions rapides */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.menuGrid}>
          <QuickAction
            icon="user"
            label="Modifier"
            onPress={() => navigation.navigate('EditProfile')}
            color={COLORS.INFO}
          />
          <QuickAction
            icon="shield"
            label="Confidentialité"
            onPress={() => navigation.navigate('Privacy')}
            color={COLORS.ROLE_REFEREE}
          />
          <QuickAction
            icon="help-circle"
            label="Aide"
            onPress={() => navigation.navigate('Help')}
            color={COLORS.WARNING}
          />
          <QuickAction
            icon="share-2"
            label="Partager"
            onPress={() => Alert.alert('Partager', 'Fonctionnalité à venir')}
            color={COLORS.SUCCESS}
          />
        </View>

        {/* Menu */}
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.menuContainer}>
          <MenuItem
            icon="bell"
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            color={COLORS.INFO}
          />
          <MenuItem
            icon="lock"
            label="Confidentialité"
            onPress={() => navigation.navigate('Privacy')}
            color={COLORS.ROLE_REFEREE}
          />
          <MenuItem
            icon="help-circle"
            label="Centre d'aide"
            onPress={() => navigation.navigate('Help')}
            color={COLORS.WARNING}
          />
          <MenuItem
            icon="info"
            label="À propos"
            onPress={() => Alert.alert('Foot Connect', 'Version 1.0.0')}
            color={COLORS.TEXT_SECONDARY}
          />
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LinearGradient
            colors={['rgba(255, 61, 0, 0.1)', 'rgba(255, 61, 0, 0.05)']}
            style={styles.logoutGradient}
          >
            <Icon name="log-out" size={20} color={COLORS.ERROR} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>Foot Connect v1.0.0</Text>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
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
    borderColor: COLORS.PRIMARY_LIGHT,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.PRIMARY_LIGHT,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.WHITE,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.INFO,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.DARK,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.WHITE,
  },
  position: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.8,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(0, 123, 64, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 87, 0.3)',
  },
  tagText: {
    color: COLORS.PRIMARY_LIGHT,
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
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.WHITE,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginBottom: 16,
  },
  menuGrid: {
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
    borderRadius: 18,
    backgroundColor: COLORS.DARK_CARD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  menuContainer: {
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.WHITE,
  },
  logoutButton: {
    marginBottom: 16,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.2)',
    borderRadius: RADIUS.lg,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ERROR,
  },
  footer: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProfileScreen;
