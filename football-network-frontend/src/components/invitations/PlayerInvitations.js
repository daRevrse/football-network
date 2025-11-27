// football-network-frontend/src/components/invitations/PlayerInvitations.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Users,
  MapPin,
  Check,
  X,
  MessageCircle,
  Trophy,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PlayerInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState({});
  const [filterStatus, setFilterStatus] = useState("pending");
  const [responseModal, setResponseModal] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, [filterStatus]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      // On charge selon le statut sélectionné (pour avoir l'historique aussi)
      const response = await axios.get(
        `${API_BASE_URL}/player-invitations?status=${filterStatus}&limit=50`
      );
      setInvitations(response.data);
    } catch (error) {
      console.error("Erreur chargement invitations", error);
      toast.error("Impossible de charger les invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId, status, message = null) => {
    try {
      setResponding((prev) => ({ ...prev, [invitationId]: true }));

      // CORRECTION : Utiliser 'response' au lieu de 'status' pour correspondre au backend
      await axios.patch(
        // PATCH au lieu de PUT (votre route backend est router.patch)
        `${API_BASE_URL}/player-invitations/${invitationId}/respond`,
        {
          response: status, // Clé attendue par le backend (voir validation body('response'))
          responseMessage: message,
        }
      );

      toast.success(
        status === "accepted"
          ? "Invitation acceptée ! Bienvenue dans l'équipe."
          : "Invitation refusée."
      );

      loadInvitations();
      window.dispatchEvent(new Event("invitations_updated"));
      setResponseModal(null);
    } catch (error) {
      console.error("Erreur réponse invitation:", error);
      // Afficher le message d'erreur précis du backend si disponible
      const errMsg = error.response?.data?.error || "Une erreur est survenue";
      toast.error(errMsg);
    } finally {
      setResponding((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  // Composant Modal de réponse
  const ResponseModal = ({ invitation, onClose }) => {
    const [message, setMessage] = useState("");
    const isAccepting = responseModal.type === "accept";

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
          <div className={`p-6 ${isAccepting ? "bg-green-50" : "bg-red-50"}`}>
            <h3
              className={`text-xl font-bold flex items-center ${
                isAccepting ? "text-green-800" : "text-red-800"
              }`}
            >
              {isAccepting ? (
                <CheckCircle2 className="w-6 h-6 mr-2" />
              ) : (
                <XCircle className="w-6 h-6 mr-2" />
              )}
              {isAccepting ? "Accepter l'invitation" : "Refuser l'invitation"}
            </h3>
            <p className="text-sm mt-2 text-gray-600">
              {isAccepting
                ? `Vous êtes sur le point de rejoindre ${invitation.team.name}.`
                : "Cette action est irréversible."}
            </p>
          </div>

          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message pour le capitaine (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isAccepting ? "Ravi de rejoindre l'équipe !" : "Merci, mais..."
              }
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              rows={3}
            />
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={() =>
                handleResponse(
                  invitation.id,
                  isAccepting ? "accepted" : "declined",
                  message
                )
              }
              disabled={responding[invitation.id]}
              className={`px-6 py-2 text-white font-bold rounded-lg shadow-sm transition-all flex items-center ${
                isAccepting
                  ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                  : "bg-red-600 hover:bg-red-700 shadow-red-200"
              }`}
            >
              {responding[invitation.id] && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isAccepting ? "Confirmer" : "Refuser"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-green-600" />
              Invitations d'équipe
            </h1>
            <p className="text-gray-500 mt-1">
              Gérez les demandes de recrutement reçues
            </p>
          </div>

          {/* Filters */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            {[
              { id: "pending", label: "En attente" },
              { id: "accepted", label: "Acceptées" },
              { id: "declined", label: "Refusées" },
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setFilterStatus(status.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status.id
                    ? "bg-green-100 text-green-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-10 h-10 text-green-500 animate-spin mb-4" />
            <p className="text-gray-500">Chargement des invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucune invitation{" "}
              {filterStatus === "pending" ? "en attente" : "trouvée"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              {filterStatus === "pending"
                ? "Vous n'avez pas de nouvelle demande pour le moment. Soyez actif sur le terrain pour vous faire remarquer !"
                : "Votre historique est vide pour ce statut."}
            </p>
            <Link
              to="/teams/search"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200"
            >
              <Search className="w-5 h-5 mr-2" />
              Trouver une équipe
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                {/* Card Header with Team Cover/Info */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {/* Team Logo Placeholder */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                        {invitation.team.name[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                          {invitation.team.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {invitation.team.locationCity ||
                            "Ville non renseignée"}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            {invitation.team.skillLevel || "Amateur"}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                            {invitation.team.playersCount || 0} joueurs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div className="flex items-center justify-end mb-1">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(invitation.sentAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center justify-end">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(invitation.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className="px-6 py-4 bg-gray-50 border-y border-gray-100">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 italic">
                        "
                        {invitation.message ||
                          "Salut ! Nous serions ravis de t'avoir dans notre équipe. Rejoins-nous !"}
                        "
                      </p>
                      <p className="text-xs text-gray-500 mt-2 font-medium">
                        — {invitation.sender?.first_name}{" "}
                        {invitation.sender?.last_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 flex gap-3">
                  {filterStatus === "pending" ? (
                    <>
                      <button
                        onClick={() =>
                          setResponseModal({ type: "reject", invitation })
                        }
                        className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all flex items-center justify-center"
                      >
                        <X className="w-4 h-4 mr-2" /> Refuser
                      </button>
                      <button
                        onClick={() =>
                          setResponseModal({ type: "accept", invitation })
                        }
                        className="flex-1 py-2.5 px-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 mr-2" /> Rejoindre
                      </button>
                    </>
                  ) : (
                    <div
                      className={`w-full py-2 text-center text-sm font-medium rounded-lg ${
                        filterStatus === "accepted"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {filterStatus === "accepted"
                        ? "Invitation acceptée"
                        : "Invitation refusée"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de réponse */}
      {responseModal && (
        <ResponseModal
          invitation={responseModal.invitation}
          onClose={() => setResponseModal(null)}
        />
      )}
    </div>
  );
};

export default PlayerInvitations;
