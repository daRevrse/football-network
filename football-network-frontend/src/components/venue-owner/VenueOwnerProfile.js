import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Building2, Calendar,
  Edit2, Save, X, CheckCircle, Euro, Loader2, HelpCircle
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
        { headers: { Authorization: `Bearer ${token}` } }
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

  const cancelEdit = () => {
    setEditing(false);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      company: user.company || '',
      address: user.address || ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mon profil</h1>
          <p className="text-gray-500 mt-1">Gérez vos informations personnelles et professionnelles</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Réservations totales</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.confirmedBookings || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Confirmées</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-violet-50 rounded-lg">
                <Euro className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{(stats.totalRevenue || 0).toFixed(0)}€</p>
            <p className="text-sm text-gray-500 mt-1">Revenus totaux</p>
          </div>
        </div>
      )}

      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-medium text-gray-900 mb-4">Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Prénom</label>
            {editing ? (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{formData.firstName || 'Non renseigné'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Nom</label>
            {editing ? (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{formData.lastName || 'Non renseigné'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Email</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">{formData.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Téléphone</label>
            {editing ? (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  placeholder="06 12 34 56 78"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{formData.phone || 'Non renseigné'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-medium text-gray-900 mb-4">Informations professionnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Société / Nom commercial</label>
            {editing ? (
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  placeholder="Ma Société SARL"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{formData.company || 'Non renseigné'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Adresse</label>
            {editing ? (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  placeholder="123 rue de l'Exemple, 75001 Paris"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{formData.address || 'Non renseigné'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Compte vérifié</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Votre compte propriétaire de terrain est actif et vérifié.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-gray-500">
              <span>
                Type: <span className="font-medium text-gray-900">Propriétaire de terrain</span>
              </span>
              <span>
                Membre depuis: <span className="font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-lg border border-gray-200">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Besoin d'aide ?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Pour toute question sur la gestion de vos terrains ou les réservations, contactez notre support.
            </p>
            <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors">
              Contacter le support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerProfile;
