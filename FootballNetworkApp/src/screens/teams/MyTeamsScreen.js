// ====== src/screens/teams/MyTeamsScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Composant TeamCard
const TeamCard = React.memo(({ team, onPress, onManage, COLORS }) => (
  <TouchableOpacity
    style={[styles.teamCard, { backgroundColor: COLORS.WHITE }]}
    onPress={() => onPress(team)}
    activeOpacity={0.7}
  >
    <View style={styles.teamCardContent}>
      {/* Photo d'équipe */}
      <View
        style={[
          styles.teamAvatar,
          { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name="dribbble" size={32} color={COLORS.PRIMARY} />
      </View>

      {/* Infos équipe */}
      <View style={styles.teamInfo}>
        <Text style={[styles.teamName, { color: COLORS.TEXT_PRIMARY }]}>
          {team.name}
        </Text>

        <View style={styles.teamMeta}>
          <View style={styles.metaItem}>
            <Icon name="users" size={14} color={COLORS.TEXT_SECONDARY} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_SECONDARY }]}>
              {team.currentMembers || 0}/{team.maxPlayers || 11}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Icon name="map-pin" size={14} color={COLORS.TEXT_SECONDARY} />
            <Text style={[styles.metaText, { color: COLORS.TEXT_SECONDARY }]}>
              {team.locationCity || 'Non définie'}
            </Text>
          </View>
        </View>

        <View style={styles.teamFooter}>
          <View
            style={[
              styles.skillBadge,
              { backgroundColor: getSkillLevelColor(team.skillLevel) },
            ]}
          >
            <Text style={styles.skillBadgeText}>
              {getSkillLevelLabel(team.skillLevel)}
            </Text>
          </View>

          <View style={styles.roleContainer}>
            <Icon
              name={team.role === 'captain' ? 'award' : 'user'}
              size={14}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text style={[styles.roleText, { color: COLORS.TEXT_SECONDARY }]}>
              {team.role === 'captain' ? 'Capitaine' : 'Membre'}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      {team.role === 'captain' && (
        <TouchableOpacity
          style={[styles.manageButton, { backgroundColor: COLORS.PRIMARY }]}
          onPress={e => {
            e.stopPropagation();
            onManage(team);
          }}
        >
          <Icon name="settings" size={18} color={COLORS.WHITE} />
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
));

// Helpers
const getSkillLevelColor = level => {
  const colors = {
    beginner: '#94A3B8',
    amateur: '#3B82F6',
    intermediate: '#F59E0B',
    advanced: '#EF4444',
    expert: '#8B5CF6',
  };
  return colors[level] || '#6B7280';
};

const getSkillLevelLabel = level => {
  const labels = {
    beginner: 'Débutant',
    amateur: 'Amateur',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
    expert: 'Expert',
  };
  return labels[level] || 'Non défini';
};

export const MyTeamsScreen = ({ navigation }) => {
  const { colors: COLORS, isDark } = useTheme('auto');
  const { user } = useSelector(state => state.auth);
  const teamsState = useSelector(state => {
    if (!state || !state.teams) {
      return { myTeams: [], isLoading: false, error: null };
    }
    return state.teams;
  });

  const { myTeams, isLoading, error } = teamsState;
  const [refreshing, setRefreshing] = useState(false);

  // Données mockées pour la démonstration
  const mockTeams = [
    {
      id: 1,
      name: 'Les Tigres de Paris',
      description: 'Équipe compétitive de football amateur',
      skillLevel: 'intermediate',
      locationCity: 'Paris',
      currentMembers: 8,
      maxPlayers: 11,
      role: 'captain',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'FC Amis du Dimanche',
      description: 'Football entre amis le weekend',
      skillLevel: 'amateur',
      locationCity: 'Boulogne',
      currentMembers: 6,
      maxPlayers: 11,
      role: 'member',
      createdAt: '2024-02-20',
    },
  ];

  const displayTeams = myTeams.length > 0 ? myTeams : mockTeams;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleTeamPress = useCallback(
    team => {
      navigation.navigate('TeamDetail', {
        teamId: team.id,
        teamName: team.name,
      });
    },
    [navigation],
  );

  const handleManageTeam = team => {
    navigation.navigate('EditTeam', {
      teamId: team.id,
      team: team,
    });
  };

  // const handleManageTeam = useCallback(
  //   team => {
  //     Alert.alert(
  //       "Gérer l'équipe",
  //       `Que voulez-vous faire avec "${team.name}" ?`,
  //       [
  //         {
  //           text: 'Voir les membres',
  //           onPress: () =>
  //             navigation.navigate('TeamMembers', { teamId: team.id }),
  //         },
  //         {
  //           text: "Modifier l'équipe",
  //           onPress: () => navigation.navigate('EditTeam', { teamId: team.id }),
  //         },
  //         {
  //           text: 'Inviter des joueurs',
  //           onPress: () =>
  //             Alert.alert(
  //               'Info',
  //               "Fonctionnalité d'invitation en développement",
  //             ),
  //         },
  //         { text: 'Annuler', style: 'cancel' },
  //       ],
  //     );
  //   },
  //   [navigation],
  // );

  const handleCreateTeam = useCallback(() => {
    navigation.navigate('CreateTeam');
  }, [navigation]);

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.PRIMARY}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.PRIMARY }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleContainer}>
              <Icon name="users" size={24} color={COLORS.WHITE} />
              <Text style={styles.headerTitle}>Mes Équipes</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {displayTeams.length} équipe{displayTeams.length > 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateTeam}
          >
            <Icon name="plus" size={18} color={COLORS.WHITE} />
            <Text style={styles.createButtonText}>Créer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View
            style={[styles.errorBox, { backgroundColor: COLORS.ERROR_LIGHT }]}
          >
            <Icon name="alert-circle" size={20} color={COLORS.ERROR} />
            <Text style={[styles.errorText, { color: COLORS.ERROR_DARK }]}>
              Erreur: {error}
            </Text>
          </View>
        )}

        {/* Liste des équipes */}
        {displayTeams.length > 0 ? (
          <View>
            {displayTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                onPress={handleTeamPress}
                onManage={handleManageTeam}
                COLORS={COLORS}
              />
            ))}
          </View>
        ) : (
          /* État vide */
          <View style={[styles.emptyState, { backgroundColor: COLORS.WHITE }]}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: COLORS.BACKGROUND_LIGHT },
              ]}
            >
              <Icon name="users" size={48} color={COLORS.TEXT_MUTED} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Aucune équipe
            </Text>
            <Text
              style={[
                styles.emptyDescription,
                { color: COLORS.TEXT_SECONDARY },
              ]}
            >
              Créez votre première équipe pour commencer à organiser des matchs
              !
            </Text>

            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: COLORS.PRIMARY }]}
              onPress={handleCreateTeam}
            >
              <Icon name="plus-circle" size={20} color={COLORS.WHITE} />
              <Text style={styles.emptyButtonText}>
                Créer ma première équipe
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: DIMENSIONS.SPACING_MD,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    ...SHADOWS.MEDIUM,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  headerTitle: {
    fontSize: FONTS.SIZE.XXL,
    color: '#FFFFFF',
    fontWeight: FONTS.WEIGHT.BOLD,
    marginLeft: DIMENSIONS.SPACING_SM,
  },
  headerSubtitle: {
    fontSize: FONTS.SIZE.MD,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: DIMENSIONS.SPACING_XS,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingVertical: DIMENSIONS.SPACING_LG,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_MD,
    marginBottom: DIMENSIONS.SPACING_LG,
    borderLeftWidth: 4,
    gap: DIMENSIONS.SPACING_SM,
  },
  errorText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    flex: 1,
  },
  teamCard: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_MD,
    marginBottom: DIMENSIONS.SPACING_MD,
    ...SHADOWS.SMALL,
  },
  teamCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  teamMeta: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_MD,
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  metaText: {
    fontSize: FONTS.SIZE.SM,
  },
  teamFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
  },
  skillBadge: {
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: DIMENSIONS.SPACING_XXS,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
  },
  skillBadgeText: {
    fontSize: FONTS.SIZE.XS,
    color: '#FFFFFF',
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  roleText: {
    fontSize: FONTS.SIZE.SM,
  },
  manageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: DIMENSIONS.SPACING_SM,
  },
  emptyState: {
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_XL,
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACING_XL,
    ...SHADOWS.SMALL,
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
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: FONTS.SIZE.MD,
    textAlign: 'center',
    lineHeight: FONTS.SIZE.MD * FONTS.LINE_HEIGHT.RELAXED,
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_LG,
    paddingVertical: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: DIMENSIONS.SPACING_SM,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
});
