// football-network-frontend/src/components/teams/TeamInvitations.js
import React, { useState, useEffect } from "react";
import {
  Clock,
  Users,
  Mail,
  Check,
  X,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserX,
  Calendar,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TeamInvitations = ({ teamId, teamName }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    if (teamId) {
      loadInvitations();
    }
  }, [teamId, filterStatus]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/teams/${teamId}/invitations?status=${filterStatus}&limit=50`
      );
      setInvitations(response.data);
    } catch (error) {
      console.error("Error loading team invitations:", error);
      toast.error("Erreur lors du chargement des invitations");
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId) => {
    try {
      setDeleting((prev) => ({ ...prev, [invitationId]: true }));

      await axios.delete(
        `${API_BASE_URL}/teams/${teamId}/invitations/${invitationId}`
      );

      toast.success("Invitation annulée avec succès");
      await loadInvitations(); // Recharger la liste
    } catch (error) {
      console.error("Error canceling invitation:", error);
      toast.error(error.response?.data?.error || "Erreur lors de l'annulation");
    } finally {
      setDeleting((prev) => ({ ...prev, [invitationId]: false }));
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

  const getPositionLabel = (position) => {
    const labels = {
      goalkeeper: "Gardien",
      defender: "Défenseur",
      midfielder: "Milieu",
      forward: "Attaquant",
      any: "Polyvalent",
    };
    return labels[position] || position;
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

  const canCancel = (invitation) => {
    return invitation.status === "pending" && !invitation.isExpired;
  };

  const filterTabs = [
    { id: "pending", label: "En attente", icon: Clock },
    { id: "accepted", label: "Acceptées", icon: CheckCircle },
    { id: "declined", label: "Refusées", icon: XCircle },
    { id: "all", label: "Toutes", icon: MessageCircle },
  ];

  const getStats = () => {
    const total = invitations.length;
    const pending = invitations.filter(
      (inv) => inv.status === "pending"
    ).length;
    const accepted = invitations.filter(
      (inv) => inv.status === "accepted"
    ).length;
    const declined = invitations.filter(
      (inv) => inv.status === "declined"
    ).length;
    const expired = invitations.filter(
      (inv) => inv.status === "expired"
    ).length;

    return { total, pending, accepted, declined, expired };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Invitations envoyées
          </h3>
          <button
            onClick={loadInvitations}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.accepted}
            </div>
            <div className="text-sm text-gray-600">Acceptées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.declined}
            </div>
            <div className="text-sm text-gray-600">Refusées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Filtres par onglets */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = filterStatus === tab.id;
              const count = tab.id === "all" ? stats.total : stats[tab.id] || 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

        {/* Liste des invitations */}
        <div className="p-6">
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Aucune invitation
              </h4>
              <p className="text-gray-600">
                {filterStatus === "pending"
                  ? "Aucune invitation en attente"
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
                  className={`border rounded-lg p-4 ${
                    invitation.status === "pending" && !invitation.isExpired
                      ? "border-yellow-200 bg-yellow-50"
                      : invitation.status === "accepted"
                      ? "border-green-200 bg-green-50"
                      : invitation.status === "declined"
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* En-tête */}
                      <div className="flex items-center mb-3">
                        {getStatusIcon(invitation.status)}
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900">
                            {invitation.player.firstName}{" "}
                            {invitation.player.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {invitation.player.email}
                          </p>
                        </div>
                        <span
                          className={`ml-3 px-2 py-1 text-xs rounded-full ${
                            invitation.status === "pending" &&
                            !invitation.isExpired
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

                      {/* Informations du joueur */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Position:</span>{" "}
                          {getPositionLabel(invitation.player.position)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Niveau:</span>{" "}
                          {getSkillLevelLabel(invitation.player.skillLevel)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Envoyée le:</span>{" "}
                          {formatDate(invitation.sentAt)}
                        </div>
                      </div>

                      {/* Expiration */}
                      {invitation.expiresAt && (
                        <div className="mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {getTimeRemaining(invitation.expiresAt)}
                          </div>
                        </div>
                      )}

                      {/* Message d'invitation */}
                      {invitation.message && (
                        <div className="bg-white rounded p-3 mb-3">
                          <p className="text-sm text-gray-700 italic">
                            "{invitation.message}"
                          </p>
                        </div>
                      )}

                      {/* Message de réponse */}
                      {invitation.responseMessage && (
                        <div className="bg-blue-50 rounded p-3 mb-3">
                          <h5 className="font-medium text-blue-900 mb-1">
                            Réponse du joueur:
                          </h5>
                          <p className="text-sm text-blue-700">
                            "{invitation.responseMessage}"
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Répondu le {formatDate(invitation.respondedAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canCancel(invitation) && (
                      <div className="ml-4">
                        <button
                          onClick={() => cancelInvitation(invitation.id)}
                          disabled={deleting[invitation.id]}
                          className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                          title="Annuler l'invitation"
                        >
                          {deleting[invitation.id] ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamInvitations;
