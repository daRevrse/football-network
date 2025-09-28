import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  myTeams: [],
  currentTeam: null,
  searchResults: [],
  isLoading: false,
  error: null,
  filters: {
    skillLevel: null,
    distance: 10,
    location: null,
  },
};

const teamsSlice = createSlice({
  name: 'teams',
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
    setMyTeams: (state, action) => {
      state.myTeams = action.payload;
      state.isLoading = false;
    },
    addTeam: (state, action) => {
      state.myTeams.push(action.payload);
    },
    updateTeam: (state, action) => {
      const index = state.myTeams.findIndex(
        team => team.id === action.payload.id,
      );
      if (index !== -1) {
        state.myTeams[index] = { ...state.myTeams[index], ...action.payload };
      }
      if (state.currentTeam?.id === action.payload.id) {
        state.currentTeam = { ...state.currentTeam, ...action.payload };
      }
    },
    removeTeam: (state, action) => {
      state.myTeams = state.myTeams.filter(team => team.id !== action.payload);
      if (state.currentTeam?.id === action.payload) {
        state.currentTeam = null;
      }
    },
    setCurrentTeam: (state, action) => {
      state.currentTeam = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
      state.isLoading = false;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSearchResults: state => {
      state.searchResults = [];
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setMyTeams,
  addTeam,
  updateTeam,
  removeTeam,
  setCurrentTeam,
  setSearchResults,
  setFilters,
  clearSearchResults,
} = teamsSlice.actions;

export default teamsSlice.reducer;
