import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  DollarSign,
  Bell,
  User
} from 'lucide-react';

const VenueOwnerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/venue-owner', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/venue-owner/bookings', icon: Calendar, label: 'Réservations' },
    { path: '/venue-owner/venues', icon: MapPin, label: 'Mes Terrains' },
    { path: '/venue-owner/calendar', icon: Clock, label: 'Calendrier' },
    { path: '/venue-owner/stats', icon: TrendingUp, label: 'Statistiques' },
    { path: '/venue-owner/revenue', icon: DollarSign, label: 'Revenus' },
    { path: '/venue-owner/settings', icon: Settings, label: 'Paramètres' },
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
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-blue-600">
          {sidebarOpen && (
            <Link to="/venue-owner" className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-white" />
              <span className="font-bold text-white text-lg">Mes Terrains</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 text-white transition-colors"
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
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
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
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className={`flex items-center ${sidebarOpen ? 'mb-3' : 'justify-center mb-2'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">Propriétaire</p>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Link
              to="/venue-owner/profile"
              className={`w-full flex items-center ${
                sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'
              } py-2 text-sm text-gray-700 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors`}
            >
              <User className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : ''}`} />
              {sidebarOpen && 'Mon Profil'}
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${
                sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'
              } py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors`}
            >
              <LogOut className={`w-4 h-4 ${sidebarOpen ? 'mr-2' : ''}`} />
              {sidebarOpen && 'Déconnexion'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Espace Propriétaire'}
            </h1>
            <p className="text-sm text-gray-500">
              Gérez vos terrains et réservations
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Retour au site
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-green-50 to-blue-50 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VenueOwnerLayout;
