import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import {
  SplashScreen,
  WelcomeScreen,
  RoleSelectionScreen,
  ProfileCompletionScreen,
  TutorialScreen,
} from '../screens/onboarding';

const Stack = createStackNavigator();

// Constantes
const COLORS = {
  PRIMARY: '#22C55E',
  TEXT_WHITE: '#FFFFFF',
};

// Composant temporaire pour éviter les erreurs
const TemporaryScreen = ({ route }) => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
      }}
    >
      <Text style={{ fontSize: 18, color: '#1F2937', marginBottom: 16 }}>
        {route.params?.title || 'Écran en développement'}
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280' }}>
        Cette fonctionnalité sera bientôt disponible
      </Text>
    </View>
  );
};

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Splash"
    >
      {/* Onboarding Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
      <Stack.Screen name="Tutorial" component={TutorialScreen} />

      {/* Authentication Screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};
