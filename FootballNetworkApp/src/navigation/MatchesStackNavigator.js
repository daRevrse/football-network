// ====== src/navigation/MatchesStackNavigator.js - MISE À JOUR ======
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import {
  MatchesScreen,
  CreateMatchScreen,
  MatchDetailScreen,
  PublicMatchDetailScreen,
  InvitationsScreen,
} from '../screens/matches';
import { RefereeMatchesScreen } from '../screens/matches/RefereeMatchesScreen';

const Stack = createStackNavigator();

export const MatchesStackNavigator = () => {
  // Récupérer le type d'utilisateur depuis Redux
  const userType = useSelector(state => state.auth?.user?.userType);
  const isReferee = userType === 'referee';

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
      {/* Afficher le dashboard arbitre si l'utilisateur est arbitre, sinon l'écran normal */}
      <Stack.Screen
        name="Matches"
        component={isReferee ? RefereeMatchesScreen : MatchesScreen}
        options={{
          title: isReferee ? 'Dashboard Arbitre' : 'Mes Matchs',
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
        name="PublicMatchDetail"
        component={PublicMatchDetailScreen}
        options={{
          title: 'Match',
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
