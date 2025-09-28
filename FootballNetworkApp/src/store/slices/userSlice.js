import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  preferences: {
    notifications: true,
    geolocation: true,
    language: 'fr',
  },
  stats: {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  },
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
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
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.isLoading = false;
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    clearProfile: state => {
      state.profile = null;
      state.stats = initialState.stats;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setProfile,
  updateProfile,
  setPreferences,
  setStats,
  clearProfile,
} = userSlice.actions;

export default userSlice.reducer;
