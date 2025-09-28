import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { LoadingSpinner } from '../../components/common';

// Constantes
const COLORS = {
  PRIMARY: '#22C55E',
  BACKGROUND: '#F8FAFC',
  CARD_BACKGROUND: '#FFFFFF',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_WHITE: '#FFFFFF',
  BORDER_LIGHT: '#F3F4F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
};

const DIMENSIONS = {
  CONTAINER_PADDING: 16,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,
  BORDER_RADIUS_LG: 12,
  BORDER_RADIUS_MD: 8,
};

const FONTS = {
  SIZE: {
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
  },
};

// Composant TeamCard
const TeamCard = React.memo(({ team, onPress, onManage }) => (
  <TouchableOpacity
    style={{
      backgroundColor: COLORS.CARD_BACKGROUND,
      borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
      padding: DIMENSIONS.SPACING_MD,
      marginBottom: DIMENSIONS.SPACING_MD,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    }}
    onPress={() => onPress(team)}
    activeOpacity={0.7}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* Photo d'équipe */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: COLORS.PRIMARY_LIGHT || '#86EFAC',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: DIMENSIONS.SPACING_MD,
        }}
      >
        {team.photo ? (
          <Image
            source={{ uri: team.photo }}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
        ) : (
          <Text style={{ fontSize: 24 }}>⚽</Text>
        )}
      </View>

      {/* Infos équipe */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: FONTS.SIZE.LG,
            fontWeight: 'bold',
            color: COLORS.TEXT_PRIMARY,
            marginBottom: 4,
          }}
        >
          {team.name}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 12 }}>👥</Text>
          <Text
            style={{
              fontSize: FONTS.SIZE.SM,
              color: COLORS.TEXT_SECONDARY,
              marginLeft: 4,
              marginRight: 12,
            }}
          >
            {team.currentMembers || 0}/{team.maxPlayers || 11} joueurs
          </Text>

          <Text style={{ fontSize: 12 }}>📍</Text>
          <Text
            style={{
              fontSize: FONTS.SIZE.SM,
              color: COLORS.TEXT_SECONDARY,
              marginLeft: 4,
            }}
          >
            {team.locationCity || 'Non définie'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              backgroundColor: getSkillLevelColor(team.skillLevel),
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: FONTS.SIZE.SM,
                color: COLORS.TEXT_WHITE,
                fontWeight: '600',
              }}
            >
              {getSkillLevelLabel(team.skillLevel)}
            </Text>
          </View>

          <Text
            style={{
              fontSize: FONTS.SIZE.SM,
              color: COLORS.TEXT_SECONDARY,
            }}
          >
            {team.role === 'captain' ? '👑 Capitaine' : '👤 Membre'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {team.role === 'captain' && (
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.PRIMARY,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
          }}
          onPress={() => onManage(team)}
        >
          <Text
            style={{
              color: COLORS.TEXT_WHITE,
              fontSize: FONTS.SIZE.SM,
              fontWeight: '600',
            }}
          >
            Gérer
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
));

// Helpers
const getSkillLevelColor = level => {
  switch (level) {
    case 'beginner':
      return '#94A3B8';
    case 'amateur':
      return '#3B82F6';
    case 'intermediate':
      return '#F59E0B';
    case 'advanced':
      return '#EF4444';
    case 'expert':
      return '#8B5CF6';
    default:
      return '#6B7280';
  }
};

const getSkillLevelLabel = level => {
  switch (level) {
    case 'beginner':
      return 'Débutant';
    case 'amateur':
      return 'Amateur';
    case 'intermediate':
      return 'Intermédiaire';
    case 'advanced':
      return 'Avancé';
    case 'expert':
      return 'Expert';
    default:
      return 'Non défini';
  }
};

export const MyTeamsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
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
      photo: null,
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
      photo: null,
      createdAt: '2024-02-20',
    },
  ];

  const displayTeams = myTeams.length > 0 ? myTeams : mockTeams;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Charger les vraies données depuis l'API
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

  const handleManageTeam = useCallback(
    team => {
      Alert.alert(
        "Gérer l'équipe",
        `Que voulez-vous faire avec "${team.name}" ?`,
        [
          {
            text: 'Voir les membres',
            onPress: () =>
              navigation.navigate('TeamMembers', { teamId: team.id }),
          },
          {
            text: "Modifier l'équipe",
            onPress: () => navigation.navigate('EditTeam', { teamId: team.id }),
          },
          {
            text: 'Inviter des joueurs',
            onPress: () => handleInvitePlayers(team),
          },
          { text: 'Annuler', style: 'cancel' },
        ],
      );
    },
    [navigation],
  );

  const handleInvitePlayers = useCallback(team => {
    Alert.alert('Info', "Fonctionnalité d'invitation en développement");
  }, []);

  const handleCreateTeam = useCallback(() => {
    navigation.navigate('CreateTeam');
  }, [navigation]);

  if (isLoading && !refreshing) {
    return <LoadingSpinner message="Chargement de vos équipes..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.PRIMARY,
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text
              style={{
                fontSize: FONTS.SIZE.XXL,
                color: COLORS.TEXT_WHITE,
                fontWeight: 'bold',
              }}
            >
              Mes Équipes
            </Text>
            <Text
              style={{
                fontSize: FONTS.SIZE.MD,
                color: COLORS.TEXT_WHITE,
                opacity: 0.9,
                marginTop: 4,
              }}
            >
              {displayTeams.length} équipe{displayTeams.length > 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
            onPress={handleCreateTeam}
          >
            <Text
              style={{
                color: COLORS.TEXT_WHITE,
                fontSize: FONTS.SIZE.SM,
                fontWeight: '600',
              }}
            >
              + Créer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
          paddingVertical: DIMENSIONS.SPACING_LG,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View
            style={{
              backgroundColor: '#FEE2E2',
              borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
              padding: DIMENSIONS.SPACING_MD,
              marginBottom: DIMENSIONS.SPACING_LG,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.ERROR,
            }}
          >
            <Text
              style={{
                fontSize: FONTS.SIZE.SM,
                color: '#991B1B',
                fontWeight: 'bold',
              }}
            >
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
              />
            ))}
          </View>
        ) : (
          /* État vide */
          <View
            style={{
              backgroundColor: COLORS.CARD_BACKGROUND,
              borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
              padding: DIMENSIONS.SPACING_XL,
              alignItems: 'center',
              marginTop: DIMENSIONS.SPACING_XL,
            }}
          >
            <Text style={{ fontSize: 64, marginBottom: 16 }}>⚽</Text>
            <Text
              style={{
                fontSize: FONTS.SIZE.LG,
                fontWeight: 'bold',
                color: COLORS.TEXT_PRIMARY,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Aucune équipe
            </Text>
            <Text
              style={{
                fontSize: FONTS.SIZE.MD,
                color: COLORS.TEXT_SECONDARY,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: DIMENSIONS.SPACING_LG,
              }}
            >
              Créez votre première équipe pour commencer à organiser des matchs
              !
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: COLORS.PRIMARY,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
              }}
              onPress={handleCreateTeam}
            >
              <Text
                style={{
                  color: COLORS.TEXT_WHITE,
                  fontSize: FONTS.SIZE.MD,
                  fontWeight: '600',
                }}
              >
                Créer ma première équipe
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
