import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import {
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VenueOwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // if (user?.user_type !== "venue_owner" && user?.user_type !== "superadmin") {
    //   navigate("/");
    //   return;
    // }
    loadDashboard();
  }, [user, navigate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/venue-owner/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <>
      {/* Welcome Message */}
      <div className="mb-8">
        <p className="text-lg text-gray-700">
          Bienvenue{" "}
          <span className="font-semibold text-green-600">
            {user?.firstName}
          </span>{" "}
          ! Gérez vos terrains et réservations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Calendar}
          label="Réservations Totales"
          value={stats?.totalBookings || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="En Attente"
          value={stats?.pendingBookings || 0}
          color="bg-yellow-500"
          subtitle="Nécessite votre attention"
        />
        <StatCard
          icon={CheckCircle}
          label="Confirmées"
          value={stats?.confirmedBookings || 0}
          color="bg-green-500"
        />
        <StatCard
          icon={DollarSign}
          label="Revenus du Mois"
          value={`${(stats?.monthRevenue || 0).toFixed(0)}€`}
          color="bg-purple-500"
          subtitle={`Total: ${(stats?.totalRevenue || 0).toFixed(0)}€`}
        />
      </div>

      {/* Actions Rapides */}
      {stats?.pendingBookings > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-1">
                  {stats.pendingBookings} réservation
                  {stats.pendingBookings > 1 ? "s" : ""} en attente
                </h3>
                <p className="text-sm text-yellow-700">
                  Des équipes attendent votre confirmation pour réserver un
                  terrain.
                </p>
              </div>
            </div>
            <Link
              to="/venue-owner/bookings?status=pending"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold flex items-center space-x-2"
            >
              <span>Gérer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Mes Terrains */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mes Terrains</h2>
          <Link
            to="venues/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Ajouter un Terrain
          </Link>
        </div>

        {venues.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun terrain enregistré
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par ajouter vos premiers terrains à la plateforme.
            </p>
            <Link
              to="/venues/new"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Ajouter un Terrain
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {venue.city}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      venue.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {venue.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Type:</span>{" "}
                    {venue.field_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Adresse:</span>{" "}
                    {venue.address}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/venue-owner/bookings?venue_id=${venue.id}`}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
                  >
                    Réservations
                  </Link>
                  <Link
                    to={`/venue-owner/venues/${venue.id}/calendar`}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors text-center font-semibold"
                  >
                    Calendrier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/venue-owner/bookings"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Toutes les Réservations
          </h3>
          <p className="text-sm text-gray-600">
            Voir et gérer toutes vos réservations
          </p>
        </Link>

        <Link
          to="/venue-owner/stats"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Statistiques</h3>
          <p className="text-sm text-gray-600">Analysez vos performances</p>
        </Link>

        <Link
          to="/venue-owner/settings"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between mb-4">
            <MapPin className="w-8 h-8 text-green-600" />
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Paramètres Terrains
          </h3>
          <p className="text-sm text-gray-600">Gérez vos horaires et tarifs</p>
        </Link>
      </div>
    </>
  );
};

export default VenueOwnerDashboard;
