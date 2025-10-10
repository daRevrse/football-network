// ====== src/screens/teams/TeamMembersScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  StatusBar,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { SectionCard } from '../../components/common/SectionCard';

export const TeamMembersScreen = ({ route, navigation }) => {
  const { teamId, team } = route.params || {};
  const currentUser = useSelector(state => state.auth.user);
  const isDark = useSelector(state => state.theme?.isDark || false);

  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, admins, players
  const [refreshing, setRefreshing] = useState(false);

  // Données fictives des membres (à remplacer par des données du backend)
  const [members] = useState([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      avatar: null,
      role: 'admin',
      position: 'midfielder',
      joinedAt: '2024-01-15',
      matchesPlayed: 15,
      goals: 8,
      assists: 5,
      isCurrentUser: true,
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      avatar: null,
      role: 'player',
      position: 'forward',
      joinedAt: '2024-02-20',
      matchesPlayed: 12,
      goals: 15,
      assists: 7,
      isCurrentUser: false,
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.j@example.com',
      avatar: null,
      role: 'player',
      position: 'defender',
      joinedAt: '2024-03-10',
      matchesPlayed: 10,
      goals: 2,
      assists: 3,
      isCurrentUser: false,
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.w@example.com',
      avatar: null,
      role: 'player',
      position: 'goalkeeper',
      joinedAt: '2024-03-25',
      matchesPlayed: 8,
      goals: 0,
      assists: 0,
      isCurrentUser: false,
    },
  ]);

  const isAdmin = members.find(m => m.isCurrentUser)?.role === 'admin';

  // Filtrer les membres
  const filteredMembers = members.filter(member => {
    const matchesSearch =
      searchQuery === '' ||
      `${member.firstName} ${member.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'admins' && member.role === 'admin') ||
      (selectedFilter === 'players' && member.role === 'player');

    return matchesSearch && matchesFilter;
  });

  // Rafraîchir
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Recharger les membres depuis l'API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Inviter un joueur
  const handleInvitePlayer = useCallback(() => {
    Alert.prompt(
      'Inviter un joueur',
      "Entrez l'adresse email du joueur à inviter",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Inviter',
          onPress: email => {
            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              // TODO: Appeler l'API pour inviter le joueur
              Alert.alert('Succès', `Invitation envoyée à ${email}`);
            } else {
              Alert.alert('Erreur', 'Adresse email invalide');
            }
          },
        },
      ],
      'plain-text',
      '',
      'email-address',
    );
  }, []);

  // Changer le rôle d'un membre
  const handleChangeRole = useCallback(member => {
    const newRole = member.role === 'admin' ? 'player' : 'admin';
    const roleLabel = newRole === 'admin' ? 'administrateur' : 'joueur';

    Alert.alert(
      'Changer le rôle',
      `Voulez-vous promouvoir ${member.firstName} ${member.lastName} en tant que ${roleLabel} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            // TODO: Appeler l'API pour changer le rôle
            Alert.alert('Succès', `Rôle modifié avec succès`);
          },
        },
      ],
    );
  }, []);

  // Retirer un membre
  const handleRemoveMember = useCallback(member => {
    Alert.alert(
      'Retirer le membre',
      `Êtes-vous sûr de vouloir retirer ${member.firstName} ${member.lastName} de l'équipe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            // TODO: Appeler l'API pour retirer le membre
            Alert.alert('Succès', "Membre retiré de l'équipe");
          },
        },
      ],
    );
  }, []);

  // Voir le profil d'un membre
  const handleViewProfile = useCallback(member => {
    Alert.alert(
      'Info',
      `Voir le profil de ${member.firstName} ${member.lastName}`,
    );
    // TODO: Navigation vers le profil du joueur
    // navigation.navigate('PlayerProfile', { playerId: member.id });
  }, []);

  // Ouvrir le menu d'actions pour un membre
  const handleMemberActions = useCallback(
    member => {
      if (!isAdmin) {
        handleViewProfile(member);
        return;
      }

      const actions = [
        { text: 'Voir le profil', onPress: () => handleViewProfile(member) },
      ];

      if (member.role === 'player') {
        actions.push({
          text: 'Promouvoir en admin',
          onPress: () => handleChangeRole(member),
        });
      } else if (member.role === 'admin') {
        actions.push({
          text: 'Rétrograder en joueur',
          onPress: () => handleChangeRole(member),
        });
      }

      if (!member.isCurrentUser) {
        actions.push({
          text: "Retirer de l'équipe",
          onPress: () => handleRemoveMember(member),
          style: 'destructive',
        });
      }

      actions.push({ text: 'Annuler', style: 'cancel' });

      Alert.alert('Actions', `${member.firstName} ${member.lastName}`, actions);
    },
    [isAdmin, handleViewProfile, handleChangeRole, handleRemoveMember],
  );

  // Obtenir la couleur du rôle
  const getRoleColor = role => {
    return role === 'admin' ? COLORS.WARNING : COLORS.PRIMARY;
  };

  // Obtenir le label du rôle
  const getRoleLabel = role => {
    return role === 'admin' ? 'Admin' : 'Joueur';
  };

  // Obtenir le label de la position
  const getPositionLabel = position => {
    const labels = {
      goalkeeper: 'Gardien',
      defender: 'Défenseur',
      midfielder: 'Milieu',
      forward: 'Attaquant',
      any: 'Polyvalent',
    };
    return labels[position] || position;
  };

  // Stats globales
  const stats = {
    totalMembers: members.length,
    admins: members.filter(m => m.role === 'admin').length,
    players: members.filter(m => m.role === 'player').length,
  };

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.PRIMARY }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Icon name="users" size={24} color={COLORS.WHITE} />
          <Text style={styles.headerTitle}>Membres de l'équipe</Text>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleInvitePlayer}
          >
            <Icon name="user-plus" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>
        )}

        {!isAdmin && <View style={{ width: 40 }} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.WHITE }]}>
            <Icon name="users" size={24} color={COLORS.PRIMARY} />
            <Text style={[styles.statValue, { color: COLORS.TEXT_PRIMARY }]}>
              {stats.totalMembers}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.TEXT_MUTED }]}>
              Membres
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.WHITE }]}>
            <Icon name="shield" size={24} color={COLORS.WARNING} />
            <Text style={[styles.statValue, { color: COLORS.TEXT_PRIMARY }]}>
              {stats.admins}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.TEXT_MUTED }]}>
              Admins
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.WHITE }]}>
            <Icon name="user" size={24} color={COLORS.SUCCESS} />
            <Text style={[styles.statValue, { color: COLORS.TEXT_PRIMARY }]}>
              {stats.players}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.TEXT_MUTED }]}>
              Joueurs
            </Text>
          </View>
        </View>

        {/* Barre de recherche */}
        <View
          style={[styles.searchContainer, { backgroundColor: COLORS.WHITE }]}
        >
          <Icon name="search" size={20} color={COLORS.TEXT_MUTED} />
          <TextInput
            style={[styles.searchInput, { color: COLORS.TEXT_PRIMARY }]}
            placeholder="Rechercher un membre..."
            placeholderTextColor={COLORS.TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={20} color={COLORS.TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'all' ? COLORS.PRIMARY : COLORS.WHITE,
              },
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === 'all'
                      ? COLORS.WHITE
                      : COLORS.TEXT_PRIMARY,
                },
              ]}
            >
              Tous ({members.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'admins' ? COLORS.WARNING : COLORS.WHITE,
              },
            ]}
            onPress={() => setSelectedFilter('admins')}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === 'admins'
                      ? COLORS.WHITE
                      : COLORS.TEXT_PRIMARY,
                },
              ]}
            >
              Admins ({stats.admins})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'players' ? COLORS.SUCCESS : COLORS.WHITE,
              },
            ]}
            onPress={() => setSelectedFilter('players')}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === 'players'
                      ? COLORS.WHITE
                      : COLORS.TEXT_PRIMARY,
                },
              ]}
            >
              Joueurs ({stats.players})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des membres */}
        <SectionCard
          title={`${filteredMembers.length} membre${
            filteredMembers.length > 1 ? 's' : ''
          }`}
          icon="users"
        >
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member, index) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberItem,
                  {
                    borderBottomWidth:
                      index < filteredMembers.length - 1 ? 1 : 0,
                    borderBottomColor: COLORS.BORDER_LIGHT,
                  },
                ]}
                onPress={() => handleMemberActions(member)}
              >
                {/* Avatar */}
                <View style={styles.memberLeft}>
                  {member.avatar ? (
                    <Image
                      source={{ uri: member.avatar }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.memberAvatarPlaceholder,
                        { backgroundColor: COLORS.PRIMARY_LIGHT },
                      ]}
                    >
                      <Text
                        style={[
                          styles.memberAvatarText,
                          { color: COLORS.PRIMARY },
                        ]}
                      >
                        {member.firstName.charAt(0)}
                        {member.lastName.charAt(0)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text
                        style={[
                          styles.memberName,
                          { color: COLORS.TEXT_PRIMARY },
                        ]}
                      >
                        {member.firstName} {member.lastName}
                      </Text>
                      {member.isCurrentUser && (
                        <View
                          style={[
                            styles.youBadge,
                            { backgroundColor: COLORS.PRIMARY_LIGHT },
                          ]}
                        >
                          <Text
                            style={[
                              styles.youBadgeText,
                              { color: COLORS.PRIMARY },
                            ]}
                          >
                            Vous
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.memberMeta}>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: `${getRoleColor(member.role)}20` },
                        ]}
                      >
                        <Icon
                          name={member.role === 'admin' ? 'shield' : 'user'}
                          size={12}
                          color={getRoleColor(member.role)}
                        />
                        <Text
                          style={[
                            styles.roleBadgeText,
                            { color: getRoleColor(member.role) },
                          ]}
                        >
                          {getRoleLabel(member.role)}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.memberPosition,
                          { color: COLORS.TEXT_MUTED },
                        ]}
                      >
                        • {getPositionLabel(member.position)}
                      </Text>
                    </View>

                    <View style={styles.memberStats}>
                      <View style={styles.statItem}>
                        <Icon
                          name="calendar"
                          size={14}
                          color={COLORS.TEXT_MUTED}
                        />
                        <Text
                          style={[
                            styles.statItemText,
                            { color: COLORS.TEXT_MUTED },
                          ]}
                        >
                          {member.matchesPlayed} matchs
                        </Text>
                      </View>

                      {member.position !== 'goalkeeper' && (
                        <>
                          <View style={styles.statItem}>
                            <Icon
                              name="target"
                              size={14}
                              color={COLORS.TEXT_MUTED}
                            />
                            <Text
                              style={[
                                styles.statItemText,
                                { color: COLORS.TEXT_MUTED },
                              ]}
                            >
                              {member.goals} buts
                            </Text>
                          </View>

                          <View style={styles.statItem}>
                            <Icon
                              name="zap"
                              size={14}
                              color={COLORS.TEXT_MUTED}
                            />
                            <Text
                              style={[
                                styles.statItemText,
                                { color: COLORS.TEXT_MUTED },
                              ]}
                            >
                              {member.assists} passes
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                <Icon
                  name="chevron-right"
                  size={20}
                  color={COLORS.TEXT_MUTED}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="users" size={48} color={COLORS.TEXT_MUTED} />
              <Text style={[styles.emptyText, { color: COLORS.TEXT_MUTED }]}>
                Aucun membre trouvé
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Bouton d'invitation (affiché en bas) */}
        {isAdmin && (
          <TouchableOpacity
            style={[styles.inviteButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={handleInvitePlayer}
          >
            <Icon name="user-plus" size={20} color={COLORS.WHITE} />
            <Text style={styles.inviteButtonText}>
              Inviter un nouveau joueur
            </Text>
          </TouchableOpacity>
        )}

        {/* Espace en bas */}
        <View style={{ height: DIMENSIONS.SPACING_XXL }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: DIMENSIONS.SPACING_MD,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.SMALL,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DIMENSIONS.SPACING_SM,
  },
  headerTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingVertical: DIMENSIONS.SPACING_LG,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  statCard: {
    flex: 1,
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  statValue: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginTop: DIMENSIONS.SPACING_XS,
  },
  statLabel: {
    fontSize: FONTS.SIZE.XS,
    marginTop: DIMENSIONS.SPACING_XXS,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginBottom: DIMENSIONS.SPACING_MD,
    gap: DIMENSIONS.SPACING_SM,
    ...SHADOWS.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.SIZE.MD,
    padding: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  filterChip: {
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    ...SHADOWS.SMALL,
  },
  filterChipText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DIMENSIONS.SPACING_MD,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: DIMENSIONS.SPACING_MD,
  },
  memberAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: DIMENSIONS.SPACING_MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  memberName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  youBadge: {
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: 2,
    borderRadius: DIMENSIONS.BORDER_RADIUS_SM,
  },
  youBadgeText: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: 2,
    borderRadius: DIMENSIONS.BORDER_RADIUS_SM,
  },
  roleBadgeText: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  memberPosition: {
    fontSize: FONTS.SIZE.SM,
  },
  memberStats: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_MD,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  statItemText: {
    fontSize: FONTS.SIZE.XS,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_XXL,
  },
  emptyText: {
    fontSize: FONTS.SIZE.MD,
    marginTop: DIMENSIONS.SPACING_SM,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginTop: DIMENSIONS.SPACING_MD,
    gap: DIMENSIONS.SPACING_SM,
    ...SHADOWS.MEDIUM,
  },
  inviteButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
});
