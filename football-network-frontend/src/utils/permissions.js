/**
 * Centralized Permissions Management for Football Network (Web)
 * Defines role-based access control for all user types
 */

export const PERMISSIONS = {
  player: {
    // Team access
    canViewTeams: true,
    canJoinTeam: true,
    canLeaveTeam: true,
    canViewTeamRoster: true,

    // Match access
    canViewMatches: true,
    canViewMatchDetails: true,
    canRespondToMatchInvitation: true,

    // Profile access
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canViewOtherProfiles: true,

    // Notifications
    canReceiveNotifications: true,

    // What players CANNOT do
    canCreateTeam: false,
    canEditTeam: false,
    canDeleteTeam: false,
    canInvitePlayers: false,
    canAssignJersey: false,
    canSetCaptain: false,
    canCreateMatch: false,
    canConfirmVenue: false,
    canRatePlayers: false,
    canValidateScore: false,
    canManageVenues: false,
    canSubmitReport: false,
  },

  manager: {
    // All player permissions
    canViewTeams: true,
    canJoinTeam: true,
    canLeaveTeam: true,
    canViewTeamRoster: true,
    canViewMatches: true,
    canViewMatchDetails: true,
    canRespondToMatchInvitation: true,
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canViewOtherProfiles: true,
    canReceiveNotifications: true,

    // Manager-specific permissions
    canCreateTeam: true,
    canEditTeam: true,
    canDeleteTeam: true,
    canInvitePlayers: true,
    canRemovePlayers: true,
    canAssignJersey: true,
    canSetCaptain: true,
    canCreateMatch: true,
    canConfirmVenue: true,
    canRatePlayers: true,
    canValidateScore: true,
    canSendMatchInvitation: true,
    canManageTeamMercato: true,

    // What managers CANNOT do
    canManageVenues: false,
    canSubmitReport: false,
    canRecordGoals: false,
    canRecordCards: false,
    canOverrideScore: false,
  },

  referee: {
    // Basic access
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canReceiveNotifications: true,

    // Referee-specific permissions
    canViewAssignedMatches: true,
    canViewMatchSheet: true,
    canViewMatchDetails: true,
    canSubmitReport: true,
    canRecordGoals: true,
    canRecordCards: true,
    canRecordIncidents: true,
    canOverrideScore: true,
    canStartMatch: true,
    canValidateScore: true,
    canSetAvailability: true,

    // What referees CANNOT do
    canCreateTeam: false,
    canEditTeam: false,
    canInvitePlayers: false,
    canCreateMatch: false,
    canManageVenues: false,
    canRatePlayers: false,
  },

  venue_owner: {
    // Basic access
    canViewOwnProfile: true,
    canEditOwnProfile: true,
    canReceiveNotifications: true,

    // Venue management permissions
    canManageVenues: true,
    canCreateVenue: true,
    canEditVenue: true,
    canDeleteVenue: true,
    canApproveBookings: true,
    canRejectBookings: true,
    canSetVenueAvailability: true,
    canViewBookingHistory: true,
    canViewVenueStats: true,
    canSetVenuePricing: true,

    // What venue owners CANNOT do
    canCreateTeam: false,
    canEditTeam: false,
    canInvitePlayers: false,
    canCreateMatch: false,
    canSubmitReport: false,
    canRatePlayers: false,
  },

  superadmin: {
    all: true,
    // All permissions (superadmin has access to everything)
  }
};

/**
 * Check if a user role has a specific permission
 * @param {string} userRole - The user's role (player, manager, referee, venue_owner, superadmin)
 * @param {string} permission - The permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;

  // Superadmin has all permissions
  if (userRole === 'superadmin') return true;

  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  return rolePermissions[permission] ?? false;
};

/**
 * Get all permissions for a role
 * @param {string} userRole - The user's role
 * @returns {object} - Object with all permissions for the role
 */
export const getRolePermissions = (userRole) => {
  if (!userRole) return {};
  return PERMISSIONS[userRole] || {};
};

/**
 * Check if user can access a specific route/page
 * @param {string} userRole - The user's role
 * @param {string} routePath - The route path to check
 * @returns {boolean} - Whether the user can access the route
 */
