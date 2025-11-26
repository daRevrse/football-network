import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  Edit2, Save, X, AlertCircle, CheckCircle, Flag,
  Award, TrendingUp, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RefereeProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    licenseNumber: '',
    experience: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        licenseNumber: user.licenseNumber || '',
        experience: user.experience || ''
      });
    }
    loadRefereeStats();
  }, [user]);

  const loadRefereeStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/referees/my-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error loading referee stats:', error);
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
      toast.success('Profil arbitre mis à jour');
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
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil Arbitre</h2>
            <p className="text-gray-600">Gérez vos informations et consultez vos statistiques</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
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
                    phone: user.phone || '',
                    city: user.city || '',
                    licenseNumber: user.licenseNumber || '',
                    experience: user.experience || ''
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
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Referee Badge */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-white bg-opacity-20 rounded-full">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Arbitre Officiel</h3>
            <p className="text-blue-100">
              Membre de la plateforme Football Network
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Flag}
            label="Matchs Arbitrés"
            value={stats.totalMatches || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={CheckCircle}
            label="Matchs Terminés"
            value={stats.completedMatches || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={Award}
            label="Note Moyenne"
            value={stats.averageRating ? `${stats.averageRating}/5` : 'N/A'}
            color="bg-yellow-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Ce Mois"
            value={stats.matchesThisMonth || 0}
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
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
          <InfoField
            icon={MapPin}
            label="Ville"
            value={formData.city}
            name="city"
          />
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Informations Professionnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            icon={FileText}
            label="Numéro de Licence"
            value={formData.licenseNumber}
            name="licenseNumber"
          />
          <InfoField
            icon={Calendar}
            label="Années d'Expérience"
            value={formData.experience}
            name="experience"
          />
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-600" />
          <span>Certifications</span>
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Arbitre Régional</p>
              <p className="text-xs text-gray-600">Certifié pour les matchs de niveau régional</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Formation Continue</p>
              <p className="text-xs text-gray-600">Participation aux formations annuelles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Compte Vérifié</h4>
            <p className="text-sm text-gray-600 mb-3">
              Votre compte arbitre est actif et vérifié sur la plateforme.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">
                Type: <span className="font-semibold text-gray-900">Arbitre</span>
              </span>
              <span className="text-gray-500">
                Membre depuis: <span className="font-semibold text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Questions ou Problèmes ?</h4>
            <p className="text-sm text-blue-700 mb-3">
              Pour toute question concernant vos matchs, vos évaluations ou la plateforme, contactez notre support.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Contacter le Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefereeProfile;
