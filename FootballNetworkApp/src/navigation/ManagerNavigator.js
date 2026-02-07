/**
 * ManagerNavigator - Navigation for Manager role
 * Full team and match management capabilities
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

import { ManagerDashboardScreen } from '../screens/dashboard';
import { TeamsStackNavigator } from './TeamsStackNavigator';
import { MatchesStackNavigator } from './MatchesStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { CreateTeamScreen } from '../screens/teams';
import { CreateMatchScreen } from '../screens/matches';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();
const CreateStack = createStackNavigator();

const THEME = {
  BG: COLORS.BACKGROUND,
  SURFACE: '#1E293B',
  ACCENT: COLORS.PRIMARY,
  INACTIVE: '#64748B',
  BADGE: COLORS.ERROR,
  TEXT: COLORS.TEXT_WHITE,
};

const TabBarIcon = ({ focused, iconName, badgeCount, isCreate }) => {
  const color = isCreate ? COLORS.TEXT_WHITE : (focused ? THEME.ACCENT : THEME.INACTIVE);

  if (isCreate) {
    return (
      <View style={styles.createIconContainer}>
        <View style={styles.createButton}>
          <Icon name="plus" size={28} color={color} />
        </View>
      </View>
    );
  }

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

// Create stack for team/match creation
const CreateStackNavigator = () => {
  return (
    <CreateStack.Navigator screenOptions={{ headerShown: false }}>
      <CreateStack.Screen name="CreateChoice" component={CreateChoiceScreen} />
      <CreateStack.Screen name="CreateTeam" component={CreateTeamScreen} />
      <CreateStack.Screen name="CreateMatch" component={CreateMatchScreen} />
    </CreateStack.Navigator>
  );
};

// Screen for choosing what to create
const CreateChoiceScreen = ({ navigation }) => {
  return (
    <View style={styles.createChoiceContainer}>
      <Text style={styles.createChoiceTitle}>Que voulez-vous creer ?</Text>

      <TouchableOpacity
        style={styles.createChoiceButton}
        onPress={() => navigation.navigate('CreateTeam')}
      >
        <View style={styles.createChoiceIcon}>
          <Icon name="shield" size={32} color={COLORS.PRIMARY} />
        </View>
        <View style={styles.createChoiceContent}>
          <Text style={styles.createChoiceLabel}>Nouvelle equipe</Text>
          <Text style={styles.createChoiceDesc}>Creer et gerer votre equipe</Text>
        </View>
        <Icon name="chevron-right" size={24} color={COLORS.TEXT_MUTED} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.createChoiceButton}
        onPress={() => navigation.navigate('CreateMatch')}
      >
        <View style={styles.createChoiceIcon}>
          <Icon name="calendar" size={32} color={COLORS.PRIMARY} />
        </View>
        <View style={styles.createChoiceContent}>
          <Text style={styles.createChoiceLabel}>Nouveau match</Text>
          <Text style={styles.createChoiceDesc}>Organiser un match amical</Text>
        </View>
        <Icon name="chevron-right" size={24} color={COLORS.TEXT_MUTED} />
      </TouchableOpacity>
    </View>
  );
};

export const ManagerNavigator = () => {
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
          let isCreate = false;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Teams':
              iconName = 'users';
              break;
            case 'Create':
              iconName = 'plus-circle';
              isCreate = true;
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
              isCreate={isCreate}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={ManagerDashboardScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamsStackNavigator}
        options={{ title: 'Equipes' }}
      />
      <Tab.Screen
        name="Create"
        component={CreateStackNavigator}
        options={{
          title: '',
          tabBarLabel: () => null,
        }}
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
  createIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    marginTop: -20,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  // Create choice screen styles
  createChoiceContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  createChoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 32,
  },
  createChoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createChoiceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.PRIMARY}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createChoiceContent: {
    flex: 1,
  },
  createChoiceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  createChoiceDesc: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
  },
});

export default ManagerNavigator;
