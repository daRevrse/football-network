import React, { useState } from "react";
import { X, Crown, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const SetCaptainModal = ({ team, onClose, onCaptainSet }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [setting, setSetting] = useState(false);

  // Filtrer uniquement les joueurs (exclure les managers)
  const players = team.members.filter((member) => member.userType === "player");

  const handleSubmit = async () => {
    if (!selectedPlayerId) {
      toast.error("Veuillez sélectionner un joueur");
      return;
    }

    try {
      setSetting(true);
      await axios.post(`${API_BASE_URL}/teams/${team.id}/set-captain`, {
        newCaptainId: selectedPlayerId,
      });

      toast.success("Capitaine désigné avec succès");
      onCaptainSet();
    } catch (error) {
      console.error("Set captain error:", error);
      toast.error(
        error.response?.data?.error || "Erreur lors de la désignation"
      );
    } finally {
      setSetting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center text-white">
            <Crown className="w-6 h-6 mr-3" />
            <div>
              <h2 className="text-lg font-bold">Désigner un capitaine</h2>
              <p className="text-xs text-yellow-100">
                Choisissez un joueur pour diriger l'équipe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {players.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Aucun joueur dans l'équipe. Invitez des joueurs avant de
                désigner un capitaine.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez un joueur pour le désigner comme capitaine de
                l'équipe. Seuls les joueurs peuvent être capitaines.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPlayerId === player.id
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 hover:border-yellow-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            selectedPlayerId === player.id
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {player.firstName?.[0]}
                          {player.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {player.firstName} {player.lastName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center space-x-2">
                            <span>{player.position || "Joueur"}</span>
                            {player.role === "captain" && (
                              <span className="flex items-center text-yellow-600">
                                <Crown className="w-3 h-3 mr-1" />
                                Capitaine actuel
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedPlayerId === player.id && (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {players.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedPlayerId || setting}
              className="px-6 py-2.5 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {setting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Désignation...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Désigner comme capitaine
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetCaptainModal;
