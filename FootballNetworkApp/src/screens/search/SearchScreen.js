// ====== src/screens/search/SearchScreen.js - VERSION COMPLÈTE AVEC BACKEND ======
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { teamsApi } from '../../services/api/teamsApi';
import { matchesApi } from '../../services/api/matchesApi';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// ============ COMPOSANTS UTILITAIRES ============

// Composant FilterChip
const FilterChip = ({ label, icon, active, onPress, COLORS }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.filterChip,
      {
        backgroundColor: active ? 'transparent' : COLORS.BACKGROUND_LIGHT,
        borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
      },
    ]}
  >
    {active ? (
      <LinearGradient
        colors={[COLORS.PRIMARY || '#22C55E', COLORS.PRIMARY_DARK || '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.filterGradient}
      >
        <Icon name={icon} size={16} color={COLORS.WHITE || '#FFFFFF'} />
        <Text style={[styles.filterText, { color: COLORS.WHITE || '#FFFFFF' }]}>
          {label}
        </Text>
      </LinearGradient>
    ) : (
      <View style={styles.filterContent}>
        <Icon name={icon} size={16} color={COLORS.TEXT_MUTED || '#9CA3AF'} />
        <Text
          style={[styles.filterText, { color: COLORS.TEXT_MUTED || '#9CA3AF' }]}
        >
          {label}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// Composant RecentSearchItem
const RecentSearchItem = ({ search, onPress, onRemove, COLORS }) => (
  <TouchableOpacity
    style={[
      styles.recentItem,
      {
        backgroundColor: COLORS.BACKGROUND_LIGHT,
        borderColor: COLORS.BORDER,
      },
    ]}
    onPress={onPress}
  >
    <Icon name="clock" size={16} color={COLORS.TEXT_MUTED} />
    <View style={styles.recentContent}>
      <Text style={[styles.recentText, { color: COLORS.TEXT_PRIMARY }]}>
        {search}
      </Text>
    </View>
    <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
      <Icon name="x" size={16} color={COLORS.TEXT_MUTED} />
    </TouchableOpacity>
  </TouchableOpacity>
);

// Composant PopularSearchItem
const PopularSearchItem = ({ search, icon, onPress, COLORS }) => (
  <TouchableOpacity
    style={[
      styles.popularItem,
      {
        backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT,
        borderColor: COLORS.PRIMARY_LIGHT,
      },
    ]}
    onPress={onPress}
  >
    <Icon name={icon} size={16} color={COLORS.PRIMARY} />
    <Text style={[styles.popularText, { color: COLORS.PRIMARY }]}>
      {search}
    </Text>
  </TouchableOpacity>
);

// Composant TeamResultCard
const TeamResultCard = ({ team, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.resultCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.resultHeader}>
      <View
        style={[
          styles.teamIconLarge,
          { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name="users" size={24} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.teamNameResult, { color: COLORS.TEXT_PRIMARY }]}>
          {team.name}
        </Text>
        <View style={styles.matchMeta}>
          <View style={styles.metaItem}>
            <Icon name="users" size={12} color={COLORS.TEXT_MUTED} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_MUTED }]}>
              {team.currentPlayers}/{team.maxPlayers} joueurs
            </Text>
          </View>
          {team.locationCity && (
            <View style={styles.metaItem}>
              <Icon name="map-pin" size={12} color={COLORS.TEXT_MUTED} />
              <Text style={[styles.metaText, { color: COLORS.TEXT_MUTED }]}>
                {team.locationCity}
              </Text>
            </View>
          )}
        </View>
        {team.skillLevel && (
          <View
            style={[
              styles.skillBadgeSmall,
              { backgroundColor: COLORS.PRIMARY_LIGHT },
            ]}
          >
            <Icon name="award" size={10} color={COLORS.PRIMARY} />
            <Text style={[styles.skillText, { color: COLORS.PRIMARY }]}>
              {team.skillLevel.toUpperCase()}
            </Text>
          </View>
        )}
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
    activeOpacity={0.7}
  >
    <View style={styles.resultHeader}>
      <View
        style={[
          styles.playerAvatar,
          { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name="user" size={24} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.playerName, { color: COLORS.TEXT_PRIMARY }]}>
          {player.firstName} {player.lastName}
        </Text>
        <View style={styles.matchMeta}>
          {player.position && (
            <View style={styles.metaItem}>
              <Icon name="target" size={12} color={COLORS.TEXT_MUTED} />
              <Text style={[styles.metaText, { color: COLORS.TEXT_MUTED }]}>
                {player.position}
              </Text>
            </View>
          )}
          {player.skillLevel && (
            <View
              style={[
                styles.skillBadgeSmall,
                { backgroundColor: COLORS.PRIMARY_LIGHT },
              ]}
            >
              <Icon name="award" size={10} color={COLORS.PRIMARY} />
              <Text style={[styles.skillText, { color: COLORS.PRIMARY }]}>
                {player.skillLevel.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
    </View>
  </TouchableOpacity>
);

// Composant MatchResultCard
const MatchResultCard = ({ match, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.resultCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.teamsRow}>
      <Text style={[styles.teamNameSmall, { color: COLORS.TEXT_PRIMARY }]}>
        {match.homeTeamName}
      </Text>
      <Text style={[styles.vsTextSmall, { color: COLORS.PRIMARY }]}>VS</Text>
      <Text style={[styles.teamNameSmall, { color: COLORS.TEXT_PRIMARY }]}>
        {match.awayTeamName}
      </Text>
    </View>
    <View style={styles.matchMeta}>
      <View style={styles.metaItem}>
        <Icon name="calendar" size={12} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.metaText, { color: COLORS.TEXT_MUTED }]}>
          {new Date(match.matchDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>
      {match.location && (
        <View style={styles.metaItem}>
          <Icon name="map-pin" size={12} color={COLORS.TEXT_MUTED} />
          <Text style={[styles.metaText, { color: COLORS.TEXT_MUTED }]}>
            {match.location}
          </Text>
        </View>
      )}
    </View>
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

// ============ COMPOSANT PRINCIPAL ============

export const SearchScreen = ({ navigation }) => {
  const { colors: COLORS, isDark } = useTheme('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Résultats de recherche
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  // Historique et suggestions
  const [recentSearches, setRecentSearches] = useState([
    'Les Tigres de Paris',
    'Match amical Paris',
    'FC Olympique',
  ]);

  const [popularSearches] = useState([
    { text: 'Matchs ce weekend', icon: 'calendar' },
    { text: 'Équipes à Paris', icon: 'map-pin' },
    { text: 'Joueurs débutants', icon: 'users' },
  ]);

  // Debounce pour la recherche
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Recherche quand l'utilisateur tape
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim().length >= 2) {
      const timeout = setTimeout(() => {
        handleSearch();
      }, 500); // Attendre 500ms après la dernière frappe
      setSearchTimeout(timeout);
    } else {
      setTeams([]);
      setPlayers([]);
      setMatches([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  // Charger les données au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      // Peut charger des données par défaut ici si nécessaire
    }, []),
  );

  // ============ FONCTIONS DE RECHERCHE ============

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return;
    }

    try {
      setLoading(true);

      // Rechercher selon le filtre actif
      if (activeFilter === 'all' || activeFilter === 'teams') {
        await searchTeams();
      }
      if (activeFilter === 'all' || activeFilter === 'players') {
        await searchPlayers();
      }
      if (activeFilter === 'all' || activeFilter === 'matches') {
        await searchMatches();
      }

      // Ajouter à l'historique
      if (!recentSearches.includes(searchQuery.trim())) {
        setRecentSearches(prev => [searchQuery.trim(), ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const searchTeams = async () => {
    try {
      const result = await teamsApi.searchTeams({
        search: searchQuery,
        limit: 10,
        offset: 0,
      });

      if (result.success) {
        setTeams(result.data || []);
      } else {
        console.error('Teams search error:', result.error);
        setTeams([]);
      }
    } catch (error) {
      console.error('Teams search error:', error);
      setTeams([]);
    }
  };

  const searchPlayers = async () => {
    try {
      const result = await teamsApi.searchPlayers(searchQuery);

      if (result.success) {
        setPlayers(result.data || []);
      } else {
        console.error('Players search error:', result.error);
        setPlayers([]);
      }
    } catch (error) {
      console.error('Players search error:', error);
      setPlayers([]);
    }
  };

  const searchMatches = async () => {
    try {
      const result = await matchesApi.getMatches({
        search: searchQuery,
        limit: 10,
      });

      if (result.success) {
        setMatches(result.data || []);
      } else {
        console.error('Matches search error:', result.error);
        setMatches([]);
      }
    } catch (error) {
      console.error('Matches search error:', error);
      setMatches([]);
    }
  };

  // ============ GESTIONNAIRES D'ÉVÉNEMENTS ============

  const handleRecentSearch = search => {
    setSearchQuery(search);
  };

  const handleRemoveRecentSearch = search => {
    setRecentSearches(prev => prev.filter(s => s !== search));
  };

  const handlePopularSearch = search => {
    setSearchQuery(search);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setTeams([]);
    setPlayers([]);
    setMatches([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (searchQuery.trim().length >= 2) {
      await handleSearch();
    }
    setRefreshing(false);
  };

  // ============ FILTRAGE DES RÉSULTATS ============

  const getFilteredResults = () => {
    if (!searchQuery || searchQuery.trim().length < 2) return null;

    switch (activeFilter) {
      case 'matches':
        return { matches };
      case 'teams':
        return { teams };
      case 'players':
        return { players };
      default:
        return { matches, teams, players };
    }
  };

  const filteredResults = getFilteredResults();
  const hasResults =
    filteredResults &&
    (filteredResults.matches?.length > 0 ||
      filteredResults.teams?.length > 0 ||
      filteredResults.players?.length > 0);

  // ============ RENDU ============

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.WHITE}
      />

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
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSearch}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        )}

        {!searchQuery || searchQuery.trim().length < 2 ? (
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
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
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
        ) : !hasResults && !loading ? (
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
                        navigation.navigate('Matches', {
                          screen: 'MatchDetail',
                          params: { matchId: match.id },
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
                        navigation.navigate('Teams', {
                          screen: 'TeamDetail',
                          params: { teamId: team.id },
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
                      onPress={() => {
                        // Navigation vers le profil du joueur
                        Alert.alert('Info', 'Profil du joueur à implémenter');
                      }}
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

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: DIMENSIONS.SPACING_MD,
    ...SHADOWS.SMALL,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_LG,
    gap: DIMENSIONS.SPACING_MD,
  },
  backButton: {
    padding: DIMENSIONS.SPACING_SM,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    gap: DIMENSIONS.SPACING_SM,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.SIZE.MD,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  filtersContainer: {
    paddingHorizontal: DIMENSIONS.SPACING_LG,
    paddingTop: DIMENSIONS.SPACING_MD,
    gap: DIMENSIONS.SPACING_SM,
  },
  filterChip: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    gap: DIMENSIONS.SPACING_XS,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    gap: DIMENSIONS.SPACING_XS,
  },
  filterText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DIMENSIONS.SPACING_LG,
  },
  loadingContainer: {
    paddingVertical: DIMENSIONS.SPACING_XXL,
    alignItems: 'center',
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
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  recentList: {
    gap: DIMENSIONS.SPACING_SM,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
    gap: DIMENSIONS.SPACING_MD,
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
    marginTop: DIMENSIONS.SPACING_XS,
    alignSelf: 'flex-start',
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
