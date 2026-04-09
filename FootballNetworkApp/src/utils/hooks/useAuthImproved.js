import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../lib/supabase';
import {
  loginSuccess,
  logout,
  setLoading,
  setError,
  clearError,
} from '../../store/slices/authSlice';

export const useAuthImproved = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  const login = async (email, password) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        dispatch(setError(error.message));
        return { success: false, error: error.message };
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = "Une erreur inattendue est survenue";
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const signup = async userData => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            user_type: userData.userType || 'player',
          }
        }
      });

      if (authError) {
         dispatch(setError(authError.message));
         return { success: false, error: authError.message };
      }

      // Insertion du profil dans la table publique 'users'
      // Identique à la logique Web
      const { error: dbError } = await supabase.from('users').insert([{
        email: userData.email,
        password: 'SUPABASE_AUTH_MANAGED',
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        user_type: userData.userType || 'player',
        is_active: true,
        email_verified: false
      }]);

      if (dbError) console.error("Database insert error", dbError);

      return { success: true, user: authData.user };
    } catch (error) {
      const errorMessage = "Une erreur inattendue est survenue";
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const verifyAuth = async () => {
    // Redondant car AppNavigator s'abonne à auth.onAuthStateChange()
    // et récupère la session via getSession() au montage.
    return true;
  };

  const refreshAuthToken = async () => {
    // Géré automatiquement par Supabase (autoRefreshToken: true)
    return true;
  };

  const logoutUser = async () => {
    try {
      await supabase.auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      // Dans tous les cas on vide le store Redux (ce qui déclenche la navigation vers Auth)
      dispatch(logout());
    }
  };

  return {
    ...auth,
    login,
    signup,
    logout: logoutUser,
    verifyAuth,
    refreshToken: refreshAuthToken,
  };
};
