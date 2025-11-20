// ====== src/navigation/SearchStackNavigator.js - VERSION MISE À JOUR ======
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SearchScreen } from './../screens/search/SearchScreen';

const Stack = createStackNavigator();

export const SearchStackNavigator = () => {
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
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Rechercher',
        }}
      />
    </Stack.Navigator>
  );
};
