// ====== src/screens/search/SearchScreen.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Composant FilterChip
const FilterChip = ({ label, icon, active, onPress, COLORS }) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      {
        backgroundColor: active ? COLORS.PRIMARY : COLORS.BACKGROUND_LIGHT,
        borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
      },
    ]}
    onPress={onPress}
  >
    <Icon
      name={icon}
      size={16}
      color={active ? COLORS.WHITE : COLORS.TEXT_SECONDARY}
    />
    <Text
      style={[
        styles.filterChipText,
        { color: active ? COLORS.WHITE : COLORS.TEXT_SECONDARY },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// Composant MatchResultCard
const MatchResultCard = ({ match, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.resultCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
  >
    <View style={styles.resultHeader}>
      <View
        style={[
          styles.resultIcon,
          { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name="calendar" size={20} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.resultInfo}>
        <View style={styles.teamsRow}>
          <Text style={[styles.teamNameSmall, { color: COLORS.TEXT_PRIMARY }]}>
            {match.homeTeam}
          </Text>
          <Text style={[styles.vsTextSmall, { color: COLORS.TEXT_MUTED }]}>
            vs
          </Text>
          <Text style={[styles.teamNameSmall, { color: COLORS.TEXT_PRIMARY }]}>
            {match.awayTeam}
          </Text>
        </View>
        <View style={styles.matchMeta}>
          <View style={styles.metaItem}>
            <Icon name="calendar" size={12} color={COLORS.TEXT_MUTED} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_SECONDARY }]}>
              {match.date}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="map-pin" size={12} color={COLORS.TEXT_MUTED} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_SECONDARY }]}>
              {match.location}
            </Text>
          </View>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
    </View>
  </TouchableOpacity>
);

// Composant TeamResultCard
const TeamResultCard = ({ team, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.resultCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
  >
    <View style={styles.resultHeader}>
      <View
        style={[
          styles.teamIconLarge,
          { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name="dribbble" size={24} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.teamNameResult, { color: COLORS.TEXT_PRIMARY }]}>
          {team.name}
        </Text>
        <View style={styles.matchMeta}>
          <View style={styles.metaItem}>
            <Icon name="users" size={12} color={COLORS.TEXT_MUTED} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_SECONDARY }]}>
              {team.members} membres
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="map-pin" size={12} color={COLORS.TEXT_MUTED} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_SECONDARY }]}>
              {team.city}
            </Text>
          </View>
          <View
            style={[
              styles.skillBadgeSmall,
              { backgroundColor: COLORS.WARNING_LIGHT },
            ]}
          >
            <Icon name="star" size={10} color={COLORS.WARNING} />
            <Text style={[styles.skillText, { color: COLORS.WARNING }]}>
              {team.skillLevel}
            </Text>
          </View>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
    </View>
  </TouchableOpacity>
);

// Composant PlayerResultCard
const PlayerResultCard = ({ player, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.resultCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
  >
    <View style={styles.resultHeader}>
      <View
        style={[
          styles.playerAvatar,
          { backgroundColor: COLORS.SECONDARY_LIGHT },
        ]}
      >
        <Icon name="user" size={20} color={COLORS.SECONDARY} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.playerName, { color: COLORS.TEXT_PRIMARY }]}>
          {player.name}
        </Text>
        <View style={styles.matchMeta}>
          <View style={styles.metaItem}>
            <Icon name="target" size={12} color={COLORS.TEXT_MUTED} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_SECONDARY }]}>
              {player.position}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="map-pin" size={12} color={COLORS.TEXT_MUTED} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_SECONDARY }]}>
              {player.city}
            </Text>
          </View>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
    </View>
  </TouchableOpacity>
);

// Composant RecentSearchItem
const RecentSearchItem = ({ search, onPress, onRemove, COLORS }) => (
  <View style={styles.recentItem}>
    <TouchableOpacity style={styles.recentContent} onPress={onPress}>
      <Icon name="clock" size={18} color={COLORS.TEXT_MUTED} />
      <Text style={[styles.recentText, { color: COLORS.TEXT_PRIMARY }]}>
        {search}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
      <Icon name="x" size={16} color={COLORS.TEXT_MUTED} />
    </TouchableOpacity>
  </View>
);

// Composant PopularSearchItem
const PopularSearchItem = ({ search, icon, onPress, COLORS }) => (
  <TouchableOpacity
    style={[
      styles.popularItem,
      {
        backgroundColor: COLORS.BACKGROUND_LIGHT,
        borderColor: COLORS.BORDER,
      },
    ]}
    onPress={onPress}
  >
    <Icon name={icon} size={18} color={COLORS.PRIMARY} />
    <Text style={[styles.popularText, { color: COLORS.TEXT_PRIMARY }]}>
      {search}
    </Text>
  </TouchableOpacity>
);

// Composant EmptyState
const EmptyState = ({ icon, title, message, COLORS }) => (
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
  </View>
);

