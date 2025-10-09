// ====== src/screens/matches/MatchesScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Composant TabButton
const TabButton = ({ label, active, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && { backgroundColor: COLORS.PRIMARY }]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.tabButtonText,
        { color: active ? COLORS.WHITE : COLORS.TEXT_SECONDARY },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// Composant UpcomingMatchCard
const UpcomingMatchCard = ({ match, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.matchCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
  >
    {/* Badge Status */}
    <View style={styles.matchStatus}>
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor:
              match.status === 'confirmed'
                ? COLORS.SUCCESS_LIGHT
                : COLORS.WARNING_LIGHT,
          },
        ]}
      >
        <Icon
          name={match.status === 'confirmed' ? 'check-circle' : 'clock'}
          size={12}
          color={match.status === 'confirmed' ? COLORS.SUCCESS : COLORS.WARNING}
        />
        <Text
          style={[
            styles.statusText,
            {
              color:
                match.status === 'confirmed' ? COLORS.SUCCESS : COLORS.WARNING,
            },
          ]}
        >
          {match.status === 'confirmed' ? 'Confirmé' : 'En attente'}
        </Text>
      </View>
    </View>

    {/* Équipes */}
    <View style={styles.teamsContainer}>
      <View style={styles.teamSection}>
        <View
          style={[
            styles.teamLogo,
            { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
          ]}
        >
          <Icon name="dribbble" size={24} color={COLORS.PRIMARY} />
        </View>
        <Text style={[styles.teamName, { color: COLORS.TEXT_PRIMARY }]}>
          {match.homeTeam}
        </Text>
      </View>

      <View style={styles.vsContainer}>
        <Text style={[styles.vsText, { color: COLORS.TEXT_MUTED }]}>VS</Text>
        <View style={styles.timeContainer}>
          <Icon name="clock" size={14} color={COLORS.PRIMARY} />
          <Text style={[styles.timeText, { color: COLORS.PRIMARY }]}>
            {match.time}
          </Text>
        </View>
      </View>

      <View style={styles.teamSection}>
        <View
          style={[styles.teamLogo, { backgroundColor: COLORS.SECONDARY_LIGHT }]}
        >
          <Icon name="dribbble" size={24} color={COLORS.SECONDARY} />
        </View>
        <Text style={[styles.teamName, { color: COLORS.TEXT_PRIMARY }]}>
          {match.awayTeam}
        </Text>
      </View>
    </View>

    {/* Infos */}
    <View style={styles.matchInfo}>
      <View style={styles.infoItem}>
        <Icon name="calendar" size={14} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.infoText, { color: COLORS.TEXT_SECONDARY }]}>
          {match.date}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Icon name="map-pin" size={14} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.infoText, { color: COLORS.TEXT_SECONDARY }]}>
          {match.location}
        </Text>
      </View>
    </View>

    {/* Footer */}
    <View style={styles.matchFooter}>
      <View style={styles.playersInfo}>
        <Icon name="users" size={14} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.playersText, { color: COLORS.TEXT_SECONDARY }]}>
          {match.confirmedPlayers}/{match.totalPlayers} joueurs
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
    </View>
  </TouchableOpacity>
);

// Composant PastMatchCard
const PastMatchCard = ({ match, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.matchCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
  >
    {/* Badge Résultat */}
    <View style={styles.matchStatus}>
      <View
        style={[
          styles.resultBadge,
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
            styles.resultText,
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
          {match.result === 'win'
            ? 'Victoire'
            : match.result === 'loss'
            ? 'Défaite'
            : 'Match Nul'}
        </Text>
      </View>
    </View>

    {/* Score */}
    <View style={styles.scoreContainer}>
      <View style={styles.scoreTeam}>
        <View
          style={[
            styles.teamLogoSmall,
            { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
          ]}
        >
          <Icon name="dribbble" size={20} color={COLORS.PRIMARY} />
        </View>
        <Text style={[styles.scoreTeamName, { color: COLORS.TEXT_PRIMARY }]}>
          {match.homeTeam}
        </Text>
      </View>

      <View style={styles.scoreBox}>
        <Text style={[styles.scoreNumber, { color: COLORS.TEXT_PRIMARY }]}>
          {match.homeScore}
        </Text>
        <Text style={[styles.scoreSeparator, { color: COLORS.TEXT_MUTED }]}>
          -
        </Text>
        <Text style={[styles.scoreNumber, { color: COLORS.TEXT_PRIMARY }]}>
          {match.awayScore}
        </Text>
      </View>

      <View style={styles.scoreTeam}>
        <View
          style={[
            styles.teamLogoSmall,
            { backgroundColor: COLORS.SECONDARY_LIGHT },
          ]}
        >
          <Icon name="dribbble" size={20} color={COLORS.SECONDARY} />
        </View>
        <Text style={[styles.scoreTeamName, { color: COLORS.TEXT_PRIMARY }]}>
          {match.awayTeam}
        </Text>
      </View>
    </View>

    {/* Infos */}
    <View style={styles.matchInfo}>
      <View style={styles.infoItem}>
        <Icon name="calendar" size={14} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.infoText, { color: COLORS.TEXT_SECONDARY }]}>
          {match.date}
        </Text>
      </View>
      <View style={styles.infoItem}>
        <Icon name="map-pin" size={14} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.infoText, { color: COLORS.TEXT_SECONDARY }]}>
          {match.location}
        </Text>
      </View>
    </View>

    {/* Stats rapides */}
    {match.stats && (
      <View style={styles.quickStats}>
        {match.stats.goals > 0 && (
          <View
            style={[
              styles.statBadge,
              { backgroundColor: COLORS.SUCCESS_LIGHT },
            ]}
          >
            <Icon name="target" size={12} color={COLORS.SUCCESS} />
            <Text style={[styles.statText, { color: COLORS.SUCCESS }]}>
              {match.stats.goals} {match.stats.goals > 1 ? 'buts' : 'but'}
            </Text>
          </View>
        )}
        {match.stats.assists > 0 && (
          <View
            style={[
              styles.statBadge,
              { backgroundColor: COLORS.PRIMARY_LIGHT },
            ]}
          >
            <Icon name="zap" size={12} color={COLORS.PRIMARY} />
            <Text style={[styles.statText, { color: COLORS.PRIMARY }]}>
              {match.stats.assists}{' '}
              {match.stats.assists > 1 ? 'passes D.' : 'passe D.'}
            </Text>
          </View>
        )}
      </View>
    )}
  </TouchableOpacity>
);

