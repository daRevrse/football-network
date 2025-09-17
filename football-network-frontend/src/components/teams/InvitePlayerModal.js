// ==========================================
// src/components/teams/InvitePlayerModal.js - Modal d'invitation de joueur
// ==========================================

import React, { useState, useEffect } from "react";
import { X, UserPlus, Search, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const InvitePlayerModal = ({ team, onClose, onPlayerInvited }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteMethod, setInviteMethod] = useState("search"); // 'search' ou 'email'
  const [emailInvite, setEmailInvite] = useState("");

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchPlayers();
    } else {
      setAvailablePlayers([]);
    }
  }, [searchTerm]);

  const searchPlayers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("search", searchTerm);
      params.append("limit", "20");

      const response = await axios.get(
        `${API_BASE_URL}/users/search?${params}`
      );

      // Filtrer les joueurs qui ne sont pas déjà dans l'équipe
      const teamMemberIds = team.members.map((member) => member.id);
      const filtered = response.data.filter(
        (player) => !teamMemberIds.includes(player.id)
      );

      setAvailablePlayers(filtered);
    } catch (error) {
      console.error("Error searching players:", error);
      toast.error("Erreur lors de la recherche de joueurs");
    } finally {
      setLoading(false);
    }
  };

  const togglePlayerSelection = (player) => {
    setSelectedPlayers((prev) => {
      const exists = prev.find((p) => p.id === player.id);
      if (exists) {
        return prev.filter((p) => p.id !== player.id);
      } else {
        return [...prev, player];
      }
    });
  };

  const sendInvitations = async () => {
    if (inviteMethod === "search" && selectedPlayers.length === 0) {
      toast.error("Veuillez sélectionner au moins un joueur");
      return;
    }

    if (inviteMethod === "email" && !emailInvite.trim()) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    try {
      setSending(true);

      if (inviteMethod === "search") {
        // Envoyer les invitations aux joueurs sélectionnés
        const promises = selectedPlayers.map((player) =>
          axios.post(`${API_BASE_URL}/teams/${team.id}/invite`, {
            playerId: player.id,
            message: `Vous êtes invité(e) à rejoindre l'équipe "${team.name}"`,
          })
        );

        await Promise.all(promises);
        toast.success(`${selectedPlayers.length} invitation(s) envoyée(s) !`);
      } else {
        // Envoyer invitation par email
        await axios.post(`${API_BASE_URL}/teams/${team.id}/invite-email`, {
          email: emailInvite.trim(),
          message: `Vous êtes invité(e) à rejoindre l'équipe "${team.name}"`,
        });
        toast.success("Invitation envoyée par email !");
      }

      onPlayerInvited();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors de l'envoi des invitations"
      );
    } finally {
      setSending(false);
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Inviter des joueurs
            </h2>
            <p className="text-gray-600 mt-1">
              Ajoutez de nouveaux membres à "{team.name}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Méthodes d'invitation */}
        <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setInviteMethod("search")}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                inviteMethod === "search"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Search className="w-5 h-5 mx-auto mb-2" />
              <div className="font-medium">Rechercher des joueurs</div>
              <div className="text-sm opacity-75">
                Trouvez des joueurs existants
              </div>
            </button>

            <button
              onClick={() => setInviteMethod("email")}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                inviteMethod === "email"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Mail className="w-5 h-5 mx-auto mb-2" />
              <div className="font-medium">Inviter par email</div>
              <div className="text-sm opacity-75">
                Invitez quelqu'un à s'inscrire
              </div>
            </button>
          </div>

          {/* Recherche de joueurs */}
          {inviteMethod === "search" && (
            <div className="space-y-4">
              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Rechercher un joueur par nom..."
                />
              </div>

              {/* Joueurs sélectionnés */}
              {selectedPlayers.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">
                    Joueurs sélectionnés ({selectedPlayers.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayers.map((player) => (
                      <span
                        key={player.id}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {player.firstName} {player.lastName}
                        <button
                          onClick={() => togglePlayerSelection(player)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Résultats de recherche */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                  </div>
                )}

                {!loading &&
                  searchTerm.length > 2 &&
                  availablePlayers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p>Aucun joueur trouvé pour "{searchTerm}"</p>
                    </div>
                  )}

                {availablePlayers.map((player) => {
                  const isSelected = selectedPlayers.find(
                    (p) => p.id === player.id
                  );
                  return (
                    <div
                      key={player.id}
                      onClick={() => togglePlayerSelection(player)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {player.firstName[0]}
                            {player.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getPositionLabel(player.position)} •{" "}
                              {getSkillLevelLabel(player.skillLevel)}
                            </p>
                            {player.locationCity && (
                              <p className="text-xs text-gray-500">
                                {player.locationCity}
                              </p>
                            )}
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invitation par email */}
          {inviteMethod === "email" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email du joueur
                </label>
                <input
                  type="email"
                  value={emailInvite}
                  onChange={(e) => setEmailInvite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="exemple@email.com"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Comment ça fonctionne :</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>
                        • Un email d'invitation sera envoyé à cette adresse
                      </li>
                      <li>• La personne pourra s'inscrire sur la plateforme</li>
                      <li>
                        • Elle rejoindra automatiquement votre équipe après
                        inscription
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informations sur l'équipe */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">
              Informations de l'équipe
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Places disponibles:</span>{" "}
                {team.maxPlayers - team.currentPlayers}
              </div>
              <div>
                <span className="font-medium">Niveau:</span>{" "}
                {getSkillLevelLabel(team.skillLevel)}
              </div>
              <div>
                <span className="font-medium">Ville:</span>{" "}
                {team.locationCity || "Non spécifiée"}
              </div>
              <div>
                <span className="font-medium">Membres actuels:</span>{" "}
                {team.currentPlayers}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>

          <button
            onClick={sendInvitations}
            disabled={
              sending ||
              (inviteMethod === "search" && selectedPlayers.length === 0) ||
              (inviteMethod === "email" && !emailInvite.trim())
            }
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending
              ? "Envoi..."
              : inviteMethod === "search"
              ? `Inviter ${selectedPlayers.length} joueur(s)`
              : "Envoyer l'invitation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitePlayerModal;
