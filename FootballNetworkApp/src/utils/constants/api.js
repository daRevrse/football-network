export const API_CONFIG = {
  // Changez cette URL pour pointer vers votre serveur
  BASE_URL: __DEV__
    ? 'http://192.168.1.83:5000/api' // Développement
    : 'https://your-api.com/api', // Production

  SOCKET_URL: __DEV__
    ? 'http://192.168.1.83:5000' // Développement
    : 'https://your-api.com', // Production

  TIMEOUT: 10000, // 10 secondes

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

    // Teams
    TEAMS: '/teams',
    MY_TEAMS: '/teams/my-teams',
    TEAM_MEMBERS: '/teams/:id/members',

    // Matches
    MATCHES: '/matches',
    MATCH_INVITATIONS: '/match-invitations',
    RESPOND_INVITATION: '/match-invitations/:id/respond',

    // Player Invitations
    PLAYER_INVITATIONS: '/player-invitations',

    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATION_STATS: '/notifications/stats',
  },
};
