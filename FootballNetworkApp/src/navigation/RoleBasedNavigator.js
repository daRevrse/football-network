/**
 * RoleBasedNavigator - Selects the appropriate navigator based on user role
 * Main entry point for authenticated users
 */

import React from 'react';
import { useSelector } from 'react-redux';

import { PlayerNavigator } from './PlayerNavigator';
import { ManagerNavigator } from './ManagerNavigator';
import { RefereeNavigator } from './RefereeNavigator';
import { VenueOwnerNavigator } from './VenueOwnerNavigator';
import { MainTabNavigator } from './MainTabNavigator'; // Fallback

/**
 * Returns the appropriate navigator component based on user role
 * @param {string} userType - The user's role/type
 * @returns {React.Component} - The navigator component to render
 */
export const getNavigatorForRole = (userType) => {
  switch (userType) {
    case 'player':
      return PlayerNavigator;
    case 'manager':
      return ManagerNavigator;
    case 'referee':
      return RefereeNavigator;
    case 'venue_owner':
      return VenueOwnerNavigator;
    case 'superadmin':
      // Superadmin uses manager navigator with additional features
      // Could create a separate AdminNavigator if needed
      return ManagerNavigator;
    default:
      // Fallback to existing MainTabNavigator for unknown roles
      return MainTabNavigator;
  }
};

/**
 * RoleBasedNavigator Component
 * Automatically selects and renders the appropriate navigator
 * based on the authenticated user's role
 */
export const RoleBasedNavigator = () => {
  const userType = useSelector(state => state.auth?.user?.userType);

  const NavigatorComponent = getNavigatorForRole(userType);

  return <NavigatorComponent />;
};

export default RoleBasedNavigator;
