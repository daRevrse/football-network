import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Search,
  Mail,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
  const [inviteMethod, setInviteMethod] = useState("search"); // 'search' | 'email'
  const [emailInvite, setEmailInvite] = useState("");
  const [invitationMessage, setInvitationMessage] = useState(
    `Rejoignez l'équipe ${team.name} !`
  );

  // Debounce search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length > 2) searchPlayers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchPlayers = async () => {
    try {
      setLoading(true);
      // On exclut les membres actuels
      const teamMemberIds = team.members?.map((m) => m.id) || [];

      const response = await axios.get(
        `${API_BASE_URL}/users/search?search=${searchTerm}&limit=10`
      );
      setAvailablePlayers(
        response.data.filter((p) => !teamMemberIds.includes(p.id))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (player) => {
    setSelectedPlayers((prev) =>
      prev.find((p) => p.id === player.id)
        ? prev.filter((p) => p.id !== player.id)
        : [...prev, player]
    );
  };

  const handleSend = async () => {
    setSending(true);
    try {
      if (inviteMethod === "search") {
        if (selectedPlayers.length === 0)
          return toast.error("Sélectionnez au moins un joueur");

        await Promise.all(
          selectedPlayers.map((p) =>
            axios.post(`${API_BASE_URL}/teams/${team.id}/invite`, {
              playerId: p.id,
              message: invitationMessage,
            })
          )
        );
        toast.success(`${selectedPlayers.length} invitation(s) envoyée(s)`);
      } else {
        if (!emailInvite) return toast.error("Email requis");
        await axios.post(`${API_BASE_URL}/teams/${team.id}/invite-email`, {
          email: emailInvite,
          message: invitationMessage,
        });
        toast.success("Invitation par email envoyée");
      }
      setTimeout(onPlayerInvited, 1000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gray-900 p-6 flex justify-between items-center shrink-0">
          <div className="text-white">
            <h2 className="text-lg font-bold flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-green-500" /> Recruter
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Ajoutez des talents à {team.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            onClick={() => setInviteMethod("search")}
            className={`flex-1 py-3 text-sm font-medium transition ${
              inviteMethod === "search"
                ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Rechercher
          </button>
          <button
            onClick={() => setInviteMethod("email")}
            className={`flex-1 py-3 text-sm font-medium transition ${
              inviteMethod === "email"
                ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Par Email
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {inviteMethod === "search" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Nom du joueur..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Chips joueurs sélectionnés */}
              {selectedPlayers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-green-50 rounded-lg border border-green-100">
                  {selectedPlayers.map((p) => (
                    <span
                      key={p.id}
                      className="bg-white text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center shadow-sm border border-green-100"
                    >
                      {p.firstName} {p.lastName}
                      <button
                        onClick={() => toggleSelection(p)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Liste Résultats */}
              <div className="space-y-2 mt-4">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-500" />
                  </div>
                ) : availablePlayers.length === 0 && searchTerm.length > 2 ? (
                  <div className="text-center text-gray-500 py-8">
                    Aucun joueur trouvé
                  </div>
                ) : (
                  availablePlayers.map((player) => {
                    const isSelected = selectedPlayers.some(
                      (p) => p.id === player.id
                    );
                    return (
                      <div
                        key={player.id}
                        onClick={() => toggleSelection(player)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                          isSelected
                            ? "border-green-500 bg-green-50"
                            : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 group-hover:bg-white transition-colors">
                            {player.firstName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {player.position || "Joueur"} •{" "}
                              {player.skillLevel || "Amateur"}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl flex items-start border border-blue-100">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  Invitez des amis qui ne sont pas encore sur la plateforme. Ils
                  recevront un lien pour s'inscrire et rejoindre l'équipe.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email du destinataire
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="ami@exemple.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    value={emailInvite}
                    onChange={(e) => setEmailInvite(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message personnalisé (optionnel)
            </label>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none"
              rows={2}
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={
              sending ||
              (inviteMethod === "search" && selectedPlayers.length === 0) ||
              (inviteMethod === "email" && !emailInvite)
            }
            className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center shadow-lg shadow-green-200 transition-all transform active:scale-95"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitePlayerModal;
