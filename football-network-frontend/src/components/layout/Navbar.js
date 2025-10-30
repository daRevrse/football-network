// football-network-frontend/src/components/layout/Navbar.js - VERSION AVEC NOTIFICATIONS
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  UserPlus,
  Wifi,
  WifiOff,
  Hash,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationCenter from "../notifications/NotificationCenter";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingPlayerInvitations, setPendingPlayerInvitations] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Hook pour les notifications temps réel
  const { unreadCount, isConnected } = useNotifications();

  // Fermer le dropdown utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUserDropdown &&
        !event.target.closest(".user-dropdown-container")
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown]);

  // Charger le nombre d'invitations en attente (backup)
  useEffect(() => {
    if (user) {
      loadPendingInvitations();

      // Écouter les mises à jour d'invitations
      const handleInvitationsUpdate = () => {
        loadPendingInvitations();
      };

      window.addEventListener("invitations_updated", handleInvitationsUpdate);

      // Actualiser toutes les 60 secondes (moins fréquent car on a les notifications temps réel)
      const interval = setInterval(loadPendingInvitations, 60000);

      return () => {
        window.removeEventListener(
          "invitations_updated",
          handleInvitationsUpdate
        );
        clearInterval(interval);
      };
    }
  }, [user]);

  const loadPendingInvitations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/player-invitations?status=pending&limit=50`
      );
      const pendingCount = response.data.filter(
        (inv) => inv.status === "pending"
      ).length;
      setPendingPlayerInvitations(pendingCount);
    } catch (error) {
      console.error("Error loading pending invitations:", error);
      setPendingPlayerInvitations(0);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setShowNotifications(false);
    setShowUserDropdown(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: "/dashboard",
      icon: Home,
      label: "Dashboard",
    },
    {
      path: "/teams",
      icon: Users,
      label: "Équipes",
    },
    {
      path: "/feed",
      icon: Hash,
      label: "Le Terrain",
    },
    {
      path: "/invitations",
      icon: MessageSquare,
      label: "Invitations matchs",
    },
    {
      path: "/player-invitations",
      icon: UserPlus,
      label: "Invitations équipes",
      badge: pendingPlayerInvitations > 0 ? pendingPlayerInvitations : null,
    },
  ];

  return (
    <>
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                FootballNetwork
              </span>
            </Link>

            {/* Navigation Desktop */}
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-colors relative min-w-[80px] ${
                        isActive(item.path)
                          ? "text-green-600 bg-green-50"
                          : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-center leading-tight">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Bouton notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`flex flex-col items-center justify-center px-4 py-2 rounded-md text-xs font-medium transition-colors relative min-w-[80px] ${
                      showNotifications
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Bell className="h-5 w-5 mb-1" />
                    <span className="text-center leading-tight hidden lg:inline">
                      Notifications
                    </span>

                    {/* Badge notifications */}
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}

                    {/* Indicateur de connexion */}
                    <div className="absolute bottom-1 right-1">
                      {isConnected ? (
                        <Wifi className="h-3 w-3 text-green-500" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Menu utilisateur dropdown */}
                <div className="relative ml-4 pl-4 border-l border-gray-200 user-dropdown-container">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      showUserDropdown
                        ? "bg-green-50 ring-2 ring-green-500 ring-opacity-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {user.firstName?.charAt(0).toUpperCase()}
                      {user.lastName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden xl:block text-left">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Mon compte</p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 hidden xl:block ${
                        showUserDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {showUserDropdown && (
                    <>
                      {/* Overlay pour fermer en cliquant à l'extérieur */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserDropdown(false)}
                      ></div>

                      <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Header du dropdown */}
                        <div className="px-5 py-4 bg-gradient-to-br from-green-50 to-blue-50 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-white">
                              {user.firstName?.charAt(0).toUpperCase()}
                              {user.lastName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-base font-bold text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-2">
                          <Link
                            to="/profile"
                            onClick={() => setShowUserDropdown(false)}
                            className={`flex items-center space-x-3 px-5 py-3 text-sm transition-all duration-150 group ${
                              isActive("/profile")
                                ? "text-green-600 bg-green-50 border-l-4 border-green-600"
                                : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-green-400"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                isActive("/profile")
                                  ? "bg-green-100"
                                  : "bg-gray-100 group-hover:bg-green-100"
                              }`}
                            >
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Mon Profil</p>
                              <p className="text-xs text-gray-500">
                                Gérer mes informations
                              </p>
                            </div>
                          </Link>
                        </div>

                        {/* Footer avec déconnexion */}
                        <div className="border-t border-gray-100 bg-gray-50 p-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 group"
                          >
                            <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100">
                              <LogOut className="h-4 w-4" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium">Déconnexion</p>
                              <p className="text-xs text-red-500">
                                Quitter mon compte
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Mobile - Bouton Menu */}
            {user && (
              <div className="md:hidden flex items-center space-x-2">
                {/* Notifications mobile */}
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Menu hamburger */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors relative"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                  {pendingPlayerInvitations > 0 && !isMenuOpen && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingPlayerInvitations > 9
                        ? "9+"
                        : pendingPlayerInvitations}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Liens de connexion pour les non-connectés */}
            {!user && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Menu Mobile */}
          {user && isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
                {/* Statut de connexion */}
                <div className="px-3 py-2 flex items-center space-x-2 text-sm text-gray-600">
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Notifications actives</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Notifications déconnectées</span>
                    </>
                  )}
                </div>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors relative ${
                        isActive(item.path)
                          ? "text-green-600 bg-green-50"
                          : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive("/profile")
                        ? "text-green-600 bg-green-50"
                        : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>Mon Profil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md text-base font-medium transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Centre de notifications */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Navbar;
