// ====== src/screens/teams/TeamMembersScreen.js - NOUVEAU DESIGN + BACKEND ======
import React, { useState, useCallback, useEffect } from 'react';
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
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { teamsApi } from '../../services/api';

// Composant MemberCard
const MemberCard = ({ member, isOwner, onManage }) => (
  <View style={styles.memberCard}>
    <View style={styles.memberAvatar}>
      <Icon name="user" size={24} color="#22C55E" />
    </View>

    <View style={styles.memberInfo}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberName}>
          {member.first_name} {member.last_name}
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
            <Icon name="target" size={14} color="#6B7280" />
            <Text style={styles.memberMetaText}>{member.position}</Text>
          </View>
        )}
        {member.skill_level && (
          <View style={styles.memberMetaItem}>
            <Icon name="trending-up" size={14} color="#6B7280" />
            <Text style={styles.memberMetaText}>
              {getSkillLevelLabel(member.skill_level)}
            </Text>
          </View>
        )}
      </View>

      {member.email && (
        <View style={styles.memberContact}>
          <Icon name="mail" size={12} color="#9CA3AF" />
          <Text style={styles.memberContactText}>{member.email}</Text>
        </View>
      )}
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

// Composant SearchBar
const SearchBar = ({ value, onChangeText, onClear }) => (
  <View style={styles.searchContainer}>
    <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Rechercher un membre..."
      placeholderTextColor="#9CA3AF"
      style={styles.searchInput}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={onClear} style={styles.searchClear}>
        <Icon name="x" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    )}
  </View>
);

// Composant InvitePlayerModal
const InvitePlayerModal = ({ visible, onClose, onInvite, teamId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [players, setPlayers] = useState([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Info', 'Veuillez entrer un nom ou email');
      return;
    }

    try {
      setSearching(true);
      // TODO: Implémenter la recherche de joueurs
      // const result = await teamsApi.searchPlayers(searchQuery);
      // setPlayers(result.data);

      // Mock pour le moment
      Alert.alert('Info', 'Fonctionnalité de recherche en développement');
    } catch (error) {
      console.error('Search players error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Inviter un joueur</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Icon name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.searchContainer}>
              <Icon
                name="search"
                size={20}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nom ou email du joueur..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            <TouchableOpacity
              style={styles.inviteButton}
              onPress={handleSearch}
              disabled={searching}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inviteGradient}
              >
                {searching ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Icon name="user-plus" size={20} color="#FFF" />
                    <Text style={styles.inviteText}>Rechercher</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.infoText}>
              💡 Le joueur doit être inscrit sur la plateforme pour recevoir une
              invitation
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Helper pour les niveaux
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

export const TeamMembersScreen = ({ route, navigation }) => {
  const { teamId, teamName } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    captains: 0,
    players: 0,
  });

  // Charger les membres au focus
  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [teamId]),
  );

  const loadMembers = async () => {
    try {
      setLoading(true);
      const [membersResult, teamResult] = await Promise.all([
        teamsApi.getTeamMembers(teamId),
        teamsApi.getTeamById(teamId),
      ]);

      if (membersResult.success) {
        setMembers(membersResult.data);

        // Calculer les stats
        const captainsCount = membersResult.data.filter(
          m => m.role === 'captain',
        ).length;

        setStats({
          totalMembers: membersResult.data.length,
          captains: captainsCount,
          players: membersResult.data.length - captainsCount,
        });
      }

      if (teamResult.success) {
        setIsOwner(
          teamResult.data.is_owner ||
            teamResult.data.role === 'owner' ||
            teamResult.data.role === 'captain',
        );
      }
    } catch (error) {
      console.error('Load members error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  }, [teamId]);

  const handleManageMember = member => {
    Alert.alert(
      'Gérer le membre',
      `Options pour ${member.first_name} ${member.last_name}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Promouvoir capitaine',
          onPress: async () => {
            try {
              const result = await teamsApi.updateMemberRole(
                teamId,
                member.user_id,
                'captain',
              );
              if (result.success) {
                Alert.alert('Succès', 'Le membre a été promu capitaine');
                loadMembers();
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
        {
          text: "Retirer de l'équipe",
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirmer',
              `Voulez-vous vraiment retirer ${member.first_name} de l'équipe ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Retirer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const result = await teamsApi.removeMember(
                        teamId,
                        member.user_id,
                      );
                      if (result.success) {
                        Alert.alert('Succès', 'Le membre a été retiré');
                        loadMembers();
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
          },
        },
      ],
    );
  };

  // Filtrer les membres selon la recherche
  const filteredMembers = members.filter(member => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    const email = (member.email || '').toLowerCase();

    return fullName.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
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

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Membres</Text>
            <Text style={styles.headerSubtitle}>{teamName}</Text>
          </View>

          {isOwner && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setInviteModalVisible(true)}
            >
              <Icon name="user-plus" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalMembers}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.captains}</Text>
            <Text style={styles.statLabel}>Capitaines</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.players}</Text>
            <Text style={styles.statLabel}>Joueurs</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Barre de recherche */}
      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* Liste des membres */}
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
        {filteredMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun résultat' : 'Aucun membre'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Essayez avec un autre nom'
                : 'Invitez des joueurs à rejoindre votre équipe'}
            </Text>
          </View>
        ) : (
          filteredMembers.map(member => (
            <MemberCard
              key={member.user_id}
              member={member}
              isOwner={isOwner}
              onManage={handleManageMember}
            />
          ))
        )}
      </ScrollView>

      {/* Modal d'invitation */}
      <InvitePlayerModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        teamId={teamId}
      />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...SHADOWS.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchWrapper: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  searchClear: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.MEDIUM,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    gap: 4,
  },
  captainText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  memberMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  memberMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  memberContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberContactText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  memberOptions: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inviteButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  inviteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  inviteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
