/**
 * PlayerNavigator - Navigation for Player role
 * Simple interface focused on match participation and team membership
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

import { PlayerDashboardScreen } from '../screens/dashboard';
import { TeamsStackNavigator } from './TeamsStackNavigator';
import { MatchesStackNavigator } from './MatchesStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

const THEME = {
  BG: COLORS.BACKGROUND,
  SURFACE: '#1E293B',
  ACCENT: COLORS.PRIMARY,
  INACTIVE: '#64748B',
  BADGE: COLORS.ERROR,
  TEXT: COLORS.TEXT_WHITE,
};

const TabBarIcon = ({ focused, iconName, badgeCount }) => {
  const color = focused ? THEME.ACCENT : THEME.INACTIVE;

  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.iconWrapper,
          focused && { backgroundColor: `${COLORS.PRIMARY}20` },
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

export const PlayerNavigator = () => {
  const { unreadCount } = useSelector(
    state => state.notifications || { unreadCount: 0 },
  );
  const { invitations } = useSelector(
    state => state.matches || { invitations: [] },
  );
  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending',
  ).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: THEME.ACCENT,
        tabBarInactiveTintColor: THEME.INACTIVE,
        tabBarIcon: ({ focused }) => {
          let iconName;
          let badgeCount = 0;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Teams':
              iconName = 'users';
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
        name="Home"
        component={PlayerDashboardScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamsStackNavigator}
        options={{ title: 'Equipes' }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesStackNavigator}
        options={{ title: 'Matchs' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: THEME.SURFACE,
    borderTopWidth: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 40,
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
    top: -2,
    right: 2,
    backgroundColor: THEME.BADGE,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.SURFACE,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

export default PlayerNavigator;
