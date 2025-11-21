// ====== src/screens/teams/MyTeamsScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { teamsApi } from '../../services/api';
import { API_CONFIG } from '../../utils/constants';

const { width } = Dimensions.get('window');

// Thème Premium Night
const THEME = {
  BG: '#0F172A', // Slate 900
  SURFACE: '#1E293B', // Slate 800
  SURFACE_LIGHT: '#334155', // Slate 700
  TEXT: '#F8FAFC', // Slate 50
  TEXT_SEC: '#94A3B8', // Slate 400
  ACCENT: '#22C55E', // Green 500
  BORDER: '#334155', // Slate 700
  CAPTAIN: '#F59E0B', // Amber 500
  PRIMARY: '#3B82F6', // Blue 500
};

const TeamCard = ({ team, onPress, onManage }) => {
  const isCaptain = team.role === 'owner' || team.role === 'captain';

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Fond de carte : Bannière ou Dégradé */}
      <View style={styles.cardBackground}>
        {team.bannerUrl ? (
          <Image
            source={{
              uri: API_CONFIG.BASE_URL.replace('/api', '') + team.bannerUrl,
            }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}
        <LinearGradient
          colors={
            team.bannerUrl
              ? ['rgba(15, 23, 42, 0.7)', 'rgba(15, 23, 42, 0.95)']
              : [THEME.SURFACE, '#111827']
          }
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Contenu de la carte */}
      <View style={styles.cardContent}>
        {/* Header: Logo + Info + Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.logoContainer}>
            {team.logoUrl ? (
              <Image
                source={{
                  uri: API_CONFIG.BASE_URL.replace('/api', '') + team.logoUrl,
                }}
                style={styles.logoImage}
              />
            ) : (
              <LinearGradient
                colors={[THEME.ACCENT, '#166534']}
                style={styles.logoPlaceholder}
              >
                <Icon name="shield" size={24} color="#FFF" />
              </LinearGradient>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.teamName} numberOfLines={1}>
                {team.name}
              </Text>
              {isCaptain && (
                <View style={styles.roleBadge}>
                  <Icon name="star" size={10} color="#000" />
                  <Text style={styles.roleText}>CAPITAINE</Text>
                </View>
              )}
            </View>
            <Text style={styles.teamLocation}>
              <Icon name="map-pin" size={10} color={THEME.TEXT_SEC} />{' '}
              {team.locationCity || 'Non localisé'}
            </Text>
          </View>

          {/* Bouton Gestion (seulement si capitaine) */}
          {isCaptain && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={e => {
                e.stopPropagation();
                onManage();
              }}
            >
              <Icon name="more-vertical" size={20} color={THEME.TEXT_SEC} />
            </TouchableOpacity>
          )}
        </View>

        {/* Séparateur subtil */}
        <View style={styles.separator} />

        {/* Stats Footer */}
        <View style={styles.statsFooter}>
          <View style={styles.statItem}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
              ]}
            >
              <Icon name="users" size={14} color="#60A5FA" />
            </View>
            <Text style={styles.statValue}>{team.currentPlayers || 0}</Text>
            <Text style={styles.statLabel}>Membres</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statItem}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
              ]}
            >
              <Icon name="calendar" size={14} color="#4ADE80" />
            </View>
            <Text style={styles.statValue}>
              {team.stats.matchesPlayed || 0}
            </Text>
            <Text style={styles.statLabel}>Matchs</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statItem}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
              ]}
            >
              <Icon name="award" size={14} color="#FBBF24" />
            </View>
            <Text style={styles.statValue}>{team.stats.matchesWon || 0}</Text>
            <Text style={styles.statLabel}>Victoires</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const MyTeamsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, []),
  );

  const loadTeams = async () => {
    try {
      const result = await teamsApi.getMyTeams();
      if (result.success) setTeams(result.data);
    } catch (e) {
      Alert.alert('Erreur', 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Équipes</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={styles.searchBtn}
        >
          <Icon name="search" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.ACCENT}
          />
        }
      >
        {teams.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Icon name="shield" size={64} color={THEME.SURFACE_LIGHT} />
            <Text style={styles.emptyText}>Aucune équipe pour le moment.</Text>
            <Text style={styles.emptySubText}>
              Rejoignez le jeu dès maintenant !
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateTeam')}
            >
              <Text style={styles.createBtnText}>Créer une équipe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          teams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              onPress={() =>
                navigation.navigate('TeamDetail', {
                  teamId: team.id,
                  teamName: team.name,
                })
              }
              onManage={() =>
                navigation.navigate('EditTeam', { teamId: team.id })
              }
            />
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTeam')}
      >
        <LinearGradient
          colors={[THEME.ACCENT, '#16A34A']}
          style={styles.fabGradient}
        >
          <Icon name="plus" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: THEME.BG,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.TEXT,
    letterSpacing: 0.5,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  content: { padding: 20 },

  // TEAM CARD
  cardContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 150, // Hauteur fixe pour uniformité
    borderWidth: 1,
    borderColor: THEME.BORDER,
    backgroundColor: THEME.SURFACE,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  infoContainer: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.TEXT,
    marginRight: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.CAPTAIN,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: { fontSize: 9, fontWeight: '900', color: '#000' },

  teamLocation: {
    fontSize: 12,
    color: THEME.TEXT_SEC,
    fontWeight: '500',
  },
  manageButton: {
    padding: 8,
  },

  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 10,
  },

  // Card Stats Footer
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginRight: 4,
  },
  statLabel: { fontSize: 12, color: THEME.TEXT_SEC },

  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // EMPTY STATE
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: {
    color: THEME.TEXT,
    marginTop: 24,
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: THEME.TEXT_SEC,
    marginTop: 8,
    fontSize: 14,
    marginBottom: 32,
  },
  createBtn: {
    backgroundColor: THEME.ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: THEME.ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  createBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    borderRadius: 28,
    shadowColor: THEME.ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
