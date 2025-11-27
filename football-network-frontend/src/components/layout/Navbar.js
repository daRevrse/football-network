// football-network-frontend/src/components/layout/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  MessageSquare,
  User,
  LogOut,
  Bell,
  UserPlus,
  Hash,
  Menu,
  X,
  Settings,
  Search,
  Shield,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationCenter from "../notifications/NotificationCenter";
import axios from "axios";
import { useUserProfile } from "../../contexts/UserContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { profilePictureUrl } = useUserProfile();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingPlayerInvitations, setPendingPlayerInvitations] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const { unreadCount, isConnected } = useNotifications();

  const hideNavbarRoutes = ["/login", "/signup"];
  const isHidden = hideNavbarRoutes.includes(location.pathname);

  const isManager = user?.user_type === "manager";

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

  useEffect(() => {
    if (user && !isHidden) {
      loadPendingInvitations();
      const handleInvitationsUpdate = () => loadPendingInvitations();
      window.addEventListener("invitations_updated", handleInvitationsUpdate);
      const interval = setInterval(loadPendingInvitations, 60000);
      return () => {
        window.removeEventListener(
          "invitations_updated",
          handleInvitationsUpdate
        );
        clearInterval(interval);
      };
    }
  }, [user, isHidden]);

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
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setShowNotifications(false);
    setShowUserDropdown(false);
  };

  const isActive = (path) => location.pathname === path;

  // Configuration dynamique du menu selon le rôle
  const getNavItems = () => {
    const items = [
      { path: "/dashboard", icon: Home, label: "Dashboard" },
      {
        path: "/teams",
        icon: Shield,
        label: isManager ? "Gestion" : "Mes Équipes",
      },
      { path: "/feed", icon: Hash, label: "Le Terrain" },
      { path: "/invitations", icon: MessageSquare, label: "Matchs" },
    ];

    if (isManager) {
      // MODIFICATION ICI : Redirection vers la nouvelle page de recrutement
      items.push({
        path: "/recruitment",
        icon: Search,
        label: "Recruter",
      });
    } else {
      // Pour le Joueur : Lien pour voir ses invitations
      items.push({
        path: "/player-invitations",
        icon: UserPlus,
        label: "Invitations",
        badge: pendingPlayerInvitations > 0 ? pendingPlayerInvitations : null,
      });
    }

    return items;
  };

  const navItems = getNavItems();

  if (isHidden) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-md group-hover:bg-green-700 transition-colors">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-green-700 transition-colors">
                FootballNetwork
              </span>
            </Link>

            {/* Navigation Desktop */}
            {user && (
              <div className="hidden lg:flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 relative min-w-[70px] group ${
                        isActive(item.path)
                          ? "text-green-700 bg-green-50"
                          : "text-gray-500 hover:text-green-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 mb-1 transition-transform group-hover:scale-110 ${
                          isActive(item.path) ? "fill-current" : ""
                        }`}
                      />
                      <span className="text-center leading-tight">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="w-px h-8 bg-gray-200 mx-2"></div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-full transition-all duration-200 relative ${
                      showNotifications
                        ? "bg-green-100 text-green-700"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    <div
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                  </button>
                </div>

                {/* User Menu */}
                <div className="relative ml-2 user-dropdown-container">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 ring-2 ring-white shadow-sm">
                      {profilePictureUrl ? (
                        <img
                          src={profilePictureUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 text-white font-bold text-xs">
                          {user?.firstName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="hidden xl:block text-left mr-2">
                      <p className="text-sm font-bold text-gray-700 leading-none">
                        {user.firstName}
                      </p>
                    </div>
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" /> Mon Profil
                      </Link>

                      {user?.userType === "superadmin" && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors font-semibold"
                        >
                          <Settings className="w-4 h-4 mr-3" /> Panel Admin
                        </Link>
                      )}

                      {/* Lien spécifique Manager dans le dropdown aussi */}
                      {isManager && (
                        <Link
                          to="/player-invitations" // Les managers peuvent aussi recevoir des invites
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <Bell className="w-4 h-4 mr-3" /> Invitations reçues
                          {pendingPlayerInvitations > 0 && (
                            <span className="ml-auto bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                              {pendingPlayerInvitations}
                            </span>
                          )}
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" /> Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            {user && (
              <div className="flex items-center lg:hidden space-x-4">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-gray-600"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  )}
                </button>

                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-600 focus:outline-none"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            )}

            {/* Auth Links */}
            {!user && (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && user && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full z-50">
            <div className="px-4 py-4 space-y-1">
              <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.first_name[0]
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-green-600 font-medium">En ligne</p>
                </div>
              </div>

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    isActive(item.path)
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}

              <div className="border-t border-gray-100 my-2 pt-2">
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <User className="w-5 h-5" /> <span>Mon Profil</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" /> <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Navbar;
