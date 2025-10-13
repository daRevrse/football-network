// ====== src/utils/hooks/useAuthImproved.js ======
import { useSelector, useDispatch } from 'react-redux';
import { AuthApi, authApi } from '../../services/api/authApi';
import {
  loginSuccess,
  logout,
  setLoading,
  setError,
  clearError,
  setTokens,
} from '../../store/slices/authSlice'; // Chemin corrigé
import { SecureStorage } from '../../services/storage';

export const useAuthImproved = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  const login = async (email, password) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const result = await AuthApi.login(email, password);

      if (result.success) {
        dispatch(loginSuccess(result.data));
        return { success: true, user: result.data.user };
      } else {
        dispatch(setError(result.error));
        return { success: false, error: result.error, code: result.code };
      }
    } catch (error) {
      const errorMessage = 'Une erreur inattendue est survenue';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    }
  };

  const signup = async userData => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      const result = await authApi.signup(userData);

      if (result.success) {
        dispatch(loginSuccess(result.data));
        return { success: true, user: result.data.user };
      } else {
        dispatch(setError(result.error));
        return { success: false, error: result.error, code: result.code };
      }
    } catch (error) {
      const errorMessage = 'Une erreur inattendue est survenue';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    }
  };

  const verifyAuth = async () => {
    try {
      const result = await authApi.verifyToken();

      if (result.success) {
        // Token valide, mettre à jour les infos utilisateur
        dispatch(
          loginSuccess({
            user: result.data,
            token: await SecureStorage.getToken(),
            refreshToken: await SecureStorage.getRefreshToken(),
          }),
        );
        return true;
      } else {
        // Token invalide, déconnecter
        dispatch(logout());
        return false;
      }
    } catch (error) {
      dispatch(logout());
      return false;
    }
  };

  const refreshAuthToken = async () => {
    try {
      const result = await authApi.refreshToken();

      if (result.success) {
        dispatch(
          setTokens({
            token: result.data.token,
            refreshToken: await SecureStorage.getRefreshToken(),
          }),
        );
        return true;
      } else {
        dispatch(logout());
        return false;
      }
    } catch (error) {
      dispatch(logout());
      return false;
    }
  };

  const logoutUser = async () => {
    try {
      await authApi.logout();
      dispatch(logout());
      return { success: true };
    } catch (error) {
      // Même en cas d'erreur, déconnecter localement
      dispatch(logout());
      return { success: true };
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
