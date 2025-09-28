import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  matches: [],
  upcomingMatches: [],
  pastMatches: [],
  invitations: [],
  currentMatch: null,
  isLoading: false,
  error: null,
};

const matchesSlice = createSlice({
  name: 'matches',
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
    setMatches: (state, action) => {
      state.matches = action.payload;
      state.isLoading = false;
    },
    setUpcomingMatches: (state, action) => {
      state.upcomingMatches = action.payload;
    },
    setPastMatches: (state, action) => {
      state.pastMatches = action.payload;
    },
    addMatch: (state, action) => {
      state.matches.push(action.payload);
      // Trier par date
      state.matches.sort(
        (a, b) => new Date(b.match_date) - new Date(a.match_date),
      );
    },
    updateMatch: (state, action) => {
      const index = state.matches.findIndex(
        match => match.id === action.payload.id,
      );
      if (index !== -1) {
        state.matches[index] = { ...state.matches[index], ...action.payload };
      }
      if (state.currentMatch?.id === action.payload.id) {
        state.currentMatch = { ...state.currentMatch, ...action.payload };
      }
    },
    removeMatch: (state, action) => {
      state.matches = state.matches.filter(
        match => match.id !== action.payload,
      );
      if (state.currentMatch?.id === action.payload) {
        state.currentMatch = null;
      }
    },
    setCurrentMatch: (state, action) => {
      state.currentMatch = action.payload;
    },
    setInvitations: (state, action) => {
      state.invitations = action.payload;
    },
    addInvitation: (state, action) => {
      state.invitations.unshift(action.payload);
    },
    updateInvitation: (state, action) => {
      const index = state.invitations.findIndex(
        inv => inv.id === action.payload.id,
      );
      if (index !== -1) {
        state.invitations[index] = {
          ...state.invitations[index],
          ...action.payload,
        };
      }
    },
    removeInvitation: (state, action) => {
      state.invitations = state.invitations.filter(
        inv => inv.id !== action.payload,
      );
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setMatches,
  setUpcomingMatches,
  setPastMatches,
  addMatch,
  updateMatch,
  removeMatch,
  setCurrentMatch,
  setInvitations,
  addInvitation,
  updateInvitation,
  removeInvitation,
} = matchesSlice.actions;

export default matchesSlice.reducer;
