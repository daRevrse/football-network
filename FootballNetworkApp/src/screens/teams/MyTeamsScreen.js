/**
 * MyTeamsScreen - Mes Équipes
 * Design Foot Connect Premium
 */

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
import { Feather as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { teamsApi } from '../../services/api';
import { API_CONFIG } from '../../utils/constants';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { width } = Dimensions.get('window');

const TeamCard = ({ team, onPress, onManage }) => {
  const isOwner = team.role === 'owner';
  const isCaptain = team.role === 'captain';
  const canManage = isOwner || isCaptain;

  const getRoleBadge = () => {
    if (isOwner) {
      return { text: 'MANAGER', icon: 'shield', color: COLORS.PRIMARY };
    }
    if (isCaptain) {
      return { text: 'CAPITAINE', icon: 'star', color: COLORS.WARNING };
    }
    return null;
  };

  const roleBadge = getRoleBadge();

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Fond de carte */}
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
              ? ['rgba(10, 10, 10, 0.6)', 'rgba(10, 10, 10, 0.95)']
              : [COLORS.DARK_CARD, COLORS.DARK]
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
                colors={GRADIENTS.button}
                style={styles.logoPlaceholder}
              >
                <Icon name="shield" size={24} color={COLORS.WHITE} />
              </LinearGradient>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.teamName} numberOfLines={1}>
                {team.name}
              </Text>
              {roleBadge && (
                <View style={[styles.roleBadge, { backgroundColor: `${roleBadge.color}20`, borderColor: roleBadge.color }]}>
                  <Icon name={roleBadge.icon} size={10} color={roleBadge.color} />
                  <Text style={[styles.roleText, { color: roleBadge.color }]}>{roleBadge.text}</Text>
                </View>
              )}
            </View>
            <Text style={styles.teamLocation}>
              <Icon name="map-pin" size={10} color={COLORS.WHITE} />{' '}
              {team.locationCity || 'Non localisé'}
            </Text>
          </View>

          {canManage && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={e => {
                e.stopPropagation();
                onManage();
              }}
            >
              <Icon name="more-vertical" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
          )}
        </View>

        {/* Séparateur */}
        <View style={styles.separator} />

        {/* Stats Footer */}
        <View style={styles.statsFooter}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.INFO}15` }]}>
              <Icon name="users" size={14} color={COLORS.INFO} />
            </View>
            <Text style={styles.statValue}>{team.currentPlayers || 0}</Text>
            <Text style={styles.statLabel}>Membres</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.PRIMARY}15` }]}>
              <Icon name="calendar" size={14} color={COLORS.PRIMARY_LIGHT} />
            </View>
            <Text style={styles.statValue}>
              {team.stats.matchesPlayed || 0}
            </Text>
            <Text style={styles.statLabel}>Matchs</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.WARNING}15` }]}>
              <Icon name="award" size={14} color={COLORS.WARNING} />
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK, COLORS.DARK]}
        style={styles.header}
      >
        <Text style={styles.title}>Mes Équipes</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={styles.searchBtn}
        >
          <Icon name="search" size={22} color={COLORS.WHITE} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Liste */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {teams.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Icon name="shield" size={48} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.emptyText}>Aucune équipe pour le moment</Text>
            <Text style={styles.emptySubText}>
              Rejoignez le jeu dès maintenant !
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateTeam')}
            >
              <LinearGradient
                colors={GRADIENTS.button}
                style={styles.createBtnGradient}
              >
                <Icon name="plus" size={18} color={COLORS.WHITE} />
                <Text style={styles.createBtnText}>Créer une équipe</Text>
              </LinearGradient>
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
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTeam')}
      >
        <LinearGradient
          colors={GRADIENTS.button}
          style={styles.fabGradient}
        >
          <Icon name="plus" size={28} color={COLORS.WHITE} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.WHITE,
    letterSpacing: 0.5,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  content: {
    padding: 20,
  },

  // TEAM CARD
  cardContainer: {
    marginBottom: 20,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: 150,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.DARK_CARD,
    ...SHADOWS.medium,
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
    ...SHADOWS.small,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },

  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.WHITE,
    marginRight: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '900',
  },

  teamLocation: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: '500',
    opacity: 0.8,
  },
  manageButton: {
    padding: 8,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.GLASS_BORDER,
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
    color: COLORS.WHITE,
    marginRight: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.7,
  },

  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.GLASS_BORDER,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  emptyText: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: COLORS.WHITE,
    opacity: 0.7,
    marginTop: 8,
    fontSize: 14,
    marginBottom: 32,
  },
  createBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 10,
  },
  createBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    borderRadius: 28,
    ...SHADOWS.glow,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
