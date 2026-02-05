import Constants from 'expo-constants';

// Get API URL from environment or use default
const getApiUrl = () => {
  // Check for environment variable first
  const envUrl = Constants.expoConfig?.extra?.apiUrl;
  if (envUrl) return envUrl;

  // Default development URL - change this to your local IP address
  if (__DEV__) {
    return 'http://192.168.1.97:5000/api'; // Change to your local IP
  }

  // Production URL
  return 'https://your-api.com/api';
};

const getSocketUrl = () => {
  const envUrl = Constants.expoConfig?.extra?.socketUrl;
  if (envUrl) return envUrl;

  if (__DEV__) {
    return 'http://192.168.1.97:5000'; // Change to your local IP
  }

  return 'https://your-api.com';
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  SOCKET_URL: getSocketUrl(),
  TIMEOUT: 15000, // 15 seconds

  // Endpoints selon votre API backend
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/signup',
    VERIFY_TOKEN: '/auth/verify',
    REFRESH_TOKEN: '/auth/refresh',

    // Users
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    USER_STATS: '/users/stats',

    // Teams
    TEAMS: '/teams',
    MY_TEAMS: '/teams/my',
    TEAM_MEMBERS: '/teams/:id/members',
    TEAM_DETAILS: '/teams/:id',

    // Matches
    MATCHES: '/matches',
    MATCH_DETAILS: '/matches/:id',
    MATCH_INVITATIONS: '/matches/invitations',
    MATCH_INVITATIONS_RECEIVED: '/matches/invitations/received',
    RESPOND_INVITATION: '/matches/invitations/:id/respond',
    PENDING_VALIDATIONS: '/matches/pending-validation/list',

    // Player Invitations
    PLAYER_INVITATIONS: '/player-invitations',

    // Participations
    MY_PARTICIPATIONS: '/participations/my-pending',
    RESPOND_PARTICIPATION: '/participations/:id/respond',

    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATION_STATS: '/notifications/stats',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',

    // Search
    SEARCH: '/search',
    SEARCH_SUGGESTIONS: '/search/suggestions',
    SEARCH_PLAYERS: '/search/players',
    SEARCH_TEAMS: '/search/teams',

    // Venues
    VENUES: '/venues',
    VENUE_DETAILS: '/venues/:id',

    // Referee
    REFEREE_MATCHES: '/referee/matches/my-matches',
    REFEREE_REPORTS: '/referee/reports',
  },
};

// Helper to build endpoint URLs with parameters
export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return `${API_CONFIG.BASE_URL}${url}`;
};

export default API_CONFIG;
