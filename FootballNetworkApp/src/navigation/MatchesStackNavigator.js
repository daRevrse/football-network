// ====== src/navigation/MatchesStackNavigator.js ======
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  MatchesScreen,
  MatchDetailScreen,
  CreateMatchScreen,
  InvitationsScreen,
} from '@screens/matches';
import { COLORS } from '@utils/constants';

const Stack = createStackNavigator();

export const MatchesStackNavigator = () => {
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
        name="Matches"
        component={MatchesScreen}
        options={{ title: 'Mes Matchs' }}
      />
      <Stack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
        options={{ title: 'Détail du match' }}
      />
      <Stack.Screen
        name="CreateMatch"
        component={CreateMatchScreen}
        options={{ title: 'Créer un match' }}
      />
      <Stack.Screen
        name="Invitations"
        component={InvitationsScreen}
        options={{ title: 'Invitations reçues' }}
      />
    </Stack.Navigator>
  );
};
