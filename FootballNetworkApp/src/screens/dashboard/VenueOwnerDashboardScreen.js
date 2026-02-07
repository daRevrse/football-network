/**
 * VenueOwnerDashboardScreen - Dashboard Propriétaire Premium
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
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Composant QuickAction pour venue owner
const QuickAction = ({ icon, label, onPress, color = COLORS.ROLE_VENUE_OWNER }) => (
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

// Composant BookingCard
const BookingCard = ({ booking, onApprove, onReject, onPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'manager_confirmed': return COLORS.INFO;
      case 'confirmed': return COLORS.SUCCESS;
      case 'cancelled': return COLORS.ERROR;
      default: return COLORS.TEXT_MUTED;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'manager_confirmed': return 'Manager OK';
      case 'confirmed': return 'Confirmée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  return (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingDateBox}>
          <Text style={styles.bookingDay}>
            {booking.day || new Date(booking.date).getDate()}
          </Text>
          <Text style={styles.bookingMonth}>
            {booking.month || new Date(booking.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
          </Text>
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTeam}>{booking.teamName || 'Équipe'}</Text>
          <View style={styles.bookingMetaRow}>
            <Icon name="clock" size={12} color={COLORS.WHITE} style={{ opacity: 0.7 }} />
            <Text style={styles.bookingMeta}>
              {booking.startTime || '18:00'} - {booking.endTime || '20:00'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {getStatusLabel(booking.status)}
            </Text>
          </View>
        </View>
      </View>
      {booking.status === 'manager_confirmed' && (
        <View style={styles.bookingActions}>
          <TouchableOpacity
            style={[styles.bookingActionBtn, styles.rejectBtn]}
            onPress={() => onReject && onReject(booking)}
          >
            <Icon name="x" size={16} color={COLORS.ERROR} />
            <Text style={[styles.bookingActionText, { color: COLORS.ERROR }]}>Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bookingActionBtn, styles.approveBtn]}
            onPress={() => onApprove && onApprove(booking)}
          >
            <Icon name="check" size={16} color={COLORS.SUCCESS} />
            <Text style={[styles.bookingActionText, { color: COLORS.SUCCESS }]}>Approuver</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const VenueOwnerDashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  // État pour les stats dynamiques
  const [stats, setStats] = useState({
    totalVenues: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    todayBookings: 0,
  });
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Charger les données
  const loadData = async () => {
    try {
      // TODO: Connecter avec l'API réelle
      // Données de démonstration
      const mockVenues = [
        { id: 1, name: 'Stade Municipal', city: 'Paris', bookingsCount: 12 },
        { id: 2, name: 'Terrain Synthétique', city: 'Lyon', bookingsCount: 8 },
      ];

      const mockBookings = [
        {
          id: 1,
          teamName: 'FC Étoiles',
          date: new Date(),
          day: '15',
          month: 'FÉV',
          startTime: '18:00',
          endTime: '20:00',
          status: 'manager_confirmed',
          venueName: 'Stade Municipal',
        },
        {
          id: 2,
          teamName: 'AS Dynamique',
          date: new Date(Date.now() + 86400000),
          day: '16',
          month: 'FÉV',
          startTime: '14:00',
          endTime: '16:00',
          status: 'pending',
          venueName: 'Stade Municipal',
        },
        {
          id: 3,
          teamName: 'Racing Club',
          date: new Date(Date.now() + 172800000),
          day: '17',
          month: 'FÉV',
          startTime: '10:00',
          endTime: '12:00',
          status: 'confirmed',
          venueName: 'Terrain Synthétique',
        },
      ];

      setVenues(mockVenues);
      setBookings(mockBookings);

      const pending = mockBookings.filter(b => b.status === 'manager_confirmed').length;
      const confirmed = mockBookings.filter(b => b.status === 'confirmed').length;

      setStats({
        totalVenues: mockVenues.length,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        todayBookings: 1,
      });
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

  const handleApproveBooking = (booking) => {
    Alert.alert(
      'Approuver la réservation',
      `Confirmer la réservation de ${booking.teamName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: () => {
            Alert.alert('Succès', 'Réservation approuvée');
            loadData();
          },
        },
      ],
    );
  };

  const handleRejectBooking = (booking) => {
    Alert.alert(
      'Refuser la réservation',
      `Refuser la réservation de ${booking.teamName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Succès', 'Réservation refusée');
            loadData();
          },
        },
      ],
    );
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

  const pendingBookings = bookings.filter(b => b.status === 'manager_confirmed');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* HEADER DYNAMIQUE */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[COLORS.ROLE_VENUE_OWNER, '#BF360C', COLORS.DARK]}
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
                {stats.pendingBookings > 0 && <View style={styles.badge} />}
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
                {user?.firstName?.[0] || 'P'}
                {user?.lastName?.[0] || 'T'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bienvenue,</Text>
              <Text style={styles.userName}>{user?.firstName || 'Propriétaire'}</Text>
              <View style={styles.roleBadge}>
                <Icon name="home" size={12} color={COLORS.ROLE_VENUE_OWNER} />
                <Text style={styles.userRole}>Propriétaire</Text>
              </View>
            </View>
          </Animated.View>

          {/* Quick Stats Row */}
          <Animated.View
            style={[styles.quickStatsRow, { opacity: imageOpacity }]}
          >
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>
                {stats.totalVenues}
              </Text>
              <Text style={styles.quickStatLabel}>Terrains</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.pendingBookings}</Text>
              <Text style={styles.quickStatLabel}>En attente</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.confirmedBookings}</Text>
              <Text style={styles.quickStatLabel}>Confirmées</Text>
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
            tintColor={COLORS.ROLE_VENUE_OWNER}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
        {/* Quick Actions pour VENUE OWNER */}
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="map-pin"
            label="Ajouter"
            color={COLORS.ROLE_VENUE_OWNER}
            onPress={() => navigation.navigate('Venues', { screen: 'CreateVenue' })}
          />
          <QuickAction
            icon="clock"
            label="Dispos"
            color={COLORS.INFO}
            onPress={() => navigation.navigate('Venues', { screen: 'Availability' })}
          />
          <QuickAction
            icon="check-circle"
            label="Réservations"
            color={COLORS.SUCCESS}
            onPress={() => navigation.navigate('Bookings')}
          />
          <QuickAction
            icon="bar-chart-2"
            label="Stats"
            color={COLORS.ROLE_REFEREE}
            onPress={() => navigation.navigate('Profile', { screen: 'VenueStats' })}
          />
        </View>

        {/* Réservations à approuver */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>À approuver</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.ROLE_VENUE_OWNER} size="small" />
          </View>
        ) : pendingBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="inbox" size={32} color={COLORS.TEXT_MUTED} />
            <Text style={styles.emptyText}>Aucune réservation en attente</Text>
          </View>
        ) : (
          pendingBookings.slice(0, 3).map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onApprove={handleApproveBooking}
              onReject={handleRejectBooking}
              onPress={() => navigation.navigate('Bookings', { bookingId: booking.id })}
            />
          ))
        )}

        {/* Mes Terrains */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Terrains</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Venues')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {venues.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="map-pin" size={32} color={COLORS.TEXT_MUTED} />
            <Text style={styles.emptyText}>Aucun terrain enregistré</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('Venues', { screen: 'CreateVenue' })}
            >
              <Text style={styles.createBtnText}>Ajouter un terrain</Text>
            </TouchableOpacity>
          </View>
        ) : (
          venues.slice(0, 2).map(venue => (
            <TouchableOpacity
              key={venue.id}
              style={styles.venueCard}
              onPress={() => navigation.navigate('Venues', { screen: 'VenueDetail', params: { venueId: venue.id } })}
            >
              <View style={styles.venueIcon}>
                <Icon name="map-pin" size={24} color={COLORS.ROLE_VENUE_OWNER} />
              </View>
              <View style={styles.venueContent}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueMeta}>
                  {venue.city} • {venue.bookingsCount} réservation{venue.bookingsCount > 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.venueActionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('Venues', { screen: 'VenueSettings', params: { venueId: venue.id } });
                }}
              >
                <Icon name="settings" size={18} color={COLORS.WHITE} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        {/* Aide */}
        <Text style={styles.sectionTitle}>Aide</Text>
        <TouchableOpacity
          style={styles.helpCard}
          onPress={() => navigation.navigate('Profile', { screen: 'Help' })}
        >
          <View style={styles.helpIcon}>
            <Icon name="help-circle" size={24} color={COLORS.INFO} />
          </View>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Comment ça marche ?</Text>
            <Text style={styles.helpDesc}>
              Guide pour gérer vos terrains et réservations
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>

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
    borderColor: COLORS.ROLE_VENUE_OWNER,
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
    backgroundColor: `${COLORS.ROLE_VENUE_OWNER}30`,
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
    color: COLORS.ROLE_VENUE_OWNER,
    fontWeight: '600',
  },

  // BOOKING CARD
  bookingCard: {
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bookingDateBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ROLE_VENUE_OWNER,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  bookingMonth: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTeam: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 6,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingMeta: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.7,
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 12,
    marginTop: 4,
  },
  bookingActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: `${COLORS.ERROR}15`,
  },
  approveBtn: {
    backgroundColor: `${COLORS.SUCCESS}15`,
  },
  bookingActionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // VENUE CARD
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 12,
  },
  venueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.ROLE_VENUE_OWNER}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  venueContent: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  venueMeta: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.7,
  },
  venueActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // HELP CARD
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.INFO}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  helpDesc: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.7,
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
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.7,
    marginTop: 12,
    marginBottom: 16,
  },
  createBtn: {
    backgroundColor: COLORS.ROLE_VENUE_OWNER,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default VenueOwnerDashboardScreen;
