/**
 * RefereeNavigator - Navigation for Referee role
 * Focused on match officiating and reporting
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

import { RefereeDashboardScreen } from '../screens/dashboard';
import { RefereeMatchesScreen } from '../screens/matches';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { COLORS } from '../theme/colors';

// Import referee-specific screens
import MatchSheetScreen from '../screens/matches/MatchSheetScreen';
import MatchReportScreen from '../screens/matches/MatchReportScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const THEME = {
  BG: COLORS.BACKGROUND,
  SURFACE: '#1E293B',
  ACCENT: '#9C27B0', // Purple for referee
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
          focused && { backgroundColor: `${THEME.ACCENT}20` },
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

// Matches stack for referee with match sheet and report screens
const RefereeMatchesStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RefereeMatchesList" component={RefereeMatchesScreen} />
      <Stack.Screen name="MatchSheet" component={MatchSheetScreen} />
      <Stack.Screen name="MatchReport" component={MatchReportScreen} />
    </Stack.Navigator>
  );
};

// Reports stack - history of submitted reports
const ReportsStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsList" component={ReportsListScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
    </Stack.Navigator>
  );
};

// Placeholder screens for reports
const ReportsListScreen = () => (
  <View style={styles.placeholderContainer}>
    <Icon name="file-text" size={48} color={THEME.ACCENT} />
    <Text style={styles.placeholderTitle}>Mes Rapports</Text>
    <Text style={styles.placeholderText}>
      Historique de vos rapports de match soumis
    </Text>
  </View>
);

const ReportDetailScreen = () => (
  <View style={styles.placeholderContainer}>
    <Icon name="file" size={48} color={THEME.ACCENT} />
    <Text style={styles.placeholderTitle}>Detail du Rapport</Text>
  </View>
);

export const RefereeNavigator = () => {
  const { unreadCount } = useSelector(
    state => state.notifications || { unreadCount: 0 },
  );

  // Count upcoming matches for badge
  const upcomingMatches = 0; // TODO: Get from referee state

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
            case 'Matches':
              iconName = 'calendar';
              badgeCount = upcomingMatches;
              break;
            case 'Reports':
              iconName = 'file-text';
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
        component={RefereeDashboardScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Matches"
        component={RefereeMatchesStackNavigator}
        options={{ title: 'Matchs' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStackNavigator}
        options={{ title: 'Rapports' }}
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
  // Placeholder styles
  placeholderContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },
});

export default RefereeNavigator;
