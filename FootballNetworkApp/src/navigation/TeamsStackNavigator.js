// ====== src/navigation/TeamsStackNavigator.js - MISE À JOUR ======
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  MyTeamsScreen,
  CreateTeamScreen,
  TeamDetailScreen,
  EditTeamScreen,
  TeamMembersScreen,
} from '../screens/teams';

const Stack = createStackNavigator();

export const TeamsStackNavigator = () => {
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
        name="MyTeams"
        component={MyTeamsScreen}
        options={{
          title: 'Mes Équipes',
        }}
      />

      <Stack.Screen
        name="CreateTeam"
        component={CreateTeamScreen}
        options={{
          title: 'Créer une équipe',
          presentation: 'modal', // Animation modale pour iOS
        }}
      />

      <Stack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        options={({ route }) => ({
          title: route.params?.teamName || "Détail de l'équipe",
        })}
      />

      <Stack.Screen
        name="EditTeam"
        component={EditTeamScreen}
        options={({ route }) => ({
          title: route.params?.teamName || "Modifier l'équipe",
          presentation: 'modal',
        })}
      />

      <Stack.Screen
        name="TeamMembers"
        component={TeamMembersScreen}
        options={({ route }) => ({
          title: route.params?.teamName || "Membres de l'équipe",
        })}
      />
    </Stack.Navigator>
  );
};
