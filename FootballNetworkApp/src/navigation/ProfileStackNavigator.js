// ====== src/navigation/ProfileStackNavigator.js ======
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  ProfileScreen,
  EditProfileScreen,
  SettingsScreen,
  PrivacyScreen,
  HelpScreen,
  NotificationsCenterScreen,
} from '../screens/profile';
import { COLORS } from '@utils/constants';

const Stack = createStackNavigator();

export const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.PRIMARY,
        },
        headerTintColor: COLORS.TEXT_WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsCenterScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
