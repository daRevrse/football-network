import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Building, Calendar,
  Edit2, Save, X, AlertCircle, CheckCircle, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VenueOwnerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        address: user.address || ''
      });
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/venue-owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
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
      toast.success('Profil mis à jour avec succès');
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
        <div className="p-2 bg-green-100 rounded-lg">
          <Icon className="w-5 h-5 text-green-600" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mon Profil Propriétaire</h2>
            <p className="text-gray-600">Gérez vos informations personnelles et professionnelles</p>
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
                    company: user.company || '',
                    address: user.address || ''
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
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Réservations Totales"
            value={stats.totalBookings || 0}
            color="bg-blue-500"
          />
          <StatCard
            icon={CheckCircle}
            label="Confirmées"
            value={stats.confirmedBookings || 0}
            color="bg-green-500"
          />
          <StatCard
            icon={DollarSign}
            label="Revenus Totaux"
            value={`${(stats.totalRevenue || 0).toFixed(0)}€`}
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 mb-8">
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

      {/* Business Information */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Informations Professionnelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            icon={Building}
            label="Société / Nom Commercial"
            value={formData.company}
            name="company"
          />
          <InfoField
            icon={MapPin}
            label="Adresse"
            value={formData.address}
            name="address"
          />
        </div>
      </div>

      {/* Account Status */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Compte Vérifié</h4>
            <p className="text-sm text-gray-600">
              Votre compte propriétaire de terrain est actif et vérifié.
            </p>
            <div className="mt-3 flex items-center space-x-4 text-sm">
              <span className="text-gray-500">
                Type: <span className="font-semibold text-gray-900">Propriétaire de Terrain</span>
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
            <h4 className="font-bold text-blue-900 mb-1">Besoin d'aide ?</h4>
            <p className="text-sm text-blue-700 mb-3">
              Pour toute question sur la gestion de vos terrains ou les réservations, contactez notre support.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Contacter le Support
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VenueOwnerProfile;
