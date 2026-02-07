/**
 * TeamDetailScreen - Détail d'équipe
 * Design Foot Connect Premium
 */

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
  Switch,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { teamsApi } from '../../services/api';
import { API_CONFIG } from '../../utils/constants';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const StatBox = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const TeamDetailScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const { user } = useSelector(state => state.auth);

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

  const handleToggleMercato = async (newValue) => {
    try {
      const result = await teamsApi.toggleMercato(teamId, newValue);
      if (result.success) {
        setTeam(prev => ({ ...prev, mercatoActif: newValue }));
        Alert.alert(
          'Succès',
          newValue
            ? 'Mercato activé - Les joueurs peuvent maintenant demander à rejoindre'
            : 'Mercato fermé - Les demandes sont suspendues',
        );
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de modifier le mercato');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Une erreur est survenue');
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
        <ActivityIndicator color={COLORS.PRIMARY} />
      </View>
    );

  const isOwner = team.role === 'owner' || team.role === 'captain';
  const isManager = team.manager_id === user?.id;
  const isCaptain = team.captain_id === user?.id;
  const canManage = isOwner || isManager || isCaptain;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK} />

      {/* HEADER AVEC BANNIÈRE */}
      <View style={styles.headerWrapper}>
        {team.bannerUrl && (
          <Image
            source={{
              uri: API_CONFIG.BASE_URL.replace('/api', '') + team.bannerUrl,
            }}
            style={styles.bannerImage}
          />
        )}
        <LinearGradient
          colors={['rgba(10, 10, 10, 0.3)', 'rgba(10, 10, 10, 0.8)', COLORS.DARK]}
          style={styles.headerOverlay}
        />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
          >
            <Icon name="arrow-left" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            {isOwner && (
              <TouchableOpacity
                onPress={() => navigation.navigate('EditTeam', { teamId })}
                style={styles.iconBtn}
              >
                <Icon name="edit-2" size={20} color={COLORS.WHITE} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn}>
              <Icon name="share-2" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Équipe */}
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
              <Icon name="shield" size={48} color={COLORS.PRIMARY} />
            )}
          </View>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamLoc}>
            {team.locationCity} • {team.skillLevel}
          </Text>
          <View
            style={[
              styles.mercatoBadge,
              team.mercatoActif ? styles.mercatoOpen : styles.mercatoClosed,
            ]}
          >
            <Icon
              name={team.mercatoActif ? 'user-check' : 'user-x'}
              size={14}
              color={team.mercatoActif ? COLORS.SUCCESS : COLORS.ERROR}
            />
            <Text
              style={[
                styles.mercatoText,
                {color: team.mercatoActif ? COLORS.SUCCESS : COLORS.ERROR},
              ]}
            >
              {team.mercatoActif ? 'Recrute' : 'Mercato Fermé'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            tintColor={COLORS.PRIMARY}
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
            <View style={[styles.menuIcon, { backgroundColor: `${COLORS.INFO}20` }]}>
              <Icon name="users" size={20} color={COLORS.INFO} />
            </View>
            <Text style={styles.menuText}>Voir les membres</Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>

        {canManage && (
          <>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${COLORS.WARNING}20` }]}>
                  <Icon name="calendar" size={20} color={COLORS.WARNING} />
                </View>
                <Text style={styles.menuText}>Planifier un match</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>

            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    {
                      backgroundColor: team.mercatoActif
                        ? `${COLORS.SUCCESS}20`
                        : `${COLORS.ERROR}20`,
                    },
                  ]}
                >
                  <Icon
                    name={team.mercatoActif ? 'user-check' : 'user-x'}
                    size={20}
                    color={team.mercatoActif ? COLORS.SUCCESS : COLORS.ERROR}
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.menuText}>Mercato</Text>
                  <Text style={styles.menuSubtext}>
                    {team.mercatoActif
                      ? 'Les joueurs peuvent rejoindre'
                      : 'Recrutement fermé'}
                  </Text>
                </View>
              </View>
              <Switch
                value={team.mercatoActif || false}
                onValueChange={handleToggleMercato}
                trackColor={{false: COLORS.BORDER, true: `${COLORS.SUCCESS}40`}}
                thumbColor={team.mercatoActif ? COLORS.SUCCESS : COLORS.WHITE}
                ios_backgroundColor={COLORS.BORDER}
              />
            </View>
          </>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // HEADER STYLES
  headerWrapper: {
    height: 320,
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: COLORS.GLASS,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },

  teamHeader: {
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 5,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    overflow: 'hidden',
  },
  teamLogo: {
    width: '100%',
    height: '100%',
  },
  teamName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  teamLoc: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.7,
    textTransform: 'capitalize',
  },

  content: {
    padding: 24,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    padding: 20,
    borderRadius: RADIUS.lg,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.WHITE,
    marginTop: 4,
    opacity: 0.7,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.BORDER,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    padding: 16,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  menuSubtext: {
    fontSize: 12,
    color: COLORS.WHITE,
    marginTop: 2,
    opacity: 0.6,
  },

  // Mercato Badge
  mercatoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginTop: 8,
    gap: 6,
  },
  mercatoOpen: {
    backgroundColor: `${COLORS.SUCCESS}20`,
    borderWidth: 1,
    borderColor: `${COLORS.SUCCESS}40`,
  },
  mercatoClosed: {
    backgroundColor: `${COLORS.ERROR}20`,
    borderWidth: 1,
    borderColor: `${COLORS.ERROR}40`,
  },
  mercatoText: {
    fontSize: 12,
    fontWeight: '600',
  },

  description: {
    fontSize: 14,
    color: COLORS.WHITE,
    lineHeight: 22,
    opacity: 0.8,
  },
});
