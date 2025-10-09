// ====== src/screens/teams/TeamDetailScreen.js ======
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
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 110;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Composant StatCard
const StatCard = ({ icon, value, label, color, COLORS }) => (
  <View style={[styles.statCard, { backgroundColor: COLORS.WHITE }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.statValue, { color: COLORS.TEXT_PRIMARY }]}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color: COLORS.TEXT_SECONDARY }]}>
      {label}
    </Text>
  </View>
);

// Composant MemberCard
const MemberCard = ({ member, isOwner, COLORS }) => (
  <View style={[styles.memberCard, { backgroundColor: COLORS.WHITE }]}>
    <View
      style={[
        styles.memberAvatar,
        { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
      ]}
    >
      <Icon name="user" size={20} color={COLORS.PRIMARY} />
    </View>
    <View style={styles.memberInfo}>
      <View style={styles.memberHeader}>
        <Text style={[styles.memberName, { color: COLORS.TEXT_PRIMARY }]}>
          {member.name}
        </Text>
        {member.role === 'captain' && (
          <View
            style={[
              styles.captainBadge,
              { backgroundColor: COLORS.WARNING_LIGHT },
            ]}
          >
            <Icon name="award" size={12} color={COLORS.WARNING} />
            <Text style={[styles.captainText, { color: COLORS.WARNING }]}>
              Capitaine
            </Text>
          </View>
        )}
      </View>
      <View style={styles.memberMeta}>
        <View style={styles.memberMetaItem}>
          <Icon name="target" size={12} color={COLORS.TEXT_MUTED} />
          <Text
            style={[styles.memberMetaText, { color: COLORS.TEXT_SECONDARY }]}
          >
            {member.position}
          </Text>
        </View>
        <View style={styles.memberMetaItem}>
          <Icon name="calendar" size={12} color={COLORS.TEXT_MUTED} />
          <Text
            style={[styles.memberMetaText, { color: COLORS.TEXT_SECONDARY }]}
          >
            Membre depuis {member.joinedDate}
          </Text>
        </View>
      </View>
    </View>
    {isOwner && member.role !== 'captain' && (
      <TouchableOpacity style={styles.memberOptions}>
        <Icon name="more-vertical" size={20} color={COLORS.TEXT_MUTED} />
      </TouchableOpacity>
    )}
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

export const TeamDetailScreen = ({ route, navigation }) => {
  const { teamId, teamName } = route.params || {};
  const { colors: COLORS, isDark } = useTheme('auto');
  const [refreshing, setRefreshing] = useState(false);

  // Animation du scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // Données mockées (à remplacer par API)
  const [team] = useState({
    id: teamId || 1,
    name: teamName || 'Les Tigres de Paris',
    description:
      'Équipe compétitive de football amateur. On joue tous les weekends et on participe à des tournois locaux.',
    skillLevel: 'intermediate',
    locationCity: 'Paris',
    locationAddress: '15 rue du Stade, 75015',
    currentMembers: 8,
    maxPlayers: 11,
    matchesPlayed: 24,
    wins: 15,
    createdAt: 'Janvier 2024',
    isOwner: true,
    isMember: true,
  });

  const [members] = useState([
    {
      id: 1,
      name: 'Jean Dupont',
      position: 'Attaquant',
      role: 'captain',
      joinedDate: 'Jan 2024',
    },
    {
      id: 2,
      name: 'Marie Martin',
      position: 'Milieu',
      role: 'member',
      joinedDate: 'Fév 2024',
    },
    {
      id: 3,
      name: 'Thomas Dubois',
      position: 'Défenseur',
      role: 'member',
      joinedDate: 'Mar 2024',
    },
    {
      id: 4,
      name: 'Sophie Bernard',
      position: 'Gardien',
      role: 'member',
      joinedDate: 'Mar 2024',
    },
  ]);

  // Animations du header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const logoScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const logoOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const titleFontSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [28, 18],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -130],
    extrapolate: 'clamp',
  });

  const skillBadgeOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const skillBadgeTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 3],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleJoinTeam = () => {
    Alert.alert('Rejoindre', 'Voulez-vous rejoindre cette équipe ?');
  };

  const handleLeaveTeam = () => {
    Alert.alert('Quitter', 'Êtes-vous sûr de vouloir quitter cette équipe ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Quitter', style: 'destructive' },
    ]);
  };

  const handleEditTeam = () => {
    navigation.navigate('EditTeam', { teamId: team.id });
  };

  const handleInvitePlayers = () => {
    Alert.alert('Info', 'Fonctionnalité en développement');
  };

  const handleShareTeam = () => {
    Alert.alert('Partager', 'Lien de partage copié !');
  };

  const getSkillLevelColor = () => {
    const colors = {
      beginner: '#94A3B8',
      amateur: '#3B82F6',
      intermediate: '#F59E0B',
      advanced: '#EF4444',
      expert: '#8B5CF6',
    };
    return colors[team.skillLevel] || '#6B7280';
  };

  const getSkillLevelLabel = () => {
    const labels = {
      beginner: 'Débutant',
      amateur: 'Amateur',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert',
    };
    return labels[team.skillLevel] || 'Non défini';
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
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareTeam}
            >
              <Icon name="share-2" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
            {team.isOwner && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleEditTeam}
              >
                <Icon name="edit-2" size={20} color={COLORS.WHITE} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.headerContent}>
          <Animated.View
            style={[
              styles.teamLogo,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Icon name="dribbble" size={48} color={COLORS.WHITE} />
          </Animated.View>

          <Animated.Text
            style={[
              styles.teamName,
              {
                fontSize: titleFontSize,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            {team.name}
          </Animated.Text>

          <Animated.View
            style={[
              styles.skillBadge,
              {
                backgroundColor: getSkillLevelColor(),
                opacity: skillBadgeOpacity,
                transform: [{ translateY: skillBadgeTranslateY }],
              },
            ]}
          >
            <Icon name="star" size={14} color="#FFFFFF" />
            <Text style={styles.skillBadgeText}>{getSkillLevelLabel()}</Text>
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
            icon="users"
            value={`${team.currentMembers}/${team.maxPlayers}`}
            label="Joueurs"
            color={COLORS.PRIMARY}
            COLORS={COLORS}
          />
          <StatCard
            icon="calendar"
            value={team.matchesPlayed}
            label="Matchs"
            color={COLORS.SECONDARY}
            COLORS={COLORS}
          />
          <StatCard
            icon="award"
            value={team.wins}
            label="Victoires"
            color={COLORS.SUCCESS}
            COLORS={COLORS}
          />
        </View>

        {/* À propos */}
        <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              À propos
            </Text>
          </View>
          <Text style={[styles.description, { color: COLORS.TEXT_SECONDARY }]}>
            {team.description}
          </Text>
        </View>

        {/* Informations */}
        <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.sectionHeader}>
            <Icon name="map-pin" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Informations
            </Text>
          </View>
          <InfoRow
            icon="map-pin"
            label="Ville"
            value={team.locationCity}
            COLORS={COLORS}
          />
          <InfoRow
            icon="navigation"
            label="Adresse"
            value={team.locationAddress}
            COLORS={COLORS}
          />
          <InfoRow
            icon="calendar"
            label="Créée en"
            value={team.createdAt}
            COLORS={COLORS}
          />
        </View>

        {/* Membres */}
        <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
          <View style={styles.sectionHeader}>
            <Icon name="users" size={20} color={COLORS.PRIMARY} />
            <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Membres ({team.currentMembers})
            </Text>
            {team.isOwner && (
              <TouchableOpacity
                style={[
                  styles.inviteButton,
                  { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
                ]}
                onPress={handleInvitePlayers}
              >
                <Icon name="user-plus" size={16} color={COLORS.PRIMARY} />
                <Text
                  style={[styles.inviteButtonText, { color: COLORS.PRIMARY }]}
                >
                  Inviter
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.membersList}>
            {members.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                isOwner={team.isOwner}
                COLORS={COLORS}
              />
            ))}
          </View>
        </View>

        {/* Bouton d'action principal */}
        {!team.isMember ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={handleJoinTeam}
          >
            <Icon name="user-plus" size={20} color={COLORS.WHITE} />
            <Text style={styles.primaryButtonText}>Rejoindre l'équipe</Text>
          </TouchableOpacity>
        ) : !team.isOwner ? (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: COLORS.ERROR }]}
            onPress={handleLeaveTeam}
          >
            <Icon name="log-out" size={20} color={COLORS.ERROR} />
            <Text style={[styles.secondaryButtonText, { color: COLORS.ERROR }]}>
              Quitter l'équipe
            </Text>
          </TouchableOpacity>
        ) : null}
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
    marginTop: Platform.OS === 'ios' ? 0 : 20,
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
  teamLogo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  teamName: {
    fontWeight: FONTS.WEIGHT.BOLD,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_XS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XS,
  },
  skillBadgeText: {
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
  statsContainer: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  statCard: {
    flex: 1,
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  statValue: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  statLabel: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.MEDIUM,
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
  description: {
    fontSize: FONTS.SIZE.MD,
    lineHeight: FONTS.SIZE.MD * FONTS.LINE_HEIGHT.RELAXED,
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
  },
  infoLabel: {
    fontSize: FONTS.SIZE.SM,
  },
  infoValue: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_XS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XS,
  },
  inviteButtonText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  membersList: {
    gap: DIMENSIONS.SPACING_SM,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XXS,
    gap: DIMENSIONS.SPACING_SM,
  },
  memberName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: 2,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XXS,
  },
  captainText: {
    fontSize: FONTS.SIZE.XXS,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  memberMeta: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_MD,
  },
  memberMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  memberMetaText: {
    fontSize: FONTS.SIZE.XS,
  },
  memberOptions: {
    padding: DIMENSIONS.SPACING_SM,
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
});
