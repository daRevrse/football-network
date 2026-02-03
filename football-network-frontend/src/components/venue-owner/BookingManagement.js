import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Filter,
  Search,
  Euro,
  Users,
  MapPin,
  Phone,
  Mail,
  Loader2,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const BookingManagement = () => {
  const [searchParams] = useSearchParams();
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
        { headers: { Authorization: `Bearer ${token}` } }
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedBooking(response.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error loading booking details:", error);
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const handleRespond = async (action) => {
    if (!selectedBooking) return;
    try {
      setResponding(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/venue-owner/bookings/${selectedBooking.id}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(action === "accept" ? "Réservation confirmée" : "Réservation refusée");
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

  const getStatusConfig = (status) => {
    const config = {
      pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "En attente" },
      confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Confirmée" },
      cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Annulée" },
      completed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Terminée" },
    };
    return config[status] || config.pending;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const filters = [
    { value: "all", label: "Toutes" },
    { value: "pending", label: "En attente" },
    { value: "confirmed", label: "Confirmées" },
    { value: "completed", label: "Terminées" },
    { value: "cancelled", label: "Annulées" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Réservations</h1>
        <p className="text-gray-500 mt-1">Gérez les demandes de réservation de vos terrains</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === filter.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Bookings Table/List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Aucune réservation</h3>
          <p className="text-sm text-gray-500">
            Aucune réservation ne correspond à vos filtres.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">Équipe</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">Date & Heure</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">Terrain</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">Prix</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">Statut</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => {
                  const statusConfig = getStatusConfig(booking.status);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{booking.teamName}</div>
                        <div className="text-sm text-gray-500">{booking.bookerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{formatDate(booking.bookingDate)}</div>
                        <div className="text-sm text-gray-500">{booking.startTime} - {booking.endTime}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{booking.venueName}</div>
                        <div className="text-sm text-gray-500">{booking.venueCity}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{booking.price.toFixed(0)}€</div>
                        <div className={`text-xs ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {booking.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetails(booking.id)}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {bookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              return (
                <div key={booking.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900">{booking.teamName}</div>
                      <div className="text-sm text-gray-500">{booking.bookerName}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.bookingDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.startTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{booking.price.toFixed(0)}€</div>
                    <button
                      onClick={() => handleViewDetails(booking.id)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Détails de la réservation</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusConfig(selectedBooking.status).bg} ${getStatusConfig(selectedBooking.status).text}`}>
                  {getStatusConfig(selectedBooking.status).label}
                </span>
              </div>

              {/* Venue */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <MapPin className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedBooking.venueName}</div>
                    <div className="text-sm text-gray-500">{selectedBooking.venueAddress}</div>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Date</span>
                  </div>
                  <div className="font-medium text-gray-900">{formatDate(selectedBooking.bookingDate)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Horaire</span>
                  </div>
                  <div className="font-medium text-gray-900">{selectedBooking.startTime} - {selectedBooking.endTime}</div>
                </div>
              </div>

              {/* Team & Contact */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedBooking.teamName}</div>
                    <div className="text-sm text-gray-500">{selectedBooking.bookerFirstName} {selectedBooking.bookerLastName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 pl-11">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedBooking.bookerEmail}
                  </span>
                </div>
                {selectedBooking.bookerPhone && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 pl-11">
                    <Phone className="w-4 h-4" />
                    {selectedBooking.bookerPhone}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between py-4 border-t border-gray-100">
                <span className="text-gray-600">Total</span>
                <div className="text-right">
                  <div className="text-xl font-semibold text-gray-900">{selectedBooking.price?.toFixed(2) || '0.00'}€</div>
                  <div className={`text-xs ${selectedBooking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedBooking.paymentStatus === 'paid' ? 'Payé' : 'En attente de paiement'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedBooking.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleRespond("reject")}
                    disabled={responding}
                    className="flex-1 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Refuser</span>
                  </button>
                  <button
                    onClick={() => handleRespond("accept")}
                    disabled={responding}
                    className="flex-1 px-4 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {responding ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span>Accepter</span>
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
