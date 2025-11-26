import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import {
  User, Mail, Phone, Shield, Activity,
  Edit2, Save, X, AlertCircle, CheckCircle, Users,
  MapPin, Flag
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    loadSystemStats();
  }, [user]);

  const loadSystemStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSystemStats(response.data);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/users/profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      updateUser(response.data.user);
      toast.success('Profil administrateur mis à jour');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const InfoField = ({ icon: Icon, label, value, name, type = 'text', editable = true }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Icon className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-600 block mb-1">
            {label}
          </label>
          {editing && editable ? (
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900 font-medium">{value || 'Non renseigné'}</p>
          )}
        </div>
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-2">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil Administrateur</h2>
            <p className="text-gray-600">Gérez votre profil et consultez les statistiques système</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || ''
                  });
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                <X className="w-4 h-4" />
                <span>Annuler</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Utilisateurs Totaux"
            value={systemStats.totalUsers || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={Shield}
            label="Équipes Actives"
            value={systemStats.totalTeams || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={MapPin}
            label="Terrains"
            value={systemStats.totalVenues || 0}
            color="bg-purple-500"
          />
          <StatCard
            icon={Flag}
            label="Matchs ce Mois"
            value={systemStats.matchesThisMonth || 0}
            color="bg-orange-500"
          />
        </div>
      )}

      {/* Admin Badge */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-white bg-opacity-20 rounded-full">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Super Administrateur</h3>
            <p className="text-purple-100">
              Accès complet à toutes les fonctionnalités de la plateforme
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Informations Personnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            icon={User}
            label="Prénom"
            value={formData.firstName}
            name="firstName"
          />
          <InfoField
            icon={User}
            label="Nom"
            value={formData.lastName}
            name="lastName"
          />
          <InfoField
            icon={Mail}
            label="Email"
            value={formData.email}
            name="email"
            type="email"
            editable={false}
          />
          <InfoField
            icon={Phone}
            label="Téléphone"
            value={formData.phone}
            name="phone"
            type="tel"
          />
        </div>
      </div>

      {/* Admin Permissions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span>Permissions Administrateur</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Gestion des utilisateurs</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Gestion des équipes</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Gestion des matchs</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Gestion des terrains</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Gestion des arbitres</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Rapports et statistiques</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Sanctions et bannissements</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Logs système</span>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Informations du Compte</h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-500">
                  Type de compte: <span className="font-semibold text-gray-900">Super Administrateur</span>
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-500">
                  Membre depuis: <span className="font-semibold text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-500">
                  ID: <span className="font-mono text-xs text-gray-900">{user?.id}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 mb-1">Sécurité</h4>
            <p className="text-sm text-amber-700 mb-3">
              En tant qu'administrateur, vous avez accès à des données sensibles. Assurez-vous de maintenir
              la confidentialité de vos identifiants et de suivre les bonnes pratiques de sécurité.
            </p>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors font-semibold">
                Changer le Mot de Passe
              </button>
              <button className="px-4 py-2 bg-white text-amber-900 text-sm rounded-lg hover:bg-amber-100 transition-colors font-semibold border border-amber-300">
                Activer 2FA
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProfile;
