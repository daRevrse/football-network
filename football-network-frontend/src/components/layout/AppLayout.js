import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useUserProfile } from "../../contexts/UserContext";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationCenter from "../notifications/NotificationCenter";
import { LogOut, Menu, Bell, User, X, ChevronDown, Home, ShieldCheck, FileText, Calendar, Hash, Shield, Trophy, MessageSquare, UserPlus, MapPin, Award, Users, Search, CheckCircle } from "lucide-react";

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { profilePictureUrl } = useUserProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({
    playerInvites: 0,
    matchInvites: 0,
    validations: 0,
    participations: 0
  });

  const { unreadCount, isConnected } = useNotifications();

  const isManager = user?.userType === "manager";
  const isPlayer = user?.userType === "player";
  const isReferee = user?.userType === "referee";

  // Load pending counts for badges
  useEffect(() => {
    const loadPendingCounts = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        if (isReferee) return;

        if (isReferee) return;

        setPendingCounts({
          playerInvites: 0,
          matchInvites: 0,
          validations: 0,
          participations: 0
        });
      } catch (error) {
        console.error("Error loading pending counts:", error);
      }
    };

    loadPendingCounts();
    const interval = setInterval(loadPendingCounts, 60000);
    return () => clearInterval(interval);
  }, [user, isReferee]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  // Navigation items based on role
  const getNavItems = () => {
    const items = [
      { path: "/dashboard", icon: Home, label: "Tableau de bord" }
    ];

    if (isReferee) {
      items.push(
        { path: "/referee/matches", icon: ShieldCheck, label: "Mes matchs" },
        { path: "/referee/reports", icon: FileText, label: "Rapports" },
        { path: "/calendar", icon: Calendar, label: "Calendrier" },
        { path: "/feed", icon: Hash, label: "Le Terrain" }
      );
    } else if (isManager) {
      items.push(
        { path: "/teams", icon: Shield, label: "Mes équipes" },
        { path: "/matches", icon: Trophy, label: "Matchs" },
        { path: "/invitations", icon: MessageSquare, label: "Invitations", badge: pendingCounts.matchInvites },
        { path: "/recruitment", icon: UserPlus, label: "Recrutement" },
        { path: "/venues", icon: MapPin, label: "Terrains" },
        { path: "/referees", icon: Award, label: "Arbitres" },
        { path: "/calendar", icon: Calendar, label: "Calendrier" },
        { path: "/feed", icon: Hash, label: "Le Terrain" }
      );
    } else {
      // Player
      items.push(
        { path: "/teams", icon: Users, label: "Mes équipes" },
        { path: "/teams/search", icon: Search, label: "Trouver équipe" },
        { path: "/player-invitations", icon: UserPlus, label: "Invitations", badge: pendingCounts.playerInvites },
        { path: "/participations", icon: CheckCircle, label: "Participations", badge: pendingCounts.participations },
        { path: "/venues", icon: MapPin, label: "Terrains" },
        { path: "/calendar", icon: Calendar, label: "Calendrier" },
        { path: "/feed", icon: Hash, label: "Le Terrain" }
      );
    }

    return items;
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    if (isManager) return "Manager";
    if (isReferee) return "Arbitre";
    return "Joueur";
  };

  const getRoleColor = () => {
    if (isManager) return "bg-blue-50 text-blue-700";
    if (isReferee) return "bg-purple-50 text-purple-700";
    return "bg-emerald-50 text-emerald-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900">FootConnect</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">FootConnect</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Card */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-600 text-white font-semibold">
                    {user?.firstName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${getRoleColor()}`}>
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-emerald-600" : "text-gray-400"}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 space-y-1">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive("/profile")
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <User className={`w-5 h-5 ${isActive("/profile") ? "text-emerald-600" : "text-gray-400"}`} />
              <span>Mon profil</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
              {isReferee ? "Espace Arbitre" : isManager ? "Espace Manager" : "Espace Joueur"}
            </h1>
            
            {/* Global Search Component */}
            <div className="hidden xl:block max-w-md w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher des joueurs, équipes, matchs..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1">
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">Ctrl</kbd>
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-lg transition-colors ${
                  showNotifications
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span
                  className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white ${
                    isConnected ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </button>
            </div>

            {/* User Menu */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-600 text-white font-semibold text-sm">
                      {user?.firstName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-medium text-gray-900">{user?.firstName}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Mon profil
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 pt-20 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default AppLayout;
