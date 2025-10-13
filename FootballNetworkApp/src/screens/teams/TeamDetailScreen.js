// ====== src/screens/teams/TeamDetailScreen.js - NOUVEAU DESIGN + BACKEND ======
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { teamsApi } from '../../services/api';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

// Composant StatCard
const StatCard = ({ icon, value, label, gradient }) => (
  <View style={styles.statCard}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statGradient}
    >
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={22} color="#FFF" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </View>
);

// Composant MemberCard
const MemberCard = ({ member, isOwner, onManage }) => (
  <View style={styles.memberCard}>
    <View style={styles.memberAvatar}>
      <Icon name="user" size={20} color="#22C55E" />
    </View>
    <View style={styles.memberInfo}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberName}>
          {member.firstName} {member.lastName}
        </Text>
        {member.role === 'captain' && (
          <View style={styles.captainBadge}>
            <Icon name="award" size={12} color="#F59E0B" />
            <Text style={styles.captainText}>Capitaine</Text>
          </View>
        )}
      </View>
      <View style={styles.memberMeta}>
        {member.position && (
          <View style={styles.memberMetaItem}>
            <Icon name="target" size={12} color="#9CA3AF" />
            <Text style={styles.memberMetaText}>{member.position}</Text>
          </View>
        )}
        <View style={styles.memberMetaItem}>
          <Icon name="calendar" size={12} color="#9CA3AF" />
          <Text style={styles.memberMetaText}>
            Membre depuis {member.joinedDate || 'récemment'}
          </Text>
        </View>
      </View>
    </View>
    {isOwner && member.role !== 'captain' && (
      <TouchableOpacity
        style={styles.memberOptions}
        onPress={() => onManage(member)}
      >
        <Icon name="more-vertical" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    )}
  </View>
);

