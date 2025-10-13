// ====== src/navigation/MatchesStackNavigator.js - MISE À JOUR ======
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  MatchesScreen,
  CreateMatchScreen,
  MatchDetailScreen,
  InvitationsScreen,
} from '../screens/matches';

const Stack = createStackNavigator();

export const MatchesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Tous les écrans gèrent leur propre header
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: 'Mes Matchs',
        }}
      />

      <Stack.Screen
        name="CreateMatch"
        component={CreateMatchScreen}
        options={{
          title: 'Créer un match',
          presentation: 'modal', // Animation modale pour iOS
        }}
      />

      <Stack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
        options={{
          title: 'Détail du match',
        }}
      />

      <Stack.Screen
        name="Invitations"
        component={InvitationsScreen}
        options={{
          title: 'Invitations',
        }}
      />
    </Stack.Navigator>
  );
};
