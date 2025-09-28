import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { LoadingSpinner } from '../components/common';
import { SecureStorage } from '../services/storage';
import { loginSuccess } from '../store/slices/authSlice';

export const AppNavigator = () => {
  const dispatch = useDispatch();

  // Sélecteur sécurisé
  const authState = useSelector(state => {
    if (!state || !state.auth) {
      return { isAuthenticated: false, isLoading: false };
    }
    return state.auth;
  });

  const { isAuthenticated, isLoading } = authState;
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log("🔍 Vérification de l'authentification...");

      const token = await SecureStorage.getToken();
      const user = await SecureStorage.getUser();

      if (token && user) {
        console.log(
          '✅ Token et utilisateur trouvés - Restauration de la session',
        );
        dispatch(
          loginSuccess({
            user,
            token,
            refreshToken: await SecureStorage.getRefreshToken(),
          }),
        );
      } else {
        console.log('❌ Pas de session sauvegardée');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification auth:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Affichage du loading pendant l'initialisation
  if (isInitializing || isLoading) {
    return (
      <LoadingSpinner
        message="Vérification de la connexion..."
        style={{ backgroundColor: '#F8FAFC' }}
      />
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
