// ====== src/navigation/SearchStackNavigator.js ======
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SearchScreen,
  // SearchResultsScreen,
  // TeamProfileScreen,
} from '../screens/search';
import { COLORS } from '@utils/constants';

const Stack = createStackNavigator();

export const SearchStackNavigator = () => {
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
        name="Search"
        component={SearchScreen}
        options={{ title: 'Rechercher des équipes' }}
      />
      {/* <Stack.Screen
        name="SearchResults"
        component={SearchResultsScreen}
        options={{ title: 'Résultats de recherche' }}
      />
      <Stack.Screen
        name="TeamProfile"
        component={TeamProfileScreen}
        options={({ route }) => ({
          title: route.params?.teamName || 'Profil équipe',
        })}
      /> */}
    </Stack.Navigator>
  );
};
