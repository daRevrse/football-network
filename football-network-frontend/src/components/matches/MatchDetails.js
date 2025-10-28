// ====================================================================
// football-network-frontend/src/components/matches/MatchDetails.js
// Version complète avec gestion du match
// ====================================================================

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  Trophy,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import MatchChat from "./MatchChat";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const MatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // États pour les modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // États pour l'édition
  const [editForm, setEditForm] = useState({
    matchDate: "",
    duration: 90,
    location: "",
    refereeContact: "",
    notes: "",
  });

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
      setMatch(response.data);

      // Pré-remplir le formulaire d'édition
      setEditForm({
        matchDate: response.data.matchDate?.slice(0, 16) || "",
        duration: response.data.duration || 90,
        location: response.data.location?.id || null,
        refereeContact: response.data.refereeContact || "",
        notes: response.data.notes || "",
      });
    } catch (error) {
      console.error("Error loading match:", error);
      toast.error("Erreur lors du chargement du match");
      navigate("/matches");
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur peut gérer ce match
  const canManageMatch = () => {
    if (!match || !user) return false;
    // L'utilisateur peut gérer s'il est capitaine de l'équipe domicile
    return match.homeTeam?.captain?.id === user.id;
  };

  const canCancelMatch = () => {
    if (!match || !user) return false;
    // Les deux capitaines peuvent annuler
    return (
      match.homeTeam?.captain?.id === user.id ||
      match.awayTeam?.captain?.id === user.id
    );
  };

  const handleEditMatch = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`${API_BASE_URL}/matches/${matchId}`, {
        matchDate: editForm.matchDate,
        durationMinutes: parseInt(editForm.duration),
        locationId: editForm.location || null,
        refereeContact: editForm.refereeContact || null,
        notes: editForm.notes || null,
      });

      toast.success("Match modifié avec succès");
      setShowEditModal(false);
      loadMatch();
    } catch (error) {
      console.error("Error updating match:", error);
      toast.error(
        error.response?.data?.error || "Erreur lors de la modification"
      );
    }
  };

  const handleConfirmMatch = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/matches/${matchId}/confirm`);
      toast.success("Match confirmé");
      loadMatch();
    } catch (error) {
      console.error("Error confirming match:", error);
      toast.error("Erreur lors de la confirmation");
    }
  };

  const handleCancelMatch = async (reason) => {
    try {
      await axios.patch(`${API_BASE_URL}/matches/${matchId}/cancel`, {
        reason: reason || "Annulé par le capitaine",
      });
      toast.success("Match annulé");
      setShowCancelModal(false);
      loadMatch();
    } catch (error) {
      console.error("Error cancelling match:", error);
      toast.error("Erreur lors de l'annulation");
    }
  };

  const handleDeleteMatch = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/matches/${matchId}`);
      toast.success("Match supprimé");
      navigate("/matches");
    } catch (error) {
      console.error("Error deleting match:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "En attente",
      confirmed: "Confirmé",
      completed: "Terminé",
      cancelled: "Annulé",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Match non trouvé</p>
      </div>
    );
  }

  const { date, time } = formatDate(match.matchDate);
  const isUserInvolved =
    match.userTeamId &&
    (match.homeTeam.id === match.userTeamId ||
      match.awayTeam?.id === match.userTeamId);

  const isPastMatch = new Date(match.matchDate) < new Date();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header avec actions */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>

        <div className="flex items-center gap-3">
          {/* Chat */}
          {isUserInvolved && match.status === "confirmed" && (
            <button
              onClick={() => setShowChat(!showChat)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                showChat
                  ? "bg-green-100 text-green-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {showChat ? "Fermer" : "Chat"}
            </button>
          )}

          {/* Menu de gestion */}
          {(canManageMatch() || canCancelMatch()) &&
            match.status !== "cancelled" && (
              <div className="relative group">
                <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Settings className="w-5 h-5 mr-2" />
                  Gérer
                </button>

                {/* Menu déroulant */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  {/* Confirmer le match */}
                  {canManageMatch() && match.status === "pending" && (
                    <button
                      onClick={handleConfirmMatch}
                      className="w-full flex items-center px-4 py-3 text-left text-green-700 hover:bg-green-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-3" />
                      Confirmer le match
                    </button>
                  )}

                  {/* Saisir/Valider le score */}
                  {match.status === "completed" && isUserInvolved && (
                    <Link
                      to={`/matches/${matchId}/validate`}
                      className="w-full flex items-center px-4 py-3 text-left text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <Trophy className="w-4 h-4 mr-3" />
                      Valider le score
                    </Link>
                  )}

                  {/* Modifier le match */}
                  {canManageMatch() &&
                    !isPastMatch &&
                    match.status !== "completed" && (
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="w-full flex items-center px-4 py-3 text-left text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-3" />
                        Modifier
                      </button>
                    )}

                  {/* Annuler le match */}
                  {canCancelMatch() &&
                    !isPastMatch &&
                    match.status !== "completed" && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full flex items-center px-4 py-3 text-left text-yellow-700 hover:bg-yellow-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-3" />
                        Annuler le match
                      </button>
                    )}

                  {/* Supprimer le match */}
                  {canManageMatch() && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full flex items-center px-4 py-3 text-left text-red-700 hover:bg-red-50 transition-colors border-t border-gray-200"
                    >
                      <Trash2 className="w-4 h-4 mr-3" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Informations principales du match */}
        <div className={showChat ? "xl:col-span-2" : "xl:col-span-3"}>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* En-tête du match */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    match.status
                  )} !bg-white`}
                >
                  {getStatusLabel(match.status)}
                </span>
                <span className="text-green-100 text-sm">
                  {match.type === "friendly" ? "Match amical" : match.type}
                </span>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">
                  {match.homeTeam.name} vs {match.awayTeam?.name || "À définir"}
                </h1>

                {match.status === "completed" && (
                  <div className="text-4xl font-bold mb-4">
                    {match.score.home} - {match.score.away}
                  </div>
                )}

                <div className="flex items-center justify-center space-x-6 text-green-100">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    <div>
                      <div className="capitalize">{date}</div>
                      <div>{time}</div>
                    </div>
                  </div>

                  {match.location && (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <div>
                        <div>{match.location.name}</div>
                        <div className="text-sm">{match.location.city}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Détails des équipes */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Équipe domicile */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {match.homeTeam.name} (Domicile)
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Capitaine:</span>{" "}
                      {match.homeTeam.captain.firstName}{" "}
                      {match.homeTeam.captain.lastName}
                    </div>
                    <div>
                      <span className="font-medium">Niveau:</span>{" "}
                      {match.homeTeam.skillLevel}
                    </div>
                  </div>
                </div>

                {/* Équipe visiteur */}
                {match.awayTeam ? (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      {match.awayTeam.name} (Visiteur)
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Capitaine:</span>{" "}
                        {match.awayTeam.captain.firstName}{" "}
                        {match.awayTeam.captain.lastName}
                      </div>
                      <div>
                        <span className="font-medium">Niveau:</span>{" "}
                        {match.awayTeam.skillLevel}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>Équipe visiteur à définir</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations additionnelles */}
              {(match.location || match.refereeContact || match.notes) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">
                    Informations additionnelles
                  </h3>

                  {match.location && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Lieu</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{match.location.name}</p>
                        <p className="text-gray-600">
                          {match.location.address}
                        </p>
                        {match.location.fieldType && (
                          <p className="text-sm text-gray-500 mt-1">
                            Type: {match.location.fieldType}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {match.refereeContact && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Arbitre
                      </h4>
                      <p className="bg-gray-50 rounded-lg p-3">
                        {match.refereeContact}
                      </p>
                    </div>
                  )}

                  {match.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                      <p className="bg-gray-50 rounded-lg p-3">{match.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat */}
        {showChat && isUserInvolved && (
          <div className="xl:col-span-1">
            <div className="h-96 xl:h-[600px]">
              <MatchChat matchId={matchId} onClose={() => setShowChat(false)} />
            </div>
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">Modifier le match</h3>

            <form onSubmit={handleEditMatch}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date et heure
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.matchDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, matchDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    value={editForm.duration}
                    onChange={(e) =>
                      setEditForm({ ...editForm, duration: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="30"
                    max="180"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact arbitre (optionnel)
                  </label>
                  <input
                    type="text"
                    value={editForm.refereeContact}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        refereeContact: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom et téléphone de l'arbitre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Informations complémentaires..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'annulation */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-xl font-bold">Annuler le match</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir annuler ce match ? Les deux équipes
              seront notifiées.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Non, garder
              </button>
              <button
                onClick={() => handleCancelMatch()}
                className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-xl font-bold">Supprimer le match</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Cette action est irréversible. Toutes les données du match seront
              définitivement supprimées.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteMatch}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetails;