export const canAccessRoute = (userRole, routePath) => {
  const routePermissions = {
    // Player routes
    '/dashboard': ['player', 'manager', 'superadmin'],
    '/my-teams': ['player', 'manager', 'superadmin'],
    '/team/:id': ['player', 'manager', 'referee', 'superadmin'],
    '/matches': ['player', 'manager', 'referee', 'superadmin'],
    '/match/:id': ['player', 'manager', 'referee', 'superadmin'],
    '/profile': ['player', 'manager', 'referee', 'venue_owner', 'superadmin'],

    // Manager routes
    '/create-team': ['manager', 'superadmin'],
    '/team/:id/edit': ['manager', 'superadmin'],
    '/team/:id/members': ['manager', 'superadmin'],
    '/team/:id/jersey-assignment': ['manager', 'superadmin'],
    '/team/:id/invite': ['manager', 'superadmin'],
    '/create-match': ['manager', 'superadmin'],
    '/match/:id/rate-players': ['manager', 'superadmin'],
    '/match/:id/validate-score': ['manager', 'superadmin'],

    // Referee routes
    '/referee/dashboard': ['referee', 'superadmin'],
    '/referee/matches': ['referee', 'superadmin'],
    '/referee/match/:id/sheet': ['referee', 'superadmin'],
    '/referee/match/:id/report': ['referee', 'superadmin'],
    '/referee/availability': ['referee', 'superadmin'],

    // Venue owner routes
    '/venue-owner/dashboard': ['venue_owner', 'superadmin'],
    '/venue-owner/venues': ['venue_owner', 'superadmin'],
    '/venue-owner/venue/create': ['venue_owner', 'superadmin'],
    '/venue-owner/venue/:id/edit': ['venue_owner', 'superadmin'],
    '/venue-owner/bookings': ['venue_owner', 'superadmin'],
    '/venue-owner/booking/:id': ['venue_owner', 'superadmin'],

    // Admin routes
    '/admin': ['superadmin'],
    '/admin/users': ['superadmin'],
    '/admin/teams': ['superadmin'],
    '/admin/matches': ['superadmin'],
    '/admin/venues': ['superadmin'],
    '/admin/referees': ['superadmin'],
    '/admin/settings': ['superadmin'],
  };

  // Find matching route (handle dynamic segments)
  const normalizedPath = routePath.replace(/\/\d+/g, '/:id');
  const allowedRoles = routePermissions[normalizedPath];

  if (!allowedRoles) return true; // Default: allow if not defined

  return allowedRoles.includes(userRole) || userRole === 'superadmin';
};

/**
 * Get the dashboard route for a user role
 * @param {string} userRole - The user's role
 * @returns {string} - The dashboard route for the role
 */
export const getDashboardRouteForRole = (userRole) => {
  const dashboardRoutes = {
    'player': '/dashboard',
    'manager': '/dashboard',
    'referee': '/referee/dashboard',
    'venue_owner': '/venue-owner/dashboard',
    'superadmin': '/admin',
  };

  return dashboardRoutes[userRole] || '/dashboard';
};

/**
 * Get navigation items for a user role
 * @param {string} userRole - The user's role
 * @returns {Array} - Array of navigation items
 */
export const getNavItemsForRole = (userRole) => {
  const baseItems = [
    { label: 'Dashboard', path: getDashboardRouteForRole(userRole), icon: 'Home' },
  ];

  const roleSpecificItems = {
    player: [
      { label: 'My Teams', path: '/my-teams', icon: 'Users' },
      { label: 'Matches', path: '/matches', icon: 'Calendar' },
      { label: 'Profile', path: '/profile', icon: 'User' },
    ],
    manager: [
      { label: 'My Teams', path: '/my-teams', icon: 'Users' },
      { label: 'Matches', path: '/matches', icon: 'Calendar' },
      { label: 'Create Match', path: '/create-match', icon: 'PlusCircle' },
      { label: 'Invitations', path: '/invitations', icon: 'Mail' },
      { label: 'Profile', path: '/profile', icon: 'User' },
    ],
    referee: [
      { label: 'My Matches', path: '/referee/matches', icon: 'Calendar' },
      { label: 'Availability', path: '/referee/availability', icon: 'Clock' },
      { label: 'Profile', path: '/profile', icon: 'User' },
    ],
    venue_owner: [
      { label: 'My Venues', path: '/venue-owner/venues', icon: 'MapPin' },
      { label: 'Bookings', path: '/venue-owner/bookings', icon: 'Calendar' },
      { label: 'Stats', path: '/venue-owner/stats', icon: 'BarChart' },
      { label: 'Profile', path: '/profile', icon: 'User' },
    ],
    superadmin: [
      { label: 'Users', path: '/admin/users', icon: 'Users' },
      { label: 'Teams', path: '/admin/teams', icon: 'Shield' },
      { label: 'Matches', path: '/admin/matches', icon: 'Calendar' },
      { label: 'Venues', path: '/admin/venues', icon: 'MapPin' },
      { label: 'Referees', path: '/admin/referees', icon: 'Award' },
      { label: 'Settings', path: '/admin/settings', icon: 'Settings' },
    ],
  };

  return [...baseItems, ...(roleSpecificItems[userRole] || roleSpecificItems.player)];
};

export default {
  PERMISSIONS,
  hasPermission,
  getRolePermissions,
  canAccessRoute,
  getDashboardRouteForRole,
  getNavItemsForRole,
};
