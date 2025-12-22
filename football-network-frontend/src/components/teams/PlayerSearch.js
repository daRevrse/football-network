import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  UserPlus,
  Shield,
  Loader2,
  CheckCircle,
  X,
  Clock,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PlayerSearch = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myTeams, setMyTeams] = useState([]);

  // États pour la modale d'invitation
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/teams/my`);
        const managedTeams = response.data.filter((t) => t.role === "captain");
        setMyTeams(managedTeams);
        if (managedTeams.length > 0) {
          setSelectedTeamId(managedTeams[0].id);
        }
      } catch (error) {
        console.error("Erreur chargement équipes", error);
      }
    };
    fetchMyTeams();
    searchPlayers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlayers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchPlayers = async () => {
    setLoading(true);
    try {
      const params = searchTerm ? `?search=${searchTerm}` : "?limit=20";
      const response = await axios.get(
        `${API_BASE_URL}/users/recruit${params}`
      );
      // Exclure soi-même (déjà géré par le backend mais sécurité en plus)
      setPlayers(response.data.filter((p) => p.id !== user.id));
    } catch (error) {
      console.error("Erreur recherche joueurs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedTeamId) return toast.error("Sélectionnez une équipe");

    setSending(true);
    try {
      await axios.post(`${API_BASE_URL}/teams/${selectedTeamId}/invite`, {
        userIdOrEmail: selectedPlayer.id,
        message:
          inviteMessage || "Salut ! Je recrute pour mon équipe, ça te dit ?",
      });

      toast.success("Invitation envoyée !");
      setSelectedPlayer(null);
      setInviteMessage("");
      // Rafraîchir la liste pour mettre à jour le statut "Invité"
      searchPlayers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <UserPlus className="w-8 h-8 mr-3 text-green-600" />
          Recrutement
        </h1>
        <p className="text-gray-500 mt-1">
          Trouvez les meilleurs talents pour renforcer vos équipes.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, poste ou ville..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
          Aucun joueur trouvé pour cette recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            // Vérifier si le joueur a déjà été invité par une de mes équipes
            const alreadyInvited =
              player.invitedByTeams && player.invitedByTeams.length > 0;
            const invitedTeamsText = alreadyInvited
              ? player.invitedByTeams.join(", ")
              : "";

            return (
              <div
                key={player.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col relative"
              >
                {/* Badge si déjà invité */}
                {alreadyInvited && (
                  <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm z-10">
                    <Clock className="w-3 h-3 mr-1" /> En attente
                  </div>
                )}

                <div className="p-6 flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-500 shrink-0 border-2 border-white shadow-sm">
                    {player.profilePictureUrl ? (
                      <img
                        src={player.profilePictureUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      player.firstName[0]
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate">
                      {player.firstName} {player.lastName}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {player.locationCity || "Ville inconnue"}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100 capitalize">
                        {player.position || "Polyvalent"}
                      </span>
                      <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-md border border-orange-100 capitalize">
                        {player.skillLevel || "Amateur"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                  {alreadyInvited ? (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">
                        Invité par :{" "}
                        <span className="font-medium">{invitedTeamsText}</span>
                      </p>
                      <button
                        onClick={() => setSelectedPlayer(player)}
                        className="w-full py-2 bg-white border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Inviter avec une autre équipe
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedPlayer(player)}
                      className="w-full py-2 bg-white border border-green-600 text-green-700 font-medium rounded-lg hover:bg-green-600 hover:text-white transition-colors flex items-center justify-center"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Recruter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'Invitation */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Inviter {selectedPlayer.firstName}
              </h3>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {myTeams.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-red-600 mb-4">
                    Vous devez être manager d'une équipe pour recruter.
                  </p>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="text-gray-500 underline"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pour quelle équipe ?
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none appearance-none"
                      >
                        {myTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Avertissement si déjà invité pour cette équipe spécifique */}
                    {selectedPlayer.invitedByTeams &&
                      selectedPlayer.invitedByTeams.includes(
                        myTeams.find((t) => t.id == selectedTeamId)?.name
                      ) && (
                        <p className="text-xs text-yellow-600 mt-2 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Ce joueur a déjà une invitation en attente pour cette
                          équipe.
                        </p>
                      )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                      placeholder={`Bonjour ${selectedPlayer.firstName}, je souhaite t'inviter à rejoindre mon équipe...`}
                    />
                  </div>
                </>
              )}
            </div>

            {myTeams.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInvite}
                  disabled={sending}
                  className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center shadow-lg shadow-green-200 transition disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  Envoyer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerSearch;
