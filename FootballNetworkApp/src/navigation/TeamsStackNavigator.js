import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MyTeamsScreen, CreateTeamScreen } from '../screens/teams';

const Stack = createStackNavigator();

// Constantes
const COLORS = {
  PRIMARY: '#22C55E',
  TEXT_WHITE: '#FFFFFF',
};

// Écrans temporaires
const TemporaryScreen = ({ route }) => {
  const { View, Text } = require('react-native');
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 32,
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🚧</Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {route.params?.title || 'Écran en développement'}
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 24,
        }}
      >
        Cette fonctionnalité sera bientôt disponible !
      </Text>
    </View>
  );
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
        component={TemporaryScreen}
        initialParams={{ title: "Détail de l'équipe" }}
        options={({ route }) => ({
          title: route.params?.teamName || 'Équipe',
          headerBackTitle: 'Retour',
        })}
      />
      <Stack.Screen
        name="EditTeam"
        component={TemporaryScreen}
        initialParams={{ title: "Modifier l'équipe" }}
        options={{
          title: "Modifier l'équipe",
          headerBackTitle: 'Retour',
        }}
      />
      <Stack.Screen
        name="TeamMembers"
        component={TemporaryScreen}
        initialParams={{ title: "Membres de l'équipe" }}
        options={{
          title: 'Membres',
          headerBackTitle: 'Retour',
        }}
      />
    </Stack.Navigator>
  );
};
