import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import {
  MapPin,
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
  Plus,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VenueOwnerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/venue-owner/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVenues(response.data.venues);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Bonjour, {user?.firstName}
          </h1>
          <p className="text-gray-500 mt-1">
            Voici un aperçu de l'activité de vos terrains.
          </p>
        </div>
        <Link
          to="/venue-owner/venues/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un terrain</span>
        </Link>
      </div>

      {/* Alert Banner */}
      {stats?.pendingBookings > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900">
                  {stats.pendingBookings} réservation{stats.pendingBookings > 1 ? 's' : ''} en attente
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Des équipes attendent votre confirmation pour réserver.
                </p>
              </div>
            </div>
            <Link
              to="/venue-owner/bookings?status=pending"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Voir les demandes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats?.totalBookings || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Réservations totales</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats?.pendingBookings || 0}</p>
          <p className="text-sm text-gray-500 mt-1">En attente</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats?.confirmedBookings || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Confirmées</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Euro className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{(stats?.monthRevenue || 0).toFixed(0)}€</p>
          <p className="text-sm text-gray-500 mt-1">Ce mois-ci</p>
          <p className="text-xs text-gray-400 mt-0.5">Total: {(stats?.totalRevenue || 0).toFixed(0)}€</p>
        </div>
      </div>

      {/* Venues Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mes terrains</h2>
          {venues.length > 3 && (
            <Link
              to="/venue-owner/venues"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
            >
              Voir tous
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {venues.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 border-dashed p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Aucun terrain</h3>
            <p className="text-sm text-gray-500 mb-4">
              Commencez par ajouter votre premier terrain.
            </p>
            <Link
              to="/venue-owner/venues/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un terrain</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{venue.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{venue.city}</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    venue.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {venue.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <span className="inline-flex items-center px-2 py-1 bg-gray-50 rounded-md">
                    {venue.fieldType === 'indoor' ? 'Indoor' : 'Outdoor'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <Link
                    to={`/venue-owner/venues/${venue.id}/bookings`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Réservations</span>
                  </Link>
                  <Link
                    to={`/venue-owner/venues/${venue.id}/calendar`}
                    className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Voir le calendrier"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/venue-owner/stats"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Statistiques</h3>
              <p className="text-sm text-gray-500 mt-1">
                Analysez les performances de vos terrains
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/venue-owner/bookings"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Toutes les réservations</h3>
              <p className="text-sm text-gray-500 mt-1">
                Gérez l'ensemble de vos réservations
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default VenueOwnerDashboard;
