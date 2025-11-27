import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  AlertCircle,
  DollarSign,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const BookingManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";

      const response = await axios.get(
        `${API_BASE_URL}/venue-owner/bookings${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBookings(response.data.bookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (bookingId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/venue-owner/bookings/${bookingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedBooking(response.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error loading booking details:", error);
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const handleRespond = async (action, message = "") => {
    if (!selectedBooking) return;

    try {
      setResponding(true);
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_BASE_URL}/venue-owner/bookings/${selectedBooking.id}/respond`,
        { action, message },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(
        action === "accept"
          ? "Réservation confirmée avec succès"
          : "Réservation refusée"
      );

      setShowModal(false);
      setSelectedBooking(null);
      loadBookings();
    } catch (error) {
      console.error("Error responding to booking:", error);
      toast.error("Erreur lors de la réponse");
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "En attente", icon: Clock },
      confirmed: { color: "bg-green-100 text-green-800", text: "Confirmée", icon: CheckCircle },
      cancelled: { color: "bg-red-100 text-red-800", text: "Annulée", icon: XCircle },
      completed: { color: "bg-blue-100 text-blue-800", text: "Terminée", icon: CheckCircle },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Réservations</h1>
        <p className="text-gray-600">Gérez les demandes de réservation de vos terrains</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex space-x-2">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "Toutes" :
                 status === "pending" ? "En attente" :
                 status === "confirmed" ? "Confirmées" :
                 status === "completed" ? "Terminées" : "Annulées"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune réservation</h3>
          <p className="text-gray-600">
            Aucune réservation ne correspond à vos filtres.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{booking.teamName}</h3>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(booking.bookingDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                      <span className="text-xs text-gray-500">({booking.duration} min)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{booking.price.toFixed(2)}€</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        booking.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {booking.paymentStatus === "paid" ? "Payé" : "En attente"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{booking.venueName} - {booking.venueCity}</span>
                    </div>
                    <div className="text-gray-500">
                      Réservé par: <span className="font-medium">{booking.bookerName}</span>
                    </div>
                  </div>
                </div>

                <div className="ml-6">
                  <button
                    onClick={() => handleViewDetails(booking.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Voir détails</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Détails de la réservation</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Statut</label>
                {getStatusBadge(selectedBooking.status)}
              </div>

              {/* Venue Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Terrain</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedBooking.venueName}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.venueAddress}</p>
                  <p className="text-sm text-gray-600">Type: {selectedBooking.fieldType}</p>
                </div>
              </div>

              {/* Booking Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Informations de réservation</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(selectedBooking.bookingDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{selectedBooking.startTime} - {selectedBooking.endTime}</span>
                    <span className="text-sm text-gray-500">({selectedBooking.durationMinutes} minutes)</span>
                  </div>
                </div>
              </div>

              {/* Team & Booker Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Équipe et Contact</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>Équipe:</strong> {selectedBooking.teamName}</p>
                  <p><strong>Réservé par:</strong> {selectedBooking.bookerFirstName} {selectedBooking.bookerLastName}</p>
                  <p><strong>Email:</strong> {selectedBooking.bookerEmail}</p>
                  {selectedBooking.bookerPhone && (
                    <p><strong>Téléphone:</strong> {selectedBooking.bookerPhone}</p>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tarification</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Prix de base:</span>
                    <span className="font-medium">{selectedBooking.basePrice.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{selectedBooking.price.toFixed(2)}€</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      selectedBooking.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {selectedBooking.paymentStatus === "paid" ? "✓ Payé" : "⏳ En attente de paiement"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedBooking.status === "pending" && (
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleRespond("reject")}
                    disabled={responding}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>{responding ? "En cours..." : "Refuser"}</span>
                  </button>
                  <button
                    onClick={() => handleRespond("accept")}
                    disabled={responding}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{responding ? "En cours..." : "Accepter"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
