// ====== src/screens/matches/MatchDetailScreen.js ======
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
const HEADER_MAX_HEIGHT = 260;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 90;
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

// Composant PlayerCard
const PlayerCard = ({ player, COLORS }) => (
  <View style={[styles.playerCard, { backgroundColor: COLORS.WHITE }]}>
    <View
      style={[
        styles.playerAvatar,
        { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
      ]}
    >
      <Icon name="user" size={18} color={COLORS.PRIMARY} />
    </View>
    <View style={styles.playerInfo}>
      <Text style={[styles.playerName, { color: COLORS.TEXT_PRIMARY }]}>
        {player.name}
      </Text>
      <View style={styles.playerMeta}>
        <Icon name="target" size={12} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.playerMetaText, { color: COLORS.TEXT_SECONDARY }]}>
          {player.position}
        </Text>
      </View>
    </View>
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            player.status === 'confirmed'
              ? COLORS.SUCCESS_LIGHT
              : player.status === 'pending'
              ? COLORS.WARNING_LIGHT
              : COLORS.ERROR_LIGHT,
        },
      ]}
    >
      <Icon
        name={
          player.status === 'confirmed'
            ? 'check'
            : player.status === 'pending'
            ? 'clock'
            : 'x'
        }
        size={12}
        color={
          player.status === 'confirmed'
            ? COLORS.SUCCESS
            : player.status === 'pending'
            ? COLORS.WARNING
            : COLORS.ERROR
        }
      />
    </View>
  </View>
);

// Composant InfoRow
const InfoRow = ({ icon, label, value, COLORS }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Icon name={icon} size={18} color={COLORS.TEXT_SECONDARY} />
      <Text style={[styles.infoLabel, { color: COLORS.TEXT_SECONDARY }]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.infoValue, { color: COLORS.TEXT_PRIMARY }]}>
      {value}
    </Text>
  </View>
);

