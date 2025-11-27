import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  Check,
  X,
  MessageSquare,
  Phone,
  Mail,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VenueBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/venue-owner/bookings/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBooking(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement de la réservation");
      navigate("/venue-owner/bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir ${
          action === "accept" ? "accepter" : "refuser"
        } cette réservation ?`
      )
    )
      return;

    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/venue-owner/bookings/${id}/respond`,
        { action, message: responseMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        `Réservation ${
          action === "accept" ? "confirmée" : "refusée"
        } avec succès`
      );
      fetchBookingDetails();
    } catch (error) {
      toast.error("Erreur lors du traitement");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  if (!booking) return null;

  // Utilisation des clés camelCase ici
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-gray-700 transition"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Retour
      </button>

      {booking.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen  px-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Aucune réservation trouvée
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Réservation #{booking.id}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : booking.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {booking.status === "pending"
                    ? "En attente"
                    : booking.status === "confirmed"
                    ? "Confirmée"
                    : "Annulée"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Prix</p>
                <p className="text-2xl font-bold text-green-600">
                  {booking.price}€
                </p>
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">
                  Détails Terrain
                </h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.venueName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.venueAddress}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">
                      {booking.fieldType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {booking.startTime} - {booking.endTime} (
                    {booking.durationMinutes} min)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">
                  Client
                </h3>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.teamName}
                    </p>
                    <p className="text-sm text-gray-500">Équipe</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.bookerFirstName} {booking.bookerLastName}
                    </p>
                    <p className="text-sm text-gray-500">Contact</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${booking.bookerEmail}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {booking.bookerEmail}
                  </a>
                </div>
                {booking.bookerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a
                      href={`tel:${booking.bookerPhone}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {booking.bookerPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {booking.status === "pending" && (
              <div className="bg-gray-50 p-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Réponse propriétaire
                </h3>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Message pour le client (optionnel)..."
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500 outline-none"
                  rows="3"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => handleResponse("accept")}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-green-700 transition flex justify-center items-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Accepter
                  </button>
                  <button
                    onClick={() => handleResponse("reject")}
                    disabled={processing}
                    className="flex-1 bg-white text-red-600 border border-red-200 py-2 px-4 rounded-lg font-bold hover:bg-red-50 transition flex justify-center items-center gap-2"
                  >
                    <X className="w-5 h-5" /> Refuser
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VenueBookingDetails;
