import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  query: '',
  filters: {
    distance: 10,
    skillLevel: null,
    location: null,
    fieldType: null,
  },
  results: [],
  recentSearches: [],
  isLoading: false,
  error: null,
  mapRegion: null,
  showMap: false,
};

const searchSlice = createSlice({
  name: 'search',
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
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setResults: (state, action) => {
      state.results = action.payload;
      state.isLoading = false;
    },
    addRecentSearch: (state, action) => {
      const search = action.payload;
      // Éviter les doublons
      state.recentSearches = state.recentSearches.filter(
        item => item.query !== search.query,
      );
      // Ajouter en début de liste
      state.recentSearches.unshift(search);
      // Limiter à 10 recherches récentes
      if (state.recentSearches.length > 10) {
        state.recentSearches = state.recentSearches.slice(0, 10);
      }
    },
    clearRecentSearches: state => {
      state.recentSearches = [];
    },
    setMapRegion: (state, action) => {
      state.mapRegion = action.payload;
    },
    setShowMap: (state, action) => {
      state.showMap = action.payload;
    },
    clearResults: state => {
      state.results = [];
      state.query = '';
    },
    resetSearch: state => {
      state.query = '';
      state.results = [];
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setQuery,
  setFilters,
  setResults,
  addRecentSearch,
  clearRecentSearches,
  setMapRegion,
  setShowMap,
  clearResults,
  resetSearch,
} = searchSlice.actions;

export default searchSlice.reducer;