// Composant InfoRow
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Icon name={icon} size={18} color="#6B7280" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export const TeamDetailScreen = ({ route, navigation }) => {
  const { teamId, teamName } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, members

  const scrollY = useRef(new Animated.Value(0)).current;

  // Charger les données au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      loadTeamDetails();
    }, [teamId]),
  );

  const loadTeamDetails = async () => {
    try {
      setLoading(true);
      const [teamResult, membersResult] = await Promise.all([
        teamsApi.getTeamById(teamId),
        teamsApi.getTeamMembers(teamId),
      ]);

      if (teamResult.success) {
        setTeam(teamResult.data);
      } else {
        Alert.alert('Erreur', teamResult.error);
        navigation.goBack();
      }

      if (membersResult.success) {
        setMembers(membersResult.data);
      }
    } catch (error) {
      console.error('Load team details error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTeamDetails();
    setRefreshing(false);
  }, [teamId]);

  const handleLeaveTeam = () => {
    Alert.alert(
      "Quitter l'équipe",
      `Êtes-vous sûr de vouloir quitter "${team?.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await teamsApi.leaveTeam(teamId);
              if (result.success) {
                Alert.alert('Succès', "Vous avez quitté l'équipe", [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ],
    );
  };

  const handleDeleteTeam = () => {
    Alert.alert(
      "Supprimer l'équipe",
      `Êtes-vous sûr de vouloir supprimer "${team?.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await teamsApi.deleteTeam(teamId);
              if (result.success) {
                Alert.alert('Succès', "L'équipe a été supprimée", [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ],
    );
  };

  const handleManageMember = member => {
    Alert.alert('Gérer le membre', `Options pour ${member.name}`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: "Retirer de l'équipe",
        style: 'destructive',
        onPress: () => {
          // TODO: Implémenter la suppression de membre
          Alert.alert('Info', 'Fonctionnalité bientôt disponible');
        },
      },
    ]);
  };

  const getSkillLevelLabel = level => {
    const levels = {
      beginner: 'Débutant',
      amateur: 'Amateur',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      semi_pro: 'Semi-pro',
    };
    return levels[level] || level;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!team) {
    return null;
  }

  const isOwner =
    team.is_owner || team.role === 'owner' || team.role === 'captain';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={['#22C55E', '#16A34A', '#15803D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Menu options
              Alert.alert(
                'Options',
                'Choisissez une action',
                [
                  { text: 'Annuler', style: 'cancel' },
                  isOwner && {
                    text: "Modifier l'équipe",
                    onPress: () =>
                      navigation.navigate('EditTeam', {
                        teamId,
                        teamName: team.name,
                      }),
                  },
                  isOwner && {
                    text: "Supprimer l'équipe",
                    style: 'destructive',
                    onPress: handleDeleteTeam,
                  },
                  !isOwner && {
                    text: "Quitter l'équipe",
                    style: 'destructive',
                    onPress: handleLeaveTeam,
                  },
                ].filter(Boolean),
              );
            }}
          >
            <Icon name="more-vertical" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.teamIconLarge}>
            <Icon name="shield" size={48} color="#FFF" />
          </View>
          <Text style={styles.teamTitle}>{team.name}</Text>
          {team.description && (
            <Text style={styles.teamSubtitle} numberOfLines={2}>
              {team.description}
            </Text>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="users"
            value={team.member_count || 0}
            label="Membres"
            gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
          />
          <StatCard
            icon="calendar"
            value={team.matches_count || 0}
            label="Matchs"
            gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
          />
          <StatCard
            icon="award"
            value={team.wins_count || 0}
            label="Victoires"
            gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
          />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'overview' && styles.tabTextActive,
            ]}
          >
            Aperçu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'members' && styles.tabTextActive,
            ]}
          >
            Membres ({members.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#22C55E']}
            tintColor="#22C55E"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' ? (
          <View>
            {/* Informations */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations</Text>
              <View style={styles.cardContent}>
                <InfoRow
                  icon="trending-up"
                  label="Niveau"
                  value={getSkillLevelLabel(team.skill_level)}
                />
                <InfoRow
                  icon="users"
                  label="Capacité"
                  value={`${team.currentPlayers || 0}/${
                    team.maxPlayers || 'N/A'
                  } joueurs`}
                />
                {team.location_city && (
                  <InfoRow
                    icon="map-pin"
                    label="Ville"
                    value={team.location_city}
                  />
                )}
                {team.created_at && (
                  <InfoRow
                    icon="calendar"
                    label="Créée le"
                    value={new Date(team.created_at).toLocaleDateString(
                      'fr-FR',
                    )}
                  />
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsCard}>
              {isOwner && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      navigation.navigate('EditTeam', {
                        teamId,
                        teamName: team.name,
                      })
                    }
                  >
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionGradient}
                    >
                      <Icon name="edit-2" size={20} color="#FFF" />
                      <Text style={styles.actionText}>Modifier l'équipe</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      navigation.navigate('TeamMembers', {
                        teamId,
                        teamName: team.name,
                      })
                    }
                  >
                    <LinearGradient
                      colors={['#22C55E', '#16A34A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionGradient}
                    >
                      <Icon name="user-plus" size={20} color="#FFF" />
                      <Text style={styles.actionText}>Inviter des joueurs</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ) : (
          <View>
            {/* Liste des membres */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Membres de l'équipe</Text>
                {isOwner && (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('TeamMembers', {
                        teamId,
                        teamName: team.name,
                      })
                    }
                  >
                    <Text style={styles.seeAllText}>Gérer</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.membersContainer}>
                {members.length === 0 ? (
                  <Text style={styles.emptyMembersText}>
                    Aucun membre pour le moment
                  </Text>
                ) : (
                  members.map(member => (
                    <MemberCard
                      key={member.id}
                      member={{
                        ...member,
                        name: `${member.first_name} ${member.last_name}`,
                        joinedDate: member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString(
                              'fr-FR',
                              {
                                month: 'short',
                                year: 'numeric',
                              },
                            )
                          : 'récemment',
                      }}
                      isOwner={isOwner}
                      onManage={handleManageMember}
                    />
                  ))
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    ...SHADOWS.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  teamIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  teamSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#22C55E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#22C55E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.MEDIUM,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  cardContent: {
    gap: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionsCard: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.SMALL,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  membersContainer: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22C55E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    gap: 4,
  },
  captainText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  memberMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  memberMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  memberOptions: {
    padding: 8,
  },
  emptyMembersText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
    paddingVertical: 20,
  },
});
