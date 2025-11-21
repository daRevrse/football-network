// ====== src/screens/teams/TeamDetailScreen.js ======
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
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { teamsApi } from '../../services/api';
import { API_CONFIG } from '../../utils/constants';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

const StatBox = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const TeamDetailScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await teamsApi.getTeamById(teamId);
      if (result.success) setTeam(result.data);
    } catch (e) {
      Alert.alert('Erreur', "Impossible de charger l'équipe");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [teamId]),
  );

  if (loading || !team)
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={THEME.ACCENT} />
      </View>
    );

  const isOwner = team.role === 'owner' || team.role === 'captain';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER AVEC BANNIÈRE */}
      <View style={styles.headerWrapper}>
        {/* Image de Bannière */}
        {team.bannerUrl && (
          <Image
            source={{
              uri: API_CONFIG.BASE_URL.replace('/api', '') + team.bannerUrl,
            }}
            style={styles.bannerImage}
          />
        )}
        {/* Gradient Overlay pour lisibilité */}
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.3)', 'rgba(15, 23, 42, 0.8)', THEME.BG]}
          style={styles.headerOverlay}
        />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
          >
            <Icon name="arrow-left" size={24} color={THEME.TEXT} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            {isOwner && (
              <TouchableOpacity
                onPress={() => navigation.navigate('EditTeam', { teamId })}
                style={styles.iconBtn}
              >
                <Icon name="edit-2" size={20} color={THEME.TEXT} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn}>
              <Icon name="share-2" size={20} color={THEME.TEXT} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Équipe (Logo Centré) */}
        <View style={styles.teamHeader}>
          <View style={styles.logoPlaceholder}>
            {team.logoUrl ? (
              <Image
                source={{
                  uri: API_CONFIG.BASE_URL.replace('/api', '') + team.logoUrl,
                }}
                style={styles.teamLogo}
              />
            ) : (
              <Icon name="shield" size={48} color={THEME.ACCENT} />
            )}
          </View>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamLoc}>
            {team.locationCity} • {team.skillLevel}
          </Text>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            tintColor={THEME.ACCENT}
          />
        }
        contentContainerStyle={styles.content}
      >
        {/* STATS ROW */}
        <View style={styles.statsRow}>
          <StatBox label="Matchs" value={team.stats.matchesPlayed || 0} />
          <View style={styles.divider} />
          <StatBox label="Victoires" value={team.stats.matchesWon || 0} />
          <View style={styles.divider} />
          <StatBox label="Membres" value={team.members.length || 0} />
        </View>

        {/* MENU */}
        <Text style={styles.sectionTitle}>Gestion d'équipe</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            navigation.navigate('TeamMembers', {
              teamId,
              teamName: team.name,
            })
          }
        >
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, { backgroundColor: '#3B82F620' }]}>
              <Icon name="users" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>Voir les membres</Text>
          </View>
          <Icon name="chevron-right" size={20} color={THEME.TEXT_SEC} />
        </TouchableOpacity>

        {isOwner && (
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F59E0B20' }]}>
                <Icon name="calendar" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.menuText}>Planifier un match</Text>
            </View>
            <Icon name="chevron-right" size={20} color={THEME.TEXT_SEC} />
          </TouchableOpacity>
        )}

        {/* DESCRIPTION */}
        <Text style={styles.sectionTitle}>À propos</Text>
        <Text style={styles.description}>
          {team.description || 'Aucune description pour le moment.'}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  center: { justifyContent: 'center', alignItems: 'center' },

  // HEADER STYLES
  headerWrapper: {
    height: 320, // Hauteur fixe pour le header
    justifyContent: 'flex-end',
    paddingBottom: 20,
    position: 'relative',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)', // Fond sombre semi-transparent
    borderRadius: 12,
  },

  teamHeader: { alignItems: 'center', marginBottom: 10, zIndex: 5 },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: `${THEME.ACCENT}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: `${THEME.ACCENT}50`,
    overflow: 'hidden',
  },
  teamLogo: { width: '100%', height: '100%' },
  teamName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  teamLoc: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    textTransform: 'capitalize',
  },

  content: { padding: 24 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: THEME.TEXT },
  statLabel: { fontSize: 12, color: THEME.TEXT_SEC, marginTop: 4 },
  divider: { width: 1, height: 30, backgroundColor: THEME.BORDER },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.TEXT_SEC,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { fontSize: 16, color: THEME.TEXT, fontWeight: '600' },

  description: { fontSize: 14, color: THEME.TEXT_SEC, lineHeight: 22 },
});
