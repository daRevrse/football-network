/**
 * VenueOwnerNavigator - Navigation for Venue Owner role
 * Focused on venue and booking management
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

import { ProfileStackNavigator } from './ProfileStackNavigator';
import { VenueOwnerDashboardScreen } from '../screens/dashboard';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const THEME = {
  BG: COLORS.BACKGROUND,
  SURFACE: '#1E293B',
  ACCENT: '#FF5722', // Orange for venue owner
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

// My Venues Screen
const MyVenuesScreen = () => (
  <View style={styles.placeholderContainer}>
    <Icon name="map-pin" size={48} color={THEME.ACCENT} />
    <Text style={styles.placeholderTitle}>Mes Terrains</Text>
    <Text style={styles.placeholderText}>
      Gerez vos terrains et leurs disponibilites
    </Text>
    <TouchableOpacity style={styles.addButton}>
      <Icon name="plus" size={20} color={COLORS.TEXT_WHITE} />
      <Text style={styles.addButtonText}>Ajouter un terrain</Text>
    </TouchableOpacity>
  </View>
);

// Bookings Screen
const BookingsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Icon name="calendar" size={48} color={THEME.ACCENT} />
    <Text style={styles.placeholderTitle}>Reservations</Text>
    <Text style={styles.placeholderText}>
      Consultez et gerez les demandes de reservation
    </Text>
  </View>
);

// Venues Stack Navigator
const VenuesStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VenuesList" component={MyVenuesScreen} />
    </Stack.Navigator>
  );
};

// Bookings Stack Navigator
const BookingsStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsList" component={BookingsScreen} />
    </Stack.Navigator>
  );
};

export const VenueOwnerNavigator = () => {
  const { unreadCount } = useSelector(
    state => state.notifications || { unreadCount: 0 },
  );

  // Count pending bookings for badge
  const pendingBookings = 0; // TODO: Get from venue owner state

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
            case 'Venues':
              iconName = 'map-pin';
              break;
            case 'Bookings':
              iconName = 'calendar';
              badgeCount = pendingBookings;
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
        component={VenueOwnerDashboardScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Venues"
        component={VenuesStackNavigator}
        options={{ title: 'Terrains' }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsStackNavigator}
        options={{ title: 'Reservations' }}
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.ACCENT,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.TEXT_WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default VenueOwnerNavigator;
