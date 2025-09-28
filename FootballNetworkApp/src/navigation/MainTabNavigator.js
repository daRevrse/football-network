import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { View, Text } from 'react-native';
import { DashboardScreen } from '../screens/dashboard';
import { TeamsStackNavigator } from './TeamsStackNavigator';

const Tab = createBottomTabNavigator();

// Constantes
const COLORS = {
  PRIMARY: '#22C55E',
  TEXT_SECONDARY: '#6B7280',
  CARD_BACKGROUND: '#FFFFFF',
  BORDER_LIGHT: '#F3F4F6',
  ERROR: '#EF4444',
  TEXT_WHITE: '#FFFFFF',
};

// Composant pour les onglets pas encore développés
const ComingSoonScreen = ({ title }) => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      paddingHorizontal: 32,
    }}
  >
    <Text style={{ fontSize: 48, marginBottom: 16 }}>🚧</Text>
    <Text
      style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.TEXT_PRIMARY || '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 24,
      }}
    >
      Cette fonctionnalité sera bientôt disponible !
    </Text>
  </View>
);

const SearchScreen = () => <ComingSoonScreen title="Recherche d'équipes" />;
const MatchesScreen = () => <ComingSoonScreen title="Mes matchs" />;
const ProfileScreen = () => <ComingSoonScreen title="Mon profil" />;

// Icône avec badge
const TabBarIcon = ({ focused, size, name, badgeCount }) => {
  const iconMap = {
    dashboard: '🏠',
    teams: '👥',
    search: '🔍',
    matches: '⚽',
    profile: '👤',
  };

  return (
    <View style={{ position: 'relative' }}>
      <Text
        style={{
          fontSize: size,
          opacity: focused ? 1 : 0.6,
        }}
      >
        {iconMap[name] || '❓'}
      </Text>
      {badgeCount > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -8,
            top: -8,
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
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export const MainTabNavigator = () => {
  // Sélecteurs sécurisés avec valeurs par défaut
  const notificationsState = useSelector(state => {
    if (!state || !state.notifications) return { unreadCount: 0 };
    return state.notifications;
  });

  const matchesState = useSelector(state => {
    if (!state || !state.matches) return { invitations: [] };
    return state.matches;
  });

  const { unreadCount } = notificationsState;
  const { invitations } = matchesState;
  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending',
  ).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          let badgeCount = 0;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Teams') {
            iconName = 'teams';
          } else if (route.name === 'Search') {
            iconName = 'search';
          } else if (route.name === 'Matches') {
            iconName = 'matches';
            badgeCount = pendingInvitations;
          } else if (route.name === 'Profile') {
            iconName = 'profile';
            badgeCount = unreadCount;
          }

          return (
            <TabBarIcon
              focused={focused}
              size={size}
              name={iconName}
              badgeCount={badgeCount}
            />
          );
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: COLORS.CARD_BACKGROUND,
          borderTopColor: COLORS.BORDER_LIGHT,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamsStackNavigator}
        options={{ title: 'Équipes' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Recherche' }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ title: 'Matchs' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};
