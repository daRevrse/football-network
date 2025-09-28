import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { LoadingSpinner } from '../../components/common';
import { logout } from '../../store/slices/authSlice';

// Constantes temporaires (seront remplacées par les imports @utils)
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

export const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { myTeams } = useSelector(state => state.teams);
  const { upcomingMatches, invitations } = useSelector(state => state.matches);
  const { unreadCount } = useSelector(state => state.notifications);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Rafraîchir les données
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Fonction de déconnexion
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => {
          // Déconnecter sans afficher d'alert après
          dispatch(logout());
          // L'utilisateur sera automatiquement redirigé vers l'écran de connexion
        },
      },
    ]);
  };

  // Données temporaires pour la demo
  const stats = {
    matchesThisWeek: 2,
    teamsCount: myTeams.length || 0,
    pendingInvitations:
      invitations.filter(inv => inv.status === 'pending').length || 0,
  };

  const quickActions = [
    {
      id: 'create-match',
      title: 'Créer un match',
      icon: '⚽',
      color: COLORS.PRIMARY,
      onPress: () => Alert.alert('Info', 'Fonctionnalité en développement'),
    },
    {
      id: 'find-team',
      title: 'Trouver une équipe',
      icon: '🔍',
      color: COLORS.SUCCESS,
      onPress: () => Alert.alert('Info', 'Fonctionnalité en développement'),
    },
    {
      id: 'create-team',
      title: 'Créer une équipe',
      icon: '👥',
      color: COLORS.WARNING,
      onPress: () =>
        navigation.navigate('Teams', {
          screen: 'CreateTeam',
        }),
    },
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'match_invitation',
      title: 'Nouvelle invitation de match',
      description: 'FC Barcelone vs Real Madrid',
      time: 'Il y a 2h',
      status: 'pending',
    },
    {
      id: '2',
      type: 'team_update',
      title: "Nouveau membre dans l'équipe",
      description: 'Jean Dupont a rejoint Les Tigres',
      time: 'Il y a 4h',
      status: 'info',
    },
  ];

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
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: FONTS.SIZE.LG,
                color: COLORS.TEXT_WHITE,
                fontWeight: 'bold',
              }}
            >
              Bonjour {user?.firstName || 'Joueur'} ! 👋
            </Text>
            <Text
              style={{
                fontSize: FONTS.SIZE.SM,
                color: COLORS.TEXT_WHITE,
                opacity: 0.9,
                marginTop: 4,
              }}
            >
              Prêt pour de nouveaux matchs ?
            </Text>
          </View>

          {/* Actions header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Notifications */}
            <TouchableOpacity
              style={{
                position: 'relative',
                padding: 8,
                marginRight: 8,
              }}
              onPress={() =>
                Alert.alert('Notifications', 'Fonctionnalité en développement')
              }
            >
              <Text style={{ fontSize: 24 }}>🔔</Text>
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: COLORS.ERROR,
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.TEXT_WHITE,
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Bouton logout */}
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              onPress={handleLogout}
            >
              <Text
                style={{
                  color: COLORS.TEXT_WHITE,
                  fontSize: FONTS.SIZE.SM,
                  fontWeight: '600',
                }}
              >
                ↗️ Déconnexion
              </Text>
            </TouchableOpacity>
          </View>
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
        {/* Statistiques rapides */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: DIMENSIONS.SPACING_LG,
          }}
        >
          <StatCard
            title="Matchs cette semaine"
            value={stats.matchesThisWeek}
            icon="⚽"
            color={COLORS.PRIMARY}
          />
          <StatCard
            title="Mes équipes"
            value={stats.teamsCount}
            icon="👥"
            color={COLORS.SUCCESS}
          />
          <StatCard
            title="Invitations"
            value={stats.pendingInvitations}
            icon="📨"
            color={COLORS.WARNING}
          />
        </View>

        {/* Actions rapides */}
        <View style={{ marginBottom: DIMENSIONS.SPACING_LG }}>
          <Text
            style={{
              fontSize: FONTS.SIZE.LG,
              fontWeight: 'bold',
              color: COLORS.TEXT_PRIMARY,
              marginBottom: DIMENSIONS.SPACING_MD,
            }}
          >
            Actions rapides
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={{
                  flex: 1,
                  marginHorizontal: 4,
                  backgroundColor: COLORS.CARD_BACKGROUND,
                  borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
                  padding: DIMENSIONS.SPACING_MD,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
                onPress={action.onPress}
              >
                <Text style={{ fontSize: 24, marginBottom: 8 }}>
                  {action.icon}
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.SIZE.SM,
                    color: COLORS.TEXT_PRIMARY,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}
                >
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activité récente */}
        <View>
          <Text
            style={{
              fontSize: FONTS.SIZE.LG,
              fontWeight: 'bold',
              color: COLORS.TEXT_PRIMARY,
              marginBottom: DIMENSIONS.SPACING_MD,
            }}
          >
            Activité récente
          </Text>

          {recentActivity.map(activity => (
            <TouchableOpacity
              key={activity.id}
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
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: FONTS.SIZE.MD,
                      fontWeight: '600',
                      color: COLORS.TEXT_PRIMARY,
                      marginBottom: 4,
                    }}
                  >
                    {activity.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: FONTS.SIZE.SM,
                      color: COLORS.TEXT_SECONDARY,
                      marginBottom: 8,
                    }}
                  >
                    {activity.description}
                  </Text>
                  <Text
                    style={{
                      fontSize: FONTS.SIZE.SM,
                      color: COLORS.TEXT_SECONDARY,
                    }}
                  >
                    {activity.time}
                  </Text>
                </View>

                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      activity.status === 'pending'
                        ? COLORS.WARNING
                        : COLORS.SUCCESS,
                    marginTop: 6,
                  }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* État vide si pas d'activité */}
        {recentActivity.length === 0 && (
          <View
            style={{
              backgroundColor: COLORS.CARD_BACKGROUND,
              borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
              padding: DIMENSIONS.SPACING_XL,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⚽</Text>
            <Text
              style={{
                fontSize: FONTS.SIZE.LG,
                fontWeight: 'bold',
                color: COLORS.TEXT_PRIMARY,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Aucune activité récente
            </Text>
            <Text
              style={{
                fontSize: FONTS.SIZE.MD,
                color: COLORS.TEXT_SECONDARY,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Commencez par créer une équipe ou chercher des adversaires !
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Composant StatCard
const StatCard = ({ title, value, icon, color }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: COLORS.CARD_BACKGROUND,
      borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
      padding: DIMENSIONS.SPACING_MD,
      marginHorizontal: 4,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    }}
  >
    <Text style={{ fontSize: 24, marginBottom: 8 }}>{icon}</Text>
    <Text
      style={{
        fontSize: FONTS.SIZE.XXL,
        fontWeight: 'bold',
        color: color,
        marginBottom: 4,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: FONTS.SIZE.SM,
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
      }}
    >
      {title}
    </Text>
  </View>
);
