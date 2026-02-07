/**
 * RefereeDashboardScreen - Dashboard Arbitre Premium
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
import { logout } from '../../store/slices/authSlice';
import { useFocusEffect } from '@react-navigation/native';
import { matchesApi } from '../../services/api/matchesApi';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Composant QuickAction pour arbitre
const QuickAction = ({ icon, label, onPress, color = COLORS.ROLE_REFEREE }) => (
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

// Badge de statut de match
const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'pending':
        return { bg: `${COLORS.WARNING}20`, color: COLORS.WARNING, label: 'En attente' };
      case 'confirmed':
        return { bg: `${COLORS.INFO}20`, color: COLORS.INFO, label: 'Confirmé' };
      case 'in_progress':
        return { bg: `${COLORS.SUCCESS}20`, color: COLORS.SUCCESS, label: 'En cours' };
      case 'completed':
        return { bg: `${COLORS.TEXT_MUTED}20`, color: COLORS.TEXT_MUTED, label: 'Terminé' };
      default:
        return { bg: `${COLORS.TEXT_MUTED}20`, color: COLORS.TEXT_MUTED, label: status };
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* HEADER DYNAMIQUE */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[COLORS.ROLE_REFEREE, '#5E1A7B', COLORS.DARK]}
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
                {stats.toValidate > 0 && <View style={styles.badge} />}
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
                {user?.firstName?.[0] || 'A'}
                {user?.lastName?.[0] || 'R'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bienvenue,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Arbitre'}</Text>
              <View style={styles.roleBadge}>
                <Icon name="flag" size={12} color={COLORS.ROLE_REFEREE} />
                <Text style={styles.userRole}>Arbitre</Text>
              </View>
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
            tintColor={COLORS.ROLE_REFEREE}
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
            color={COLORS.ROLE_REFEREE}
            onPress={() => navigation.navigate('Matches')}
          />
          <QuickAction
            icon="check-square"
            label="À Valider"
            color={COLORS.INFO}
            onPress={() => navigation.navigate('Matches')}
          />
          <QuickAction
            icon="bar-chart-2"
            label="Stats"
            color={COLORS.SUCCESS}
            onPress={() => navigation.navigate('Profile')}
          />
          <QuickAction
            icon="user"
            label="Profil"
            color={COLORS.WARNING}
            onPress={() => navigation.navigate('Profile')}
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
            <ActivityIndicator color={COLORS.ROLE_REFEREE} size="large" />
          </View>
        ) : upcomingMatches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="calendar" size={32} color={COLORS.TEXT_MUTED} />
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
                    {formatDate(match.matchDate).split(' ')[1]?.toUpperCase() || ''}
                  </Text>
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTeams} numberOfLines={1}>
                    {match.homeTeam?.name || 'Équipe A'} vs{' '}
                    {match.awayTeam?.name || 'Équipe B'}
                  </Text>
                  <View style={styles.matchMetaRow}>
                    <Icon name="map-pin" size={12} color={COLORS.WHITE} style={{ opacity: 0.7 }} />
                    <Text style={styles.matchMeta} numberOfLines={1}>
                      {match.location?.name || 'Lieu non défini'}
                    </Text>
                    <Icon
                      name="clock"
                      size={12}
                      color={COLORS.WHITE}
                      style={{ marginLeft: 8, opacity: 0.7 }}
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
                <Icon name="alert-circle" size={24} color={COLORS.ERROR} />
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
              <Icon name="chevron-right" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
          </>
        )}

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
    borderColor: COLORS.ROLE_REFEREE,
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
    backgroundColor: `${COLORS.ROLE_REFEREE}30`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 4,
    gap: 4,
  },
  userRole: {
    fontSize: 12,
    color: COLORS.WHITE,
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
    color: COLORS.ROLE_REFEREE,
    fontWeight: '600',
  },

  // LOADING
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  // EMPTY CARD
  emptyCard: {
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.7,
    marginTop: 12,
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
    backgroundColor: COLORS.ROLE_REFEREE,
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
    marginRight: 8,
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

  // STATUS BADGE
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
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
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  validateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.ERROR}15`,
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
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  validateDesc: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.7,
  },
});

export default RefereeDashboardScreen;
