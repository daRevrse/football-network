// ====== src/screens/search/SearchScreen.js ======
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Dimensions,
  Platform,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { searchApi } from '../../services/api/searchApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Thème Premium Night
const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  INPUT_BG: '#334155',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  PRIMARY: '#3B82F6',
};

const { width } = Dimensions.get('window');

// --- COMPOSANTS ---

const FilterChip = ({ label, icon, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterChip, active && styles.filterChipActive]}
  >
    <Icon name={icon} size={14} color={active ? '#000' : THEME.TEXT_SEC} />
    <Text
      style={[
        styles.filterText,
        active && { color: '#000', fontWeight: 'bold' },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const ResultCard = ({ title, subtitle, icon, type, onPress, badge }) => {
  // Déterminer la couleur en fonction du type
  const getTypeColor = () => {
    switch (type) {
      case 'player':
        return { bg: '#3B82F620', color: '#3B82F6' };
      case 'match':
        return { bg: '#F59E0B20', color: '#F59E0B' };
      default:
        return { bg: '#22C55E20', color: THEME.ACCENT };
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
      <Icon name="chevron-right" size={20} color={THEME.TEXT_SEC} />
    </TouchableOpacity>
  );
};

const EmptyState = ({ icon, title, message }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconBox}>
      <Icon name={icon} size={32} color={THEME.TEXT_SEC} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
  </View>
);

export const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
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

  // Charger les recherches récentes au montage
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Gestion de la recherche avec Debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length > 2) {
      setLoading(true);
      searchTimeout.current = setTimeout(() => performSearch(), 600);
    } else {
      setResults({ teams: [], matches: [], players: [] });
      setLoading(false);
    }
  }, [query, activeFilter]);

  // Charger les recherches récentes depuis AsyncStorage
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

  // Sauvegarder une recherche dans les recherches récentes
  const saveToRecentSearches = async searchQuery => {
    try {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      // Éviter les doublons et limiter à 10 recherches
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

      // Mapper le filtre actif au type d'API
      const searchType = activeFilter;

      // Appel à l'API de recherche
      const response = await searchApi.search(query, searchType);

      if (response.success) {
        setResults({
          teams: response.results.teams || [],
          players: response.results.players || [],
          matches: response.results.matches || [],
        });

        // Sauvegarder dans les recherches récentes
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER RECHERCHE */}
      <View style={styles.header}>
        <View style={styles.searchBarRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Icon name="arrow-left" size={24} color={THEME.TEXT} />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <Icon
              name="search"
              size={20}
              color={THEME.TEXT_SEC}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Équipes, joueurs, matchs..."
              placeholderTextColor={THEME.TEXT_SEC}
              value={query}
              onChangeText={setQuery}
              autoFocus={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear}>
                <Icon name="x" size={18} color={THEME.TEXT} />
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
          </ScrollView>
        </View>
      </View>

      {/* CONTENU */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={{ marginTop: 50 }}>
            <ActivityIndicator size="large" color={THEME.ACCENT} />
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
                <Icon name="clock" size={16} color={THEME.TEXT_SEC} />
                <Text style={styles.recentText}>{item}</Text>
                <Icon name="arrow-up-left" size={16} color={THEME.BORDER} />
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
                        // Navigation vers le profil du joueur (à implémenter)
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
                        // Navigation vers le détail du match
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
  container: { flex: 1, backgroundColor: THEME.BG },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    backgroundColor: THEME.BG,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
    paddingBottom: 12,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: { marginRight: 16 },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: THEME.TEXT,
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
    borderRadius: 20,
    backgroundColor: THEME.SURFACE,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: THEME.ACCENT,
    borderColor: THEME.ACCENT,
  },
  filterText: {
    color: THEME.TEXT_SEC,
    fontSize: 13,
    fontWeight: '600',
  },

  // Content
  content: { flex: 1 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: {
    color: THEME.ACCENT,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  recentText: {
    flex: 1,
    color: THEME.TEXT,
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
    backgroundColor: THEME.SURFACE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  tagText: {
    color: THEME.PRIMARY,
    fontWeight: '600',
  },

  // Results
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 2,
  },
  resultSub: {
    fontSize: 13,
    color: THEME.TEXT_SEC,
  },
  badge: {
    backgroundColor: THEME.BORDER,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 10,
    color: THEME.TEXT,
  },

  // Empty
  emptyState: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
  },
  emptyMessage: { fontSize: 14, color: THEME.TEXT_SEC, textAlign: 'center' },
});
