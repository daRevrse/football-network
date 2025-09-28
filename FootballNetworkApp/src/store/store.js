import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import teamsSlice from './slices/teamsSlice';
import matchesSlice from './slices/matchesSlice';
import userSlice from './slices/userSlice';
import notificationsSlice from './slices/notificationsSlice';
import searchSlice from './slices/searchSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    teams: teamsSlice,
    matches: matchesSlice,
    user: userSlice,
    notifications: notificationsSlice,
    search: searchSlice,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

export default store;
