import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { AuthNavigator } from './AuthNavigator';
import { RoleBasedNavigator } from './RoleBasedNavigator';
import { LoadingSpinner } from '../components/common';
import { SecureStorage } from '../services/storage';
import { loginSuccess, logout, setSessionOnly } from '../store/slices/authSlice';
import { supabase } from '../lib/supabase';

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
    let mounted = true;

    async function getProfile(sessionObj) {
      if (!sessionObj) {
        if (mounted) {
          dispatch(logout());
          setIsInitializing(false);
        }
        return;
      }

      try {
        const { user: authUser } = sessionObj;
        
        // Optimistic UI state
        dispatch(setSessionOnly(sessionObj));

        // Récupérer le profil depuis notre table "users" métier
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", authUser.email)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user profile:", error);
        }

        if (mounted) {
          dispatch(loginSuccess({
            user: profile || { email: authUser.email, is_verified: false },
            session: sessionObj
          }));
        }
      } catch (err) {
        console.error("Error in getProfile", err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }

    // Capture de la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      getProfile(session);
    });

    // Écouteur des changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          getProfile(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

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
      {isAuthenticated ? <RoleBasedNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
