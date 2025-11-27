import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PendingParticipations = () => {
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    loadPendingParticipations();
  }, []);

  const loadPendingParticipations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/participations/my-pending`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setParticipations(response.data.participations || []);
    } catch (error) {
      console.error("Error loading participations:", error);
      toast.error("Erreur lors du chargement des participations");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (participationId, status) => {
    try {
      setResponding(participationId);
      const token = localStorage.getItem("token");

      await axios.put(
        `${API_BASE_URL}/participations/${participationId}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const statusText =
        status === "confirmed"
          ? "confirmée"
          : status === "declined"
          ? "déclinée"
          : "marquée comme incertain";

      toast.success(`Participation ${statusText} !`);

      // Retirer la participation de la liste
      setParticipations((prev) => prev.filter((p) => p.id !== participationId));
    } catch (error) {
      console.error("Error responding to participation:", error);
      toast.error("Erreur lors de la réponse");
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMatchStatus = (status) => {
    const statuses = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "En attente" },
      confirmed: { color: "bg-green-100 text-green-800", text: "Confirmé" },
      cancelled: { color: "bg-red-100 text-red-800", text: "Annulé" },
    };
    return statuses[status] || statuses.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (participations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune participation en attente
        </h3>
        <p className="text-gray-600">
          Vous avez répondu à toutes vos invitations de match
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Participations en Attente
          </h2>
          <p className="text-gray-600 mt-1">
            {participations.length} match{participations.length > 1 ? "s" : ""}{" "}
            en attente de confirmation
          </p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
          {participations.length}
        </div>
      </div>

      {/* Liste des participations */}
      <div className="space-y-4">
        {participations.map((participation) => {
          const matchStatus = getMatchStatus(participation?.match?.status);
          const isMyTeamHome =
            participation?.team?.id === participation?.match?.homeTeamId;

          return (
            <div
              key={participation.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* En-tête du match */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {isMyTeamHome ? (
                        <>
                          {participation?.match?.homeTeamName} vs{" "}
                          {participation?.match?.awayTeamName}
                        </>
                      ) : (
                        <>
                          {participation?.match?.awayTeamName} vs{" "}
                          {participation?.match?.homeTeamName}
                        </>
                      )}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${matchStatus.color}`}
                    >
                      {matchStatus.text}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="font-medium">Mon équipe:</span>
                    <span className="ml-1">{participation?.team?.name}</span>
                  </div>
                </div>
              </div>

              {/* Détails du match */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(participation?.match?.matchDate)}</span>
                </div>

                {participation?.match?.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{participation?.match?.location}</span>
                  </div>
                )}

                {participation?.match?.duration && (
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{participation?.match?.duration} minutes</span>
                  </div>
                )}

                {participation?.match?.confirmationsCount !== undefined && (
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>
                      {participation?.match?.confirmationsCount} confirmations
                    </span>
                  </div>
                )}
              </div>

              {/* Info importante */}
              {participation?.match?.status === "pending" && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <strong>Match en attente:</strong> Le match sera confirmé
                      une fois que suffisamment de joueurs auront confirmé leur
                      participation (minimum 6 par équipe).
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleRespond(participation.id, "confirmed")}
                  disabled={responding === participation.id}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {responding === participation.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Je participe</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleRespond(participation.id, "maybe")}
                  disabled={responding === participation.id}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {responding === participation.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <HelpCircle className="w-5 h-5" />
                      <span>Peut-être</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleRespond(participation.id, "declined")}
                  disabled={responding === participation.id}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {responding === participation.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>Je ne peux pas</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingParticipations;
