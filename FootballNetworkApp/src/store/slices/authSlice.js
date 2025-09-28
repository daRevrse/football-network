import { createSlice } from '@reduxjs/toolkit';
import { SecureStorage } from '../../services/storage';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
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
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;

      // Sauvegarder en stockage sécurisé
      SecureStorage.setTokens(token, refreshToken);
      SecureStorage.setUser(user);
    },
    logout: state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      // Nettoyer le stockage
      SecureStorage.clearAll();
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      SecureStorage.setUser(state.user);
    },
    setTokens: (state, action) => {
      const { token, refreshToken } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken;
      SecureStorage.setTokens(token, refreshToken);
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  loginSuccess,
  logout,
  updateUser,
  setTokens,
} = authSlice.actions;

export default authSlice.reducer;
