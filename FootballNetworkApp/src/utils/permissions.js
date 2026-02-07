/**
 * Centralized Permissions Management for Football Network
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
    // All permissions
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
    canViewAssignedMatches: true,
    canViewMatchSheet: true,
    canSubmitReport: true,
    canRecordGoals: true,
    canRecordCards: true,
    canRecordIncidents: true,
    canOverrideScore: true,
    canStartMatch: true,
    canSetAvailability: true,
    // Admin-only
    canManageUsers: true,
    canSuspendUsers: true,
    canModifyUserRoles: true,
    canViewAllData: true,
    canAccessAdminDashboard: true,
    canResolveDisputes: true,
    canValidateReferees: true,
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
 * Check if user can access a specific screen
 * @param {string} userRole - The user's role
 * @param {string} screenName - The screen name to check
 * @returns {boolean} - Whether the user can access the screen
 */
export const canAccessScreen = (userRole, screenName) => {
  const screenPermissions = {
    // Player screens
    'PlayerHome': ['player', 'manager', 'superadmin'],
    'MyTeams': ['player', 'manager', 'superadmin'],
    'TeamDetail': ['player', 'manager', 'referee', 'superadmin'],
    'Matches': ['player', 'manager', 'referee', 'superadmin'],
    'MatchDetail': ['player', 'manager', 'referee', 'superadmin'],
    'Profile': ['player', 'manager', 'referee', 'venue_owner', 'superadmin'],
    'EditProfile': ['player', 'manager', 'referee', 'venue_owner', 'superadmin'],
    'Notifications': ['player', 'manager', 'referee', 'venue_owner', 'superadmin'],

    // Manager screens
    'ManagerHome': ['manager', 'superadmin'],
    'CreateTeam': ['manager', 'superadmin'],
    'EditTeam': ['manager', 'superadmin'],
    'TeamMembers': ['manager', 'superadmin'],
    'JerseyAssignment': ['manager', 'superadmin'],
    'InvitePlayers': ['manager', 'superadmin'],
    'CreateMatch': ['manager', 'superadmin'],
    'VenueConfirm': ['manager', 'superadmin'],
    'PlayerRating': ['manager', 'superadmin'],
    'ScoreValidation': ['manager', 'superadmin'],

    // Referee screens
    'RefereeHome': ['referee', 'superadmin'],
    'AssignedMatches': ['referee', 'superadmin'],
    'MatchSheet': ['referee', 'superadmin'],
    'MatchReport': ['referee', 'superadmin'],
    'RecordGoal': ['referee', 'superadmin'],
    'RecordCard': ['referee', 'superadmin'],
    'SubmitReport': ['referee', 'superadmin'],
    'Availability': ['referee', 'superadmin'],
    'RefereeProfile': ['referee', 'superadmin'],

    // Venue owner screens
    'VenueOwnerHome': ['venue_owner', 'superadmin'],
    'MyVenues': ['venue_owner', 'superadmin'],
    'CreateVenue': ['venue_owner', 'superadmin'],
    'EditVenue': ['venue_owner', 'superadmin'],
    'VenueAvailability': ['venue_owner', 'superadmin'],
    'BookingRequests': ['venue_owner', 'superadmin'],
    'BookingDetail': ['venue_owner', 'superadmin'],
    'BookingHistory': ['venue_owner', 'superadmin'],

    // Admin screens
    'AdminDashboard': ['superadmin'],
    'UsersManagement': ['superadmin'],
    'TeamsManagement': ['superadmin'],
    'MatchesManagement': ['superadmin'],
    'VenuesManagement': ['superadmin'],
    'RefereesManagement': ['superadmin'],
    'ReportsManagement': ['superadmin'],
    'Settings': ['superadmin'],
  };

  const allowedRoles = screenPermissions[screenName];
  if (!allowedRoles) return true; // Default: allow if not defined

  return allowedRoles.includes(userRole) || userRole === 'superadmin';
};

/**
 * Get the home screen for a user role
 * @param {string} userRole - The user's role
 * @returns {string} - The home screen name for the role
 */
export const getHomeScreenForRole = (userRole) => {
  const homeScreens = {
    'player': 'PlayerHome',
    'manager': 'ManagerHome',
    'referee': 'RefereeHome',
    'venue_owner': 'VenueOwnerHome',
    'superadmin': 'AdminDashboard',
  };

  return homeScreens[userRole] || 'PlayerHome';
};

/**
 * Get the tab configuration for a user role
 * @param {string} userRole - The user's role
 * @returns {Array} - Array of tab configurations
 */
export const getTabsForRole = (userRole) => {
  const tabs = {
    player: [
      { name: 'Home', icon: 'home', screen: 'PlayerHome' },
      { name: 'Teams', icon: 'users', screen: 'MyTeams' },
      { name: 'Matches', icon: 'calendar', screen: 'Matches' },
      { name: 'Profile', icon: 'user', screen: 'Profile' },
    ],
    manager: [
      { name: 'Home', icon: 'home', screen: 'ManagerHome' },
      { name: 'Teams', icon: 'users', screen: 'MyTeams' },
      { name: 'Matches', icon: 'calendar', screen: 'Matches' },
      { name: 'Create', icon: 'plus-circle', screen: 'Create' },
      { name: 'Profile', icon: 'user', screen: 'Profile' },
    ],
    referee: [
      { name: 'Home', icon: 'home', screen: 'RefereeHome' },
      { name: 'Matches', icon: 'calendar', screen: 'AssignedMatches' },
      { name: 'Reports', icon: 'file-text', screen: 'Reports' },
      { name: 'Profile', icon: 'user', screen: 'RefereeProfile' },
    ],
    venue_owner: [
      { name: 'Home', icon: 'home', screen: 'VenueOwnerHome' },
      { name: 'Venues', icon: 'map-pin', screen: 'MyVenues' },
      { name: 'Bookings', icon: 'calendar', screen: 'BookingRequests' },
      { name: 'Profile', icon: 'user', screen: 'Profile' },
    ],
    superadmin: [
      { name: 'Dashboard', icon: 'layout', screen: 'AdminDashboard' },
      { name: 'Users', icon: 'users', screen: 'UsersManagement' },
      { name: 'Teams', icon: 'shield', screen: 'TeamsManagement' },
      { name: 'Settings', icon: 'settings', screen: 'Settings' },
    ],
  };

  return tabs[userRole] || tabs.player;
};

export default {
  PERMISSIONS,
  hasPermission,
  getRolePermissions,
  canAccessScreen,
  getHomeScreenForRole,
  getTabsForRole,
};
