import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  Flag,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  MapPin,
  Award,
  Calendar,
  TrendingUp,
  Bell
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
    { path: '/admin/teams', icon: Shield, label: 'Équipes' },
    { path: '/admin/matches', icon: Calendar, label: 'Matchs' },
    { path: '/admin/venues', icon: MapPin, label: 'Terrains' },
    { path: '/admin/referees', icon: Award, label: 'Arbitres' },
    { path: '/admin/reports', icon: Flag, label: 'Signalements' },
    { path: '/admin/bans', icon: AlertTriangle, label: 'Bannissements' },
    { path: '/admin/logs', icon: FileText, label: 'Logs' },
    { path: '/admin/stats', icon: TrendingUp, label: 'Statistiques' },
    { path: '/admin/settings', icon: Settings, label: 'Paramètres' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-white text-lg">Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${
                  sidebarOpen ? 'px-4 justify-start' : 'px-0 justify-center'
                } py-3 mb-1 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-700 p-4">
          <div className={`flex items-center ${sidebarOpen ? 'mb-3' : 'justify-center mb-2'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'
            } py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors`}
          >
            <LogOut className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : ''}`} />
            {sidebarOpen && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-white">
              {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Administration'}
            </h1>
            <p className="text-sm text-gray-400">
              Football Network - Panel d'administration
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
            >
              Retour au site
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
