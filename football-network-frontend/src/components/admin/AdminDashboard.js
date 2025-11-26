import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Shield, MapPin, Award, FileText, AlertCircle,
  TrendingUp, Activity, Calendar, Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from './AdminLayout';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Vérifier que l'utilisateur est superadmin
    if (!user || user.userType !== 'superadmin') {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers || []);
      setRecentReports(response.data.recentReports || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Utilisateurs',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-500',
      subtitle: `${stats?.total_players || 0} joueurs, ${stats?.total_managers || 0} managers`
    },
    {
      title: 'Équipes Actives',
      value: stats?.total_teams || 0,
      icon: Shield,
      color: 'bg-green-500'
    },
    {
      title: 'Matchs Totaux',
      value: stats?.total_matches || 0,
      icon: Activity,
      color: 'bg-purple-500',
      subtitle: `${stats?.confirmed_matches || 0} confirmés`
    },
    {
      title: 'Terrains',
      value: stats?.total_venues || 0,
      icon: MapPin,
      color: 'bg-orange-500'
    },
    {
      title: 'Arbitres',
      value: stats?.total_referees || 0,
      icon: Award,
      color: 'bg-indigo-500'
    },
    {
      title: 'Signalements Ouverts',
      value: stats?.open_reports || 0,
      icon: AlertCircle,
      color: 'bg-red-500'
    },
    {
      title: 'Bannissements Actifs',
      value: stats?.active_bans || 0,
      icon: FileText,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <AdminLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-gray-400">
                {stat.title}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">
                  {stat.subtitle}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Actions Rapides
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 border-2 border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-700 transition-colors"
            >
              <Users className="w-6 h-6 text-blue-400 mb-2" />
              <p className="font-semibold text-white">Gérer Utilisateurs</p>
            </button>
            <button
              onClick={() => navigate('/admin/reports')}
              className="p-4 border-2 border-gray-700 rounded-lg hover:border-red-500 hover:bg-gray-700 transition-colors"
            >
              <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
              <p className="font-semibold text-white">Signalements</p>
            </button>
            <button
              onClick={() => navigate('/admin/logs')}
              className="p-4 border-2 border-gray-700 rounded-lg hover:border-purple-500 hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-6 h-6 text-purple-400 mb-2" />
              <p className="font-semibold text-white">Logs Système</p>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-4 border-2 border-gray-700 rounded-lg hover:border-green-500 hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-6 h-6 text-green-400 mb-2" />
              <p className="font-semibold text-white">Paramètres</p>
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Statistiques
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Taux de confirmation matchs</span>
              <span className="font-semibold text-white">
                {stats?.total_matches > 0
                  ? Math.round((stats.confirmed_matches / stats.total_matches) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Ratio Joueurs/Managers</span>
              <span className="font-semibold text-white">
                {stats?.total_managers > 0
                  ? Math.round((stats.total_players / stats.total_managers) * 10) / 10
                  : stats?.total_players || 0}:1
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Moyenne équipes/utilisateur</span>
              <span className="font-semibold text-white">
                {stats?.total_users > 0
                  ? Math.round((stats.total_teams / stats.total_users) * 10) / 10
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Utilisateurs Récents
          </h2>
          <div className="space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <p className="font-semibold text-white">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      user.user_type === 'player' ? 'bg-blue-900 text-blue-300' :
                      user.user_type === 'manager' ? 'bg-green-900 text-green-300' :
                      'bg-purple-900 text-purple-300'
                    }`}>
                      {user.user_type}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun utilisateur récent</p>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Signalements Récents
          </h2>
          <div className="space-y-3">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div key={report.id} className="py-2 border-b border-gray-700 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-white">{report.reason}</p>
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-orange-900 text-orange-300">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Par: {report.reporter_first_name} {report.reporter_last_name}
                  </p>
                  {report.reported_first_name && (
                    <p className="text-sm text-gray-400">
                      Concernant: {report.reported_first_name} {report.reported_last_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(report.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun signalement récent</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
