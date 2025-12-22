// ====== src/navigation/MainTabNavigator.js ======
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  DashboardScreen,
  PlayerDashboardScreen,
  ManagerDashboardScreen,
  RefereeDashboardScreen
} from '../screens/dashboard';
import { TeamsStackNavigator } from './TeamsStackNavigator';
import { MatchesStackNavigator } from './MatchesStackNavigator';
import { SearchStackNavigator } from './SearchStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import FeedScreen from '../screens/feed/FeedScreen';

const Tab = createBottomTabNavigator();

// Thème Dark "Premium"
const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B', // Couleur de la TabBar
  ACCENT: '#22C55E', // Vert Néon
  INACTIVE: '#64748B', // Gris ardoise
  BADGE: '#EF4444', // Rouge notification
  TEXT: '#F8FAFC',
};

// Icône de Tab Bar personnalisée
const TabBarIcon = ({ focused, iconName, badgeCount }) => {
  const color = focused ? THEME.ACCENT : THEME.INACTIVE;

  return (
    <View style={styles.iconContainer}>
      {/* Effet de lueur subtile quand actif */}
      <View
        style={[
          styles.iconWrapper,
          focused && { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
        ]}
      >
        <Icon name={iconName} size={24} color={color} />
      </View>

      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export const MainTabNavigator = () => {
  // Récupérer le rôle de l'utilisateur
  const userType = useSelector(state => state.auth?.user?.userType);

  // Sélecteurs Redux pour les badges
  const { unreadCount } = useSelector(
    state => state.notifications || { unreadCount: 0 },
  );
  const { invitations } = useSelector(
    state => state.matches || { invitations: [] },
  );
  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending',
  ).length;

  // Choisir le bon Dashboard selon le rôle
  const getDashboardComponent = () => {
    switch (userType) {
      case 'player':
        return PlayerDashboardScreen;
      case 'manager':
        return ManagerDashboardScreen;
      case 'referee':
        return RefereeDashboardScreen;
      default:
        return PlayerDashboardScreen; // Par défaut joueur
    }
  };

  // Déterminer si l'utilisateur peut créer des matchs
  const canCreateMatches = userType === 'manager';

  // Déterminer si l'utilisateur peut créer/gérer des équipes
  const canManageTeams = userType === 'player' || userType === 'manager';

  // Les arbitres ont accès à leurs propres écrans
  const isReferee = userType === 'referee';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // On cache les labels pour un look plus épuré
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused }) => {
          let iconName;
          let badgeCount = 0;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home';
              break;
            case 'Feed':
              iconName = 'activity';
              break;
            case 'Teams':
              iconName = 'shield';
              break;
            case 'Search':
              iconName = 'search';
              break;
            case 'Matches':
              iconName = 'calendar';
              badgeCount = pendingInvitations;
              break;
            case 'Profile':
              iconName = 'user';
              badgeCount = unreadCount;
              break;
            default:
              iconName = 'circle';
          }

          return (
            <TabBarIcon
              focused={focused}
              iconName={iconName}
              badgeCount={badgeCount}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={getDashboardComponent()}
        options={{
          title: userType === 'referee' ? 'Dashboard Arbitre' :
                 userType === 'manager' ? 'Dashboard Manager' :
                 'Dashboard'
        }}
      />
      <Tab.Screen name="Feed" component={FeedScreen} />

      {/* Les arbitres n'ont pas besoin de l'onglet Teams */}
      {canManageTeams && (
        <Tab.Screen name="Teams" component={TeamsStackNavigator} />
      )}

      <Tab.Screen name="Matches" component={MatchesStackNavigator} />

      {/* L'onglet Search reste accessible à tous */}
      <Tab.Screen name="Search" component={SearchStackNavigator} />

      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: THEME.SURFACE,
    borderTopWidth: 0, // Pas de bordure pour un look "flottant" ou intégré
    elevation: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    // Ombre subtile vers le haut pour détacher du fond
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: THEME.BADGE,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.SURFACE, // Bordure couleur fond pour "découper" le badge
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