// Composant MatchStatRow (pour matchs passés)
const MatchStatRow = ({ label, homeValue, awayValue, COLORS }) => {
  const total = homeValue + awayValue;
  const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercentage = total > 0 ? (awayValue / total) * 100 : 50;

  return (
    <View style={styles.matchStatRow}>
      <Text style={[styles.statNumber, { color: COLORS.TEXT_PRIMARY }]}>
        {homeValue}
      </Text>
      <View style={styles.statCenter}>
        <Text style={[styles.statLabel, { color: COLORS.TEXT_SECONDARY }]}>
          {label}
        </Text>
        <View
          style={[styles.statBar, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
        >
          <View
            style={[
              styles.statBarFill,
              {
                backgroundColor: COLORS.PRIMARY,
                width: `${homePercentage}%`,
              },
            ]}
          />
          <View
            style={[
              styles.statBarFillRight,
              {
                backgroundColor: COLORS.SECONDARY,
                width: `${awayPercentage}%`,
              },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.statNumber, { color: COLORS.TEXT_PRIMARY }]}>
        {awayValue}
      </Text>
    </View>
  );
};

export const MatchDetailScreen = ({ route, navigation }) => {
  const { matchId } = route.params || {};
  const { colors: COLORS, isDark } = useTheme('auto');
  const [refreshing, setRefreshing] = useState(false);

  // Animation du scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // Données mockées (à remplacer par API)
  const [match] = useState({
    id: matchId || 1,
    homeTeam: {
      id: 1,
      name: 'Les Tigres de Paris',
      score: 3,
    },
    awayTeam: {
      id: 2,
      name: 'FC Olympique',
      score: 2,
    },
    date: 'Samedi 15 Mars 2024',
    time: '15:00',
    location: 'Stade Municipal',
    address: '15 rue du Stade, 75015 Paris',
    status: 'completed', // upcoming, ongoing, completed, cancelled
    matchType: 'friendly', // friendly, competitive, tournament
    maxPlayers: 22,
    confirmedPlayers: 18,
    description:
      'Match amical entre deux équipes du quartier. Venez nombreux !',
    isOrganizer: true,
    userParticipation: 'confirmed', // confirmed, pending, declined, null
  });

  // Stats du match (si completed)
  const [matchStats] = useState({
    possession: { home: 58, away: 42 },
    shots: { home: 15, away: 12 },
    shotsOnTarget: { home: 8, away: 6 },
    corners: { home: 7, away: 5 },
    fouls: { home: 9, away: 11 },
  });

  const [players] = useState([
    {
      id: 1,
      name: 'Jean Dupont',
      position: 'Attaquant',
      team: 'home',
      status: 'confirmed',
    },
    {
      id: 2,
      name: 'Marie Martin',
      position: 'Milieu',
      team: 'home',
      status: 'confirmed',
    },
    {
      id: 3,
      name: 'Thomas Dubois',
      position: 'Défenseur',
      team: 'home',
      status: 'confirmed',
    },
    {
      id: 4,
      name: 'Sophie Bernard',
      position: 'Gardien',
      team: 'home',
      status: 'pending',
    },
    {
      id: 5,
      name: 'Pierre Leroy',
      position: 'Attaquant',
      team: 'away',
      status: 'confirmed',
    },
    {
      id: 6,
      name: 'Julie Moreau',
      position: 'Milieu',
      team: 'away',
      status: 'confirmed',
    },
    {
      id: 7,
      name: 'Lucas Simon',
      position: 'Défenseur',
      team: 'away',
      status: 'declined',
    },
  ]);

  // Animations du header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const teamsScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const teamsOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const scoreOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const statusBadgeOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const statusBadgeScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 4],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleConfirmParticipation = () => {
    Alert.alert(
      'Confirmer',
      'Voulez-vous confirmer votre participation à ce match ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => Alert.alert('Confirmé !') },
      ],
    );
  };

  const handleDeclineParticipation = () => {
    Alert.alert(
      'Décliner',
      'Voulez-vous décliner votre participation à ce match ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Décliner', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  const handleEditMatch = () => {
    Alert.alert('Info', 'Fonctionnalité en développement');
  };

  const handleShareMatch = () => {
    Alert.alert('Partager', 'Lien de partage copié !');
  };

  const handleInvitePlayers = () => {
    Alert.alert('Info', 'Fonctionnalité en développement');
  };

  const handleOpenMap = () => {
    Alert.alert('Info', 'Ouverture de la carte...');
  };

  const getStatusBadge = () => {
    const statusConfig = {
      upcoming: { label: 'À venir', color: COLORS.PRIMARY, icon: 'calendar' },
      ongoing: {
        label: 'En cours',
        color: COLORS.WARNING,
        icon: 'play-circle',
      },
      completed: {
        label: 'Terminé',
        color: COLORS.SUCCESS,
        icon: 'check-circle',
      },
      cancelled: { label: 'Annulé', color: COLORS.ERROR, icon: 'x-circle' },
    };
    return statusConfig[match.status] || statusConfig.upcoming;
  };

  const status = getStatusBadge();

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
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareMatch}
            >
              <Icon name="share-2" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
            {match.isOrganizer && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleEditMatch}
              >
                <Icon name="edit-2" size={20} color={COLORS.WHITE} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.headerContent}>
          {/* Match Teams */}
          <Animated.View
            style={[
              styles.matchTeams,
              {
                opacity: teamsOpacity,
                transform: [{ scale: teamsScale }],
              },
            ]}
          >
            <View style={styles.teamSection}>
              <View
                style={[
                  styles.teamLogo,
                  { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                ]}
              >
                <Icon name="dribbble" size={32} color={COLORS.WHITE} />
              </View>
              <Text style={styles.teamName}>{match.homeTeam.name}</Text>
            </View>

            <View style={styles.vsSection}>
              <Text style={styles.vsText}>VS</Text>
              {match.status === 'completed' && (
                <Animated.View
                  style={[styles.scoreContainer, { opacity: scoreOpacity }]}
                >
                  <Text style={styles.scoreText}>
                    {match.homeTeam.score} - {match.awayTeam.score}
                  </Text>
                </Animated.View>
              )}
            </View>

            <View style={styles.teamSection}>
              <View
                style={[
                  styles.teamLogo,
                  { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                ]}
              >
                <Icon name="dribbble" size={32} color={COLORS.WHITE} />
              </View>
              <Text style={styles.teamName}>{match.awayTeam.name}</Text>
            </View>
          </Animated.View>

          {/* Status Badge */}
          <Animated.View
            style={[
              styles.matchStatusBadgeContainer,
              {
                opacity: statusBadgeOpacity,
                transform: [{ scale: statusBadgeScale }],
              },
            ]}
          >
            <View
              style={[
                styles.matchStatusBadge,
                { backgroundColor: status.color },
              ]}
            >
              <Icon name={status.icon} size={14} color="#FFFFFF" />
              <Text style={styles.matchStatusText}>{status.label}</Text>
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
        {/* Infos principales */}
        <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Informations
            </Text>
          </View>
          <InfoRow
            icon="calendar"
            label="Date"
            value={match.date}
            COLORS={COLORS}
          />
          <InfoRow
            icon="clock"
            label="Heure"
            value={match.time}
            COLORS={COLORS}
          />
          <InfoRow
            icon="map-pin"
            label="Lieu"
            value={match.location}
            COLORS={COLORS}
          />
          <InfoRow
            icon="navigation"
            label="Adresse"
            value={match.address}
            COLORS={COLORS}
          />
          <InfoRow
            icon="award"
            label="Type"
            value={
              match.matchType === 'friendly'
                ? 'Amical'
                : match.matchType === 'competitive'
                ? 'Compétitif'
                : 'Tournoi'
            }
            COLORS={COLORS}
          />

          {/* Bouton carte */}
          <TouchableOpacity
            style={[
              styles.mapButton,
              { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
            ]}
            onPress={handleOpenMap}
          >
            <Icon name="map" size={18} color={COLORS.PRIMARY} />
            <Text style={[styles.mapButtonText, { color: COLORS.PRIMARY }]}>
              Voir sur la carte
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {match.description && (
          <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
            <View style={styles.sectionHeader}>
              <Icon name="file-text" size={20} color={COLORS.PRIMARY} />
              <Text
                style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}
              >
                Description
              </Text>
            </View>
            <Text
              style={[styles.description, { color: COLORS.TEXT_SECONDARY }]}
            >
              {match.description}
            </Text>
          </View>
        )}

        {/* Stats du match (si terminé) */}
        {match.status === 'completed' && matchStats && (
          <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
            <View style={styles.sectionHeader}>
              <Icon name="bar-chart-2" size={20} color={COLORS.PRIMARY} />
              <Text
                style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}
              >
                Statistiques
              </Text>
            </View>
            <MatchStatRow
              label="Possession"
              homeValue={matchStats.possession.home}
              awayValue={matchStats.possession.away}
              COLORS={COLORS}
            />
            <MatchStatRow
              label="Tirs"
              homeValue={matchStats.shots.home}
              awayValue={matchStats.shots.away}
              COLORS={COLORS}
            />
            <MatchStatRow
              label="Tirs cadrés"
              homeValue={matchStats.shotsOnTarget.home}
              awayValue={matchStats.shotsOnTarget.away}
              COLORS={COLORS}
            />
            <MatchStatRow
              label="Corners"
              homeValue={matchStats.corners.home}
              awayValue={matchStats.corners.away}
              COLORS={COLORS}
            />
            <MatchStatRow
              label="Fautes"
              homeValue={matchStats.fouls.home}
              awayValue={matchStats.fouls.away}
              COLORS={COLORS}
            />
          </View>
        )}

        {/* Participation */}
        <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.sectionHeader}>
            <Icon name="users" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Participants ({match.confirmedPlayers}/{match.maxPlayers})
            </Text>
            {match.isOrganizer && (
              <TouchableOpacity
                style={[
                  styles.inviteButton,
                  { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
                ]}
                onPress={handleInvitePlayers}
              >
                <Icon name="user-plus" size={16} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: COLORS.BACKGROUND_LIGHT },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: COLORS.PRIMARY,
                    width: `${
                      (match.confirmedPlayers / match.maxPlayers) * 100
                    }%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.progressText, { color: COLORS.TEXT_SECONDARY }]}
            >
              {Math.round((match.confirmedPlayers / match.maxPlayers) * 100)}%
            </Text>
          </View>

          {/* Liste des joueurs */}
          <View style={styles.playersList}>
            {players.map(player => (
              <PlayerCard key={player.id} player={player} COLORS={COLORS} />
            ))}
          </View>
        </View>

        {/* Boutons d'action */}
        {match.status === 'upcoming' && !match.userParticipation && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: COLORS.PRIMARY },
              ]}
              onPress={handleConfirmParticipation}
            >
              <Icon name="check" size={20} color={COLORS.WHITE} />
              <Text style={styles.primaryButtonText}>
                Confirmer ma participation
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { borderColor: COLORS.TEXT_MUTED },
              ]}
              onPress={handleDeclineParticipation}
            >
              <Icon name="x" size={20} color={COLORS.TEXT_MUTED} />
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: COLORS.TEXT_MUTED },
                ]}
              >
                Décliner
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {match.userParticipation === 'confirmed' &&
          match.status === 'upcoming' && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: COLORS.ERROR }]}
              onPress={handleDeclineParticipation}
            >
              <Icon name="x" size={20} color={COLORS.ERROR} />
              <Text
                style={[styles.secondaryButtonText, { color: COLORS.ERROR }]}
              >
                Annuler ma participation
              </Text>
            </TouchableOpacity>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
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
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  teamName: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  vsSection: {
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
  },
  vsText: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scoreContainer: {
    marginTop: DIMENSIONS.SPACING_XS,
  },
  scoreText: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: '#FFFFFF',
  },
  matchStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_XS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XS,
  },
  matchStatusText: {
    fontSize: FONTS.SIZE.SM,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    flex: 1,
  },
  infoLabel: {
    fontSize: FONTS.SIZE.SM,
  },
  infoValue: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    textAlign: 'right',
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: DIMENSIONS.SPACING_SM,
    marginTop: DIMENSIONS.SPACING_MD,
  },
  mapButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  description: {
    fontSize: FONTS.SIZE.MD,
    lineHeight: FONTS.SIZE.MD * FONTS.LINE_HEIGHT.RELAXED,
  },
  matchStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  statNumber: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    width: 30,
    textAlign: 'center',
  },
  statCenter: {
    flex: 1,
    marginHorizontal: DIMENSIONS.SPACING_MD,
  },
  statLabel: {
    fontSize: FONTS.SIZE.SM,
    marginBottom: DIMENSIONS.SPACING_XS,
    textAlign: 'center',
  },
  statBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  statBarFillRight: {
    height: '100%',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  inviteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    width: 40,
    textAlign: 'right',
  },
  playersList: {
    gap: DIMENSIONS.SPACING_SM,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: 2,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  playerMetaText: {
    fontSize: FONTS.SIZE.XS,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    gap: DIMENSIONS.SPACING_SM,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: DIMENSIONS.SPACING_SM,
    ...SHADOWS.MEDIUM,
  },
  primaryButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 2,
    gap: DIMENSIONS.SPACING_SM,
  },
  secondaryButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
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
  ostatLabel: {
    fontSize: FONTS.SIZE.XXS,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    textAlign: 'center',
  },
});
