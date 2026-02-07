/**
 * SearchScreen - Recherche
 * Design Foot Connect Premium
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform,
  Keyboard,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { searchApi } from '../../services/api/searchApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { width } = Dimensions.get('window');

// --- COMPOSANTS ---

const FilterChip = ({ label, icon, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterChip, active && styles.filterChipActive]}
  >
    <Icon name={icon} size={14} color={active ? COLORS.DARK : COLORS.WHITE} />
    <Text
      style={[
        styles.filterText,
        active && { color: COLORS.DARK, fontWeight: 'bold' },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const ResultCard = ({ title, subtitle, icon, type, onPress, badge }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'player':
        return { bg: `${COLORS.INFO}20`, color: COLORS.INFO };
      case 'match':
        return { bg: `${COLORS.WARNING}20`, color: COLORS.WARNING };
      default:
        return { bg: `${COLORS.PRIMARY}20`, color: COLORS.PRIMARY };
    }
  };

  const typeColor = getTypeColor();

  return (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: typeColor.bg }]}>
        <Icon name={icon} size={20} color={typeColor.color} />
      </View>
      <View style={styles.resultContent}>
        <View style={styles.titleRow}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {title}
          </Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.resultSub}>{subtitle}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.WHITE} />
    </TouchableOpacity>
  );
};

const EmptyState = ({ icon, title, message }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconBox}>
      <Icon name={icon} size={32} color={COLORS.PRIMARY} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
  </View>
);

export const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [mercatoFilter, setMercatoFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    teams: [],
    matches: [],
    players: [],
  });
  const [recentSearches, setRecentSearches] = useState([
    'Paris FC',
    'Ligue 1',
    'Zidane',
  ]);

  const searchTimeout = useRef(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length > 2) {
      setLoading(true);
      searchTimeout.current = setTimeout(() => performSearch(), 600);
    } else {
      setResults({ teams: [], matches: [], players: [] });
      setLoading(false);
    }
  }, [query, activeFilter, mercatoFilter]);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem('recentSearches');
      if (saved) {
        const searches = JSON.parse(saved);
        setRecentSearches(searches);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recherches récentes:', error);
    }
  };

  const saveToRecentSearches = async searchQuery => {
    try {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      const updatedSearches = [
        trimmedQuery,
        ...recentSearches.filter(s => s !== trimmedQuery),
      ].slice(0, 10);

      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(
        'recentSearches',
        JSON.stringify(updatedSearches),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la sauvegarde des recherches récentes:',
        error,
      );
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);

      const searchType = activeFilter;
      const response = await searchApi.search(query, searchType);

      if (response.success) {
        let teams = response.results.teams || [];

        if (mercatoFilter && teams.length > 0) {
          teams = teams.filter(team => team.mercatoActif === true);
        }

        setResults({
          teams: teams,
          players: response.results.players || [],
          matches: response.results.matches || [],
        });

        saveToRecentSearches(query);
      } else {
        setResults({ teams: [], matches: [], players: [] });
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults({ teams: [], matches: [], players: [] });
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    Keyboard.dismiss();
  };

  const hasResults =
    results.teams.length > 0 ||
    results.players.length > 0 ||
    results.matches.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK} />

      {/* HEADER RECHERCHE */}
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK, COLORS.DARK]}
        style={styles.header}
      >
        <View style={styles.searchBarRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Icon name="arrow-left" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <Icon
              name="search"
              size={20}
              color={COLORS.WHITE}
              style={{ marginRight: 10, opacity: 0.7 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Équipes, joueurs, matchs..."
              placeholderTextColor={`${COLORS.WHITE}60`}
              value={query}
              onChangeText={setQuery}
              autoFocus={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear}>
                <Icon name="x" size={18} color={COLORS.WHITE} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FILTRES */}
        <View style={styles.filtersRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            <FilterChip
              label="Tout"
              icon="grid"
              active={activeFilter === 'all'}
              onPress={() => setActiveFilter('all')}
            />
            <FilterChip
              label="Équipes"
              icon="shield"
              active={activeFilter === 'teams'}
              onPress={() => setActiveFilter('teams')}
            />
            <FilterChip
              label="Joueurs"
              icon="user"
              active={activeFilter === 'players'}
              onPress={() => setActiveFilter('players')}
            />
            <FilterChip
              label="Matchs"
              icon="calendar"
              active={activeFilter === 'matches'}
              onPress={() => setActiveFilter('matches')}
            />
            {(activeFilter === 'teams' || activeFilter === 'all') && (
              <FilterChip
                label="Mercato Ouvert"
                icon="user-check"
                active={mercatoFilter}
                onPress={() => setMercatoFilter(!mercatoFilter)}
              />
            )}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* CONTENU */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={{ marginTop: 50 }}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : query.length < 3 ? (
          // VUE INITIALE (Recherches récentes)
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recherches récentes</Text>
            {recentSearches.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentItem}
                onPress={() => setQuery(item)}
              >
                <Icon name="clock" size={16} color={COLORS.WHITE} />
                <Text style={styles.recentText}>{item}</Text>
                <Icon name="arrow-up-left" size={16} color={COLORS.BORDER} />
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
              Tendances
            </Text>
            <View style={styles.tagsContainer}>
              {['#Mercato', '#TournoiParis', '#Foot5', '#Recrutement'].map(
                (tag, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.tag}
                    onPress={() => setQuery(tag)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>
        ) : !hasResults ? (
          // AUCUN RÉSULTAT
          <View style={{ marginTop: 50 }}>
            <EmptyState
              icon="search"
              title="Aucun résultat"
              message={`Nous n'avons rien trouvé pour "${query}"`}
            />
          </View>
        ) : (
          // RÉSULTATS
          <View style={styles.resultsContainer}>
            {/* Équipes */}
            {(activeFilter === 'all' || activeFilter === 'teams') &&
              results.teams.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Équipes</Text>
                  {results.teams.map(team => (
                    <ResultCard
                      key={team.id}
                      title={team.name}
                      subtitle={`${team.city} • ${team.members} membres`}
                      icon="shield"
                      type="team"
                      badge={team.mercatoActif ? '✓ Recrute' : '✗ Fermé'}
                      onPress={() =>
                        navigation.navigate('Teams', {
                          screen: 'TeamDetail',
                          params: { teamId: team.id },
                        })
                      }
                    />
                  ))}
                </View>
              )}

            {/* Joueurs */}
            {(activeFilter === 'all' || activeFilter === 'players') &&
              results.players.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Joueurs</Text>
                  {results.players.map(player => (
                    <ResultCard
                      key={player.id}
                      title={player.name}
                      subtitle={player.position || 'Position non définie'}
                      icon="user"
                      type="player"
                      badge={
                        player.teams_count > 0
                          ? `${player.teams_count} équipe${player.teams_count > 1 ? 's' : ''}`
                          : null
                      }
                      onPress={() => {
                        console.log('Navigation vers profil joueur:', player.id);
                      }}
                    />
                  ))}
                </View>
              )}

            {/* Matchs */}
            {(activeFilter === 'all' || activeFilter === 'matches') &&
              results.matches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Matchs</Text>
                  {results.matches.map(match => (
                    <ResultCard
                      key={match.id}
                      title={`${match.team1.name} vs ${match.team2.name}`}
                      subtitle={`${match.location} • ${new Date(match.date).toLocaleDateString('fr-FR')}`}
                      icon="calendar"
                      type="match"
                      badge={match.status}
                      onPress={() => {
                        console.log('Navigation vers match:', match.id);
                      }}
                    />
                  ))}
                </View>
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
    backgroundColor: COLORS.DARK,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 16,
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GLASS,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.WHITE,
    height: '100%',
  },

  // Filters
  filtersRow: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.GLASS,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY_LIGHT,
  },
  filterText: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },

  // Recent Items
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  recentText: {
    flex: 1,
    color: COLORS.WHITE,
    fontSize: 15,
    marginLeft: 12,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: COLORS.DARK_CARD,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  tagText: {
    color: COLORS.PRIMARY_LIGHT,
    fontWeight: '600',
  },

  // Results
  resultsContainer: {},
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  resultContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 2,
    flex: 1,
  },
  resultSub: {
    fontSize: 13,
    color: COLORS.WHITE,
    opacity: 0.7,
  },
  badge: {
    backgroundColor: COLORS.BORDER,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: '600',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.WHITE,
    textAlign: 'center',
    opacity: 0.7,
  },
});
