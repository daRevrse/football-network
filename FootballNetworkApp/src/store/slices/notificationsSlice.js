import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pushToken: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
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
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(notif => !notif.read).length;
      state.isLoading = false;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(
        notif => notif.id === action.payload,
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: state => {
      state.notifications.forEach(notif => {
        notif.read = true;
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const index = state.notifications.findIndex(
        notif => notif.id === action.payload,
      );
      if (index !== -1) {
        const wasUnread = !state.notifications[index].read;
        state.notifications.splice(index, 1);
        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }
    },
    setPushToken: (state, action) => {
      state.pushToken = action.payload;
    },
    clearNotifications: state => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setPushToken,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
