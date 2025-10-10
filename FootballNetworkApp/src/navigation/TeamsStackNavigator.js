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

// Constantes
const COLORS = {
  PRIMARY: '#22C55E',
  TEXT_WHITE: '#FFFFFF',
};

export const TeamsStackNavigator = () => {
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
        name="MyTeams"
        component={MyTeamsScreen}
        options={{
          headerShown: false, // On utilise le header custom du screen
        }}
      />
      <Stack.Screen
        name="CreateTeam"
        component={CreateTeamScreen}
        options={{
          title: 'Créer une équipe',
          headerBackTitle: 'Retour',
        }}
      />
      <Stack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        initialParams={{ title: "Détail de l'équipe" }}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditTeam"
        component={EditTeamScreen}
        initialParams={{ title: "Modifier l'équipe" }}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TeamMembers"
        component={TeamMembersScreen}
        initialParams={{ title: "Membres de l'équipe" }}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
