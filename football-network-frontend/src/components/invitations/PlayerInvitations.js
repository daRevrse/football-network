// football-network-frontend/src/components/invitations/PlayerInvitations.js
import React, { useState, useEffect } from "react";
import {
  Clock,
  Users,
  MapPin,
  Check,
  X,
  MessageCircle,
  Trophy,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
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
      // CORRECTION : Utiliser la bonne route
      const response = await axios.get(
        `${API_BASE_URL}/player-invitations?status=${filterStatus}&limit=50`
      );
      setInvitations(response.data);
    } catch (error) {
      console.error("Error loading invitations:", error);
      toast.error("Erreur lors du chargement des invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (
    invitationId,
    response,
    responseMessage = ""
  ) => {
    try {
      setResponding((prev) => ({ ...prev, [invitationId]: true }));

      // CORRECTION : Utiliser la bonne route
      await axios.patch(
        `${API_BASE_URL}/player-invitations/${invitationId}/respond`,
        {
          response,
          responseMessage: responseMessage.trim() || null,
        }
      );

      toast.success(
        `Invitation ${response === "accepted" ? "acceptée" : "refusée"} !`
      );

      // Recharger les invitations
      await loadInvitations();
      setResponseModal(null);
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la réponse");
    } finally {
      setResponding((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "declined":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "expired":
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "En attente",
      accepted: "Acceptée",
      declined: "Refusée",
      expired: "Expirée",
    };
    return labels[status] || status;
  };

  const getSkillLevelLabel = (level) => {
    const labels = {
      beginner: "Débutant",
      amateur: "Amateur",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
      semi_pro: "Semi-pro",
    };
    return labels[level] || level;
  };

  const isExpired = (invitation) => {
    return invitation.isExpired || invitation.status === "expired";
  };

  const canRespond = (invitation) => {
    return invitation.status === "pending" && !isExpired(invitation);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expirée";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0)
      return `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}`;
    if (hours > 0)
      return `${hours} heure${hours > 1 ? "s" : ""} restante${
        hours > 1 ? "s" : ""
      }`;
    return "Expire bientôt";
  };

  const filterTabs = [
    { id: "pending", label: "En attente", icon: Clock },
    { id: "accepted", label: "Acceptées", icon: CheckCircle },
    { id: "declined", label: "Refusées", icon: XCircle },
    { id: "all", label: "Toutes", icon: MessageCircle },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Invitations</h1>
          <p className="text-gray-600 mt-1">
            Gérez les invitations reçues des équipes
          </p>
        </div>
        <button
          onClick={loadInvitations}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      {/* Filtres par onglets */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = filterStatus === tab.id;
              const count = invitations.filter((inv) =>
                tab.id === "all" ? true : inv.status === tab.id
              ).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        isActive
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Liste des invitations */}
      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune invitation
          </h3>
          <p className="text-gray-600">
            {filterStatus === "pending"
              ? "Vous n'avez pas d'invitations en attente"
              : `Aucune invitation ${getStatusLabel(
                  filterStatus
                ).toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className={`bg-white rounded-lg shadow-md border-l-4 ${
                invitation.status === "pending" && !isExpired(invitation)
                  ? "border-yellow-400"
                  : invitation.status === "accepted"
                  ? "border-green-400"
                  : invitation.status === "declined"
                  ? "border-red-400"
                  : "border-gray-400"
              } p-6`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* En-tête de l'invitation */}
                  <div className="flex items-center mb-4">
                    {getStatusIcon(invitation.status)}
                    <span className="ml-2 font-medium text-gray-900">
                      Invitation de {invitation.team.name}
                    </span>
                    <span
                      className={`ml-3 px-2 py-1 text-xs rounded-full ${
                        invitation.status === "pending" &&
                        !isExpired(invitation)
                          ? "bg-yellow-100 text-yellow-800"
                          : invitation.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : invitation.status === "declined"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getStatusLabel(invitation.status)}
                    </span>
                  </div>

                  {/* Informations de l'équipe */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Trophy className="w-4 h-4 mr-2" />
                        Niveau: {getSkillLevelLabel(invitation.team.skillLevel)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {invitation.team.currentMembers}/
                        {invitation.team.maxPlayers} joueurs
                      </div>
                      {invitation.team.locationCity && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {invitation.team.locationCity}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        Invité par: {invitation.inviter.firstName}{" "}
                        {invitation.inviter.lastName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(invitation.sentAt)}
                      </div>
                      {invitation.expiresAt && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {getTimeRemaining(invitation.expiresAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message de l'invitation */}
                  {invitation.message && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-gray-700 text-sm italic">
                        "{invitation.message}"
                      </p>
                    </div>
                  )}

                  {/* Description de l'équipe */}
                  {invitation.team.description && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Description de l'équipe:
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {invitation.team.description}
                      </p>
                    </div>
                  )}

                  {/* Message de réponse (si déjà répondu) */}
                  {invitation.responseMessage && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-blue-900 mb-1">
                        Votre réponse:
                      </h4>
                      <p className="text-blue-700 text-sm">
                        "{invitation.responseMessage}"
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        Répondu le {formatDate(invitation.respondedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canRespond(invitation) && (
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() =>
                        setResponseModal({ ...invitation, type: "accept" })
                      }
                      disabled={responding[invitation.id]}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accepter
                    </button>
                    <button
                      onClick={() =>
                        setResponseModal({ ...invitation, type: "decline" })
                      }
                      disabled={responding[invitation.id]}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de réponse avec message */}
      {responseModal && (
        <ResponseModal
          invitation={responseModal}
          onResponse={handleResponse}
          onClose={() => setResponseModal(null)}
          responding={responding[responseModal.id]}
        />
      )}
    </div>
  );
};

// Composant Modal pour répondre avec un message
const ResponseModal = ({ invitation, onResponse, onClose, responding }) => {
  const [responseMessage, setResponseMessage] = useState("");
  const isAccepting = invitation.type === "accept";

  const handleSubmit = () => {
    onResponse(
      invitation.id,
      isAccepting ? "accepted" : "declined",
      responseMessage
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {isAccepting ? "Accepter" : "Refuser"} l'invitation
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            {isAccepting
              ? `Vous allez accepter l'invitation de l'équipe "${invitation.team.name}".`
              : `Vous allez refuser l'invitation de l'équipe "${invitation.team.name}".`}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (optionnel)
            </label>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder={
                isAccepting
                  ? "Merci pour l'invitation ! J'ai hâte de jouer avec vous."
                  : "Merci pour l'invitation, mais je ne peux pas rejoindre pour le moment."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {responseMessage.length}/500 caractères
            </p>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={responding}
            className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isAccepting
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {responding ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : isAccepting ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            {responding ? "En cours..." : isAccepting ? "Accepter" : "Refuser"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerInvitations;