export const SearchScreen = ({ navigation }) => {
  const { colors: COLORS, isDark } = useTheme('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, matches, teams, players

  // Données mockées (à remplacer par API)
  const [recentSearches] = useState([
    'Les Tigres de Paris',
    'Match amical Paris',
    'Jean Dupont',
    'FC Olympique',
  ]);

  const [popularSearches] = useState([
    { text: 'Matchs ce weekend', icon: 'calendar' },
    { text: 'Équipes à Paris', icon: 'map-pin' },
    { text: 'Joueurs débutants', icon: 'users' },
    { text: 'Tournois en cours', icon: 'trophy' },
  ]);

  const [searchResults] = useState({
    matches: [
      {
        id: 1,
        homeTeam: 'Les Tigres de Paris',
        awayTeam: 'FC Olympique',
        date: 'Sam 20 Avril',
        location: 'Paris 15e',
      },
      {
        id: 2,
        homeTeam: 'Racing Club 75',
        awayTeam: 'AS Montparnasse',
        date: 'Dim 21 Avril',
        location: 'Paris 18e',
      },
    ],
    teams: [
      {
        id: 1,
        name: 'Les Tigres de Paris',
        members: 11,
        city: 'Paris',
        skillLevel: 'Intermédiaire',
      },
      {
        id: 2,
        name: 'FC Montmartre',
        members: 9,
        city: 'Paris',
        skillLevel: 'Amateur',
      },
      {
        id: 3,
        name: 'Racing Club 75',
        members: 15,
        city: 'Paris',
        skillLevel: 'Avancé',
      },
    ],
    players: [
      {
        id: 1,
        name: 'Jean Dupont',
        position: 'Attaquant',
        city: 'Paris 15e',
      },
      {
        id: 2,
        name: 'Marie Martin',
        position: 'Milieu',
        city: 'Paris 18e',
      },
      {
        id: 3,
        name: 'Thomas Dubois',
        position: 'Défenseur',
        city: 'Paris 14e',
      },
    ],
  });

  const handleSearch = query => {
    setSearchQuery(query);
    // Ici, on ferait un appel API pour rechercher
  };

  const handleRecentSearch = search => {
    setSearchQuery(search);
  };

  const handleRemoveRecentSearch = search => {
    // Supprimer de l'historique
  };

  const handlePopularSearch = search => {
    setSearchQuery(search);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const getFilteredResults = () => {
    if (!searchQuery) return null;

    switch (activeFilter) {
      case 'matches':
        return { matches: searchResults.matches };
      case 'teams':
        return { teams: searchResults.teams };
      case 'players':
        return { players: searchResults.players };
      default:
        return searchResults;
    }
  };

  const filteredResults = getFilteredResults();
  const hasResults =
    filteredResults &&
    (filteredResults.matches?.length > 0 ||
      filteredResults.teams?.length > 0 ||
      filteredResults.players?.length > 0);

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header avec barre de recherche */}
      <View style={[styles.header, { backgroundColor: COLORS.WHITE }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: COLORS.BACKGROUND_LIGHT,
                borderColor: COLORS.BORDER,
              },
            ]}
          >
            <Icon name="search" size={20} color={COLORS.TEXT_MUTED} />
            <TextInput
              style={[styles.searchInput, { color: COLORS.TEXT_PRIMARY }]}
              placeholder="Rechercher matchs, équipes, joueurs..."
              placeholderTextColor={COLORS.TEXT_MUTED}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Icon name="x" size={20} color={COLORS.TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtres */}
        {searchQuery.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            <FilterChip
              label="Tout"
              icon="grid"
              active={activeFilter === 'all'}
              onPress={() => setActiveFilter('all')}
              COLORS={COLORS}
            />
            <FilterChip
              label="Matchs"
              icon="calendar"
              active={activeFilter === 'matches'}
              onPress={() => setActiveFilter('matches')}
              COLORS={COLORS}
            />
            <FilterChip
              label="Équipes"
              icon="users"
              active={activeFilter === 'teams'}
              onPress={() => setActiveFilter('teams')}
              COLORS={COLORS}
            />
            <FilterChip
              label="Joueurs"
              icon="user"
              active={activeFilter === 'players'}
              onPress={() => setActiveFilter('players')}
              COLORS={COLORS}
            />
          </ScrollView>
        )}
      </View>

      {/* Contenu */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!searchQuery ? (
          // État initial - Recherches récentes et populaires
          <>
            {/* Recherches récentes */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: COLORS.TEXT_PRIMARY },
                    ]}
                  >
                    Recherches récentes
                  </Text>
                  <TouchableOpacity>
                    <Text style={[styles.clearText, { color: COLORS.PRIMARY }]}>
                      Effacer
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recentList}>
                  {recentSearches.map((search, index) => (
                    <RecentSearchItem
                      key={index}
                      search={search}
                      onPress={() => handleRecentSearch(search)}
                      onRemove={() => handleRemoveRecentSearch(search)}
                      COLORS={COLORS}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Recherches populaires */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}
                >
                  Recherches populaires
                </Text>
              </View>
              <View style={styles.popularGrid}>
                {popularSearches.map((search, index) => (
                  <PopularSearchItem
                    key={index}
                    search={search.text}
                    icon={search.icon}
                    onPress={() => handlePopularSearch(search.text)}
                    COLORS={COLORS}
                  />
                ))}
              </View>
            </View>

            {/* Suggestions */}
            <View
              style={[
                styles.suggestionBox,
                { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
              ]}
            >
              <Icon name="lightbulb" size={20} color={COLORS.PRIMARY} />
              <Text
                style={[styles.suggestionText, { color: COLORS.TEXT_PRIMARY }]}
              >
                Essayez de rechercher par nom d'équipe, ville, ou type de match
              </Text>
            </View>
          </>
        ) : !hasResults ? (
          // Aucun résultat
          <EmptyState
            icon="search"
            title="Aucun résultat"
            message={`Aucun résultat pour "${searchQuery}". Essayez avec d'autres mots-clés.`}
            COLORS={COLORS}
          />
        ) : (
          // Résultats de recherche
          <>
            {/* Matchs */}
            {filteredResults.matches && filteredResults.matches.length > 0 && (
              <View style={styles.resultsSection}>
                <View style={styles.resultsSectionHeader}>
                  <Icon name="calendar" size={18} color={COLORS.PRIMARY} />
                  <Text
                    style={[
                      styles.resultsSectionTitle,
                      { color: COLORS.TEXT_PRIMARY },
                    ]}
                  >
                    Matchs ({filteredResults.matches.length})
                  </Text>
                </View>
                <View style={styles.resultsList}>
                  {filteredResults.matches.map(match => (
                    <MatchResultCard
                      key={match.id}
                      match={match}
                      onPress={() =>
                        navigation.navigate('MatchDetail', {
                          matchId: match.id,
                        })
                      }
                      COLORS={COLORS}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Équipes */}
            {filteredResults.teams && filteredResults.teams.length > 0 && (
              <View style={styles.resultsSection}>
                <View style={styles.resultsSectionHeader}>
                  <Icon name="users" size={18} color={COLORS.PRIMARY} />
                  <Text
                    style={[
                      styles.resultsSectionTitle,
                      { color: COLORS.TEXT_PRIMARY },
                    ]}
                  >
                    Équipes ({filteredResults.teams.length})
                  </Text>
                </View>
                <View style={styles.resultsList}>
                  {filteredResults.teams.map(team => (
                    <TeamResultCard
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
            )}

            {/* Joueurs */}
            {filteredResults.players && filteredResults.players.length > 0 && (
              <View style={styles.resultsSection}>
                <View style={styles.resultsSectionHeader}>
                  <Icon name="user" size={18} color={COLORS.PRIMARY} />
                  <Text
                    style={[
                      styles.resultsSectionTitle,
                      { color: COLORS.TEXT_PRIMARY },
                    ]}
                  >
                    Joueurs ({filteredResults.players.length})
                  </Text>
                </View>
                <View style={styles.resultsList}>
                  {filteredResults.players.map(player => (
                    <PlayerResultCard
                      key={player.id}
                      player={player}
                      onPress={() =>
                        navigation.navigate('PlayerProfile', {
                          playerId: player.id,
                        })
                      }
                      COLORS={COLORS}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
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
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    marginBottom: DIMENSIONS.SPACING_SM,
    gap: DIMENSIONS.SPACING_SM,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    height: 48,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    gap: DIMENSIONS.SPACING_SM,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.SIZE.MD,
  },
  filtersContainer: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    gap: DIMENSIONS.SPACING_SM,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    borderWidth: 1,
    gap: DIMENSIONS.SPACING_XS,
  },
  filterChipText: {
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
  section: {
    marginBottom: DIMENSIONS.SPACING_XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  clearText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  recentList: {
    gap: DIMENSIONS.SPACING_XS,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DIMENSIONS.SPACING_SM,
  },
  recentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_MD,
    flex: 1,
  },
  recentText: {
    fontSize: FONTS.SIZE.MD,
  },
  removeButton: {
    padding: DIMENSIONS.SPACING_XS,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING_SM,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    gap: DIMENSIONS.SPACING_SM,
  },
  popularText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  suggestionBox: {
    flexDirection: 'row',
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: DIMENSIONS.SPACING_MD,
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: FONTS.SIZE.SM,
    flex: 1,
    lineHeight: FONTS.SIZE.SM * FONTS.LINE_HEIGHT.RELAXED,
  },
  resultsSection: {
    marginBottom: DIMENSIONS.SPACING_XL,
  },
  resultsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  resultsSectionTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  resultsList: {
    gap: DIMENSIONS.SPACING_SM,
  },
  resultCard: {
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    ...SHADOWS.SMALL,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  teamIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  resultInfo: {
    flex: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  teamNameSmall: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  vsTextSmall: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  teamNameResult: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  playerName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  matchMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING_MD,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  metaText: {
    fontSize: FONTS.SIZE.XS,
  },
  skillBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: 2,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XXS,
  },
  skillText: {
    fontSize: FONTS.SIZE.XXS,
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
    paddingHorizontal: DIMENSIONS.SPACING_XL,
  },
});