// Composant EmptyState
const EmptyState = ({ icon, title, message, actionText, onAction, COLORS }) => (
  <View style={styles.emptyState}>
    <View
      style={[
        styles.emptyIcon,
        { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
      ]}
    >
      <Icon name={icon} size={48} color={COLORS.PRIMARY} />
    </View>
    <Text style={[styles.emptyTitle, { color: COLORS.TEXT_PRIMARY }]}>
      {title}
    </Text>
    <Text style={[styles.emptyMessage, { color: COLORS.TEXT_SECONDARY }]}>
      {message}
    </Text>
    {actionText && onAction && (
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: COLORS.PRIMARY }]}
        onPress={onAction}
      >
        <Text style={styles.emptyButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const MatchesScreen = ({ navigation }) => {
  const { colors: COLORS, isDark } = useTheme('auto');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, all

  // Données mockées (à remplacer par API)
  const [upcomingMatches] = useState([
    {
      id: 1,
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'FC Olympique',
      date: 'Sam 20 Avril',
      time: '15:00',
      location: 'Stade Municipal, Paris 15e',
      status: 'confirmed',
      confirmedPlayers: 18,
      totalPlayers: 22,
    },
    {
      id: 2,
      homeTeam: 'Racing Club 75',
      awayTeam: 'Les Tigres de Paris',
      date: 'Dim 28 Avril',
      time: '10:30',
      location: 'Terrain Synthétique, Paris 18e',
      status: 'pending',
      confirmedPlayers: 12,
      totalPlayers: 22,
    },
    {
      id: 3,
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'AS Montparnasse',
      date: 'Sam 04 Mai',
      time: '14:00',
      location: 'Parc des Sports, Paris 14e',
      status: 'pending',
      confirmedPlayers: 8,
      totalPlayers: 22,
    },
  ]);

  const [pastMatches] = useState([
    {
      id: 4,
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'FC Olympique',
      homeScore: 3,
      awayScore: 2,
      result: 'win',
      date: '15 Mars 2024',
      location: 'Stade Municipal, Paris 15e',
      stats: {
        goals: 2,
        assists: 1,
      },
    },
    {
      id: 5,
      homeTeam: 'Racing Club',
      awayTeam: 'Les Tigres de Paris',
      homeScore: 1,
      awayScore: 1,
      result: 'draw',
      date: '08 Mars 2024',
      location: 'Terrain Synthétique, Paris 18e',
      stats: {
        goals: 0,
        assists: 1,
      },
    },
    {
      id: 6,
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'AS Montparnasse',
      homeScore: 0,
      awayScore: 2,
      result: 'loss',
      date: '01 Mars 2024',
      location: 'Parc des Sports, Paris 14e',
      stats: {
        goals: 0,
        assists: 0,
      },
    },
    {
      id: 7,
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'FC Saint-Germain',
      homeScore: 4,
      awayScore: 1,
      result: 'win',
      date: '22 Fév 2024',
      location: 'Stade Municipal, Paris 15e',
      stats: {
        goals: 1,
        assists: 2,
      },
    },
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreateMatch = () => {
    // Alert.alert('Info', 'Fonctionnalité en développement');
    navigation.navigate('CreateMatch');
  };

  const handleInvitations = () => {
    // Alert.alert('Info', 'Fonctionnalité en développement');
    navigation.navigate('Invitations');
  };

  const handleMatchPress = matchId => {
    navigation.navigate('MatchDetail', { matchId });
  };

  const getMatches = () => {
    if (activeTab === 'upcoming') return upcomingMatches;
    if (activeTab === 'past') return pastMatches;
    return [...upcomingMatches, ...pastMatches];
  };

  const matches = getMatches();

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.WHITE }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: COLORS.TEXT_PRIMARY }]}>
            Mes Matchs
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: COLORS.PRIMARY }]}
              onPress={handleCreateMatch}
            >
              <Icon name="plus" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: COLORS.PRIMARY }]}
              onPress={handleInvitations}
            >
              <Icon name="inbox" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={[styles.tabs, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
        >
          <TabButton
            label="À venir"
            active={activeTab === 'upcoming'}
            onPress={() => setActiveTab('upcoming')}
            COLORS={COLORS}
          />
          <TabButton
            label="Passés"
            active={activeTab === 'past'}
            onPress={() => setActiveTab('past')}
            COLORS={COLORS}
          />
          <TabButton
            label="Tous"
            active={activeTab === 'all'}
            onPress={() => setActiveTab('all')}
            COLORS={COLORS}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {matches.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Aucun match"
            message={
              activeTab === 'upcoming'
                ? "Vous n'avez aucun match à venir pour le moment"
                : 'Aucun historique de match disponible'
            }
            actionText={activeTab === 'upcoming' ? 'Créer un match' : null}
            onAction={activeTab === 'upcoming' ? handleCreateMatch : null}
            COLORS={COLORS}
          />
        ) : (
          <View style={styles.matchesList}>
            {activeTab === 'upcoming' &&
              upcomingMatches.map(match => (
                <UpcomingMatchCard
                  key={match.id}
                  match={match}
                  onPress={() => handleMatchPress(match.id)}
                  COLORS={COLORS}
                />
              ))}

            {activeTab === 'past' &&
              pastMatches.map(match => (
                <PastMatchCard
                  key={match.id}
                  match={match}
                  onPress={() => handleMatchPress(match.id)}
                  COLORS={COLORS}
                />
              ))}

            {activeTab === 'all' && (
              <>
                {/* À venir */}
                {upcomingMatches.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Icon name="calendar" size={18} color={COLORS.PRIMARY} />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: COLORS.TEXT_PRIMARY },
                        ]}
                      >
                        Matchs à venir
                      </Text>
                    </View>
                    {upcomingMatches.map(match => (
                      <UpcomingMatchCard
                        key={match.id}
                        match={match}
                        onPress={() => handleMatchPress(match.id)}
                        COLORS={COLORS}
                      />
                    ))}
                  </>
                )}

                {/* Passés */}
                {pastMatches.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Icon name="clock" size={18} color={COLORS.TEXT_MUTED} />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: COLORS.TEXT_PRIMARY },
                        ]}
                      >
                        Matchs passés
                      </Text>
                    </View>
                    {pastMatches.map(match => (
                      <PastMatchCard
                        key={match.id}
                        match={match}
                        onPress={() => handleMatchPress(match.id)}
                        COLORS={COLORS}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: DIMENSIONS.SPACING_MD,
    ...SHADOWS.SMALL,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  headerTitle: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  headerActions: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_MD,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.MEDIUM,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: DIMENSIONS.CONTAINER_PADDING,
    padding: 4,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_SM,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DIMENSIONS.CONTAINER_PADDING,
    paddingBottom: DIMENSIONS.SPACING_XXL,
  },
  matchesList: {
    gap: DIMENSIONS.SPACING_MD,
  },
  matchCard: {
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
    ...SHADOWS.MEDIUM,
  },
  matchStatus: {
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: DIMENSIONS.SPACING_XXS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XXS,
  },
  statusText: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  resultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_XS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
  },
  resultText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  teamName: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
  },
  vsText: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  timeText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  scoreTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
  },
  teamLogoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreTeamName: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    flex: 1,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    paddingHorizontal: DIMENSIONS.SPACING_MD,
  },
  scoreNumber: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  scoreSeparator: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  matchInfo: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_LG,
    paddingTop: DIMENSIONS.SPACING_MD,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
  },
  infoText: {
    fontSize: FONTS.SIZE.SM,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACING_MD,
    paddingTop: DIMENSIONS.SPACING_MD,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  playersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
  },
  playersText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  quickStats: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
    marginTop: DIMENSIONS.SPACING_MD,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: DIMENSIONS.SPACING_XXS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XXS,
  },
  statText: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    marginTop: DIMENSIONS.SPACING_LG,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING_XXL * 2,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  emptyTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  emptyMessage: {
    fontSize: FONTS.SIZE.MD,
    textAlign: 'center',
    marginBottom: DIMENSIONS.SPACING_XL,
    paddingHorizontal: DIMENSIONS.SPACING_XL,
  },
  emptyButton: {
    paddingHorizontal: DIMENSIONS.SPACING_XL,
    paddingVertical: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    ...SHADOWS.MEDIUM,
  },
  emptyButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: '#FFFFFF',
  },
});
