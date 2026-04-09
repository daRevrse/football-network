import { createSlice } from '@reduxjs/toolkit';
import { SecureStorage } from '../../services/storage';

const initialState = {
  user: null, // Le profil complet issu de notre table 'users'
  session: null, // L'objet session brut renvoyé par Supabase
  isAuthenticated: false,
  isLoading: true, // true par défaut pour éviter le "flicker" de l'écran de login au démarrage
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: state => {
      state.error = null;
    },
    loginSuccess: (state, action) => {
      // action.payload = { user: profilMétier, session: objetSessionSupabase }
      const { user, session } = action.payload;
      state.user = user;
      state.session = session;
      state.isAuthenticated = !!session;
      state.isLoading = false;
      state.error = null;
      
      // Stockage local non sensible (Supabase gère ses propres tokens)
      SecureStorage.setUser(user);
    },
    logout: state => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      SecureStorage.removeUser();
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      SecureStorage.setUser(state.user);
    },
      // Le refreshToken est obsolète avec la configuration Supabase AutoRefreshToken
    },
    setSessionOnly: (state, action) => {
      // Pour une restauration au démarrage quand getProfile() est en cours
      state.session = action.payload;
      state.isAuthenticated = !!action.payload;
    }
  },
});

export const {
  setLoading,
  setError,
  clearError,
  loginSuccess,
  logout,
  updateUser,
  setSessionOnly,
} = authSlice.actions;

export default authSlice.reducer;
