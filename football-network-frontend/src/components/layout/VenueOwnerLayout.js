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
  Bell,
  User,
  ChevronRight,
  Plus,
  HelpCircle
} from 'lucide-react';

const VenueOwnerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/venue-owner', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
    { path: '/venue-owner/bookings', icon: Calendar, label: 'Réservations' },
    { path: '/venue-owner/stats', icon: TrendingUp, label: 'Statistiques' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-200 flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {sidebarOpen ? (
            <Link to="/venue-owner" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 text-sm">FootConnect</span>
                <span className="text-emerald-600 font-medium text-xs ml-1">Pro</span>
              </div>
            </Link>
          ) : (
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto">
              <MapPin className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Action */}
        {sidebarOpen && (
          <div className="px-3 py-4">
            <Link
              to="/venue-owner/venues/new"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un terrain</span>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  sidebarOpen ? '' : 'justify-center'
                } ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : ''}`} />
                {sidebarOpen && (
                  <span className={`text-sm ${active ? 'font-medium' : ''}`}>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-100 p-3">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Propriétaire</p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  to="/venue-owner/profile"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Mon profil</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <Link
                to="/venue-owner/profile"
                className="flex items-center justify-center p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                title="Mon profil"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link to="/venue-owner" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">FootConnect</span>
              <span className="text-emerald-600 font-medium text-xs ml-1">Pro</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-4">
          <Link
            to="/venue-owner/venues/new"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un terrain</span>
          </Link>
        </div>

        <nav className="px-3 py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : ''}`} />
                <span className={`text-sm ${active ? 'font-medium' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Espace Pro'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="hidden sm:block h-8 w-px bg-gray-200 mx-2"></div>
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>Retour au site</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VenueOwnerLayout;
