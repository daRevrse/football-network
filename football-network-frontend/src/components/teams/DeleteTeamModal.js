import React, { useState } from "react";
import {
  X,
  Trash2,
  AlertTriangle,
  Users,
  Calendar,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const DeleteTeamModal = ({ team, onClose, onConfirmDelete }) => {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmValid = confirmText === team.name;
  const hasMembers = team.currentPlayers > 1;
  const hasMatches = team.stats?.matchesPlayed > 0;

  const handleDelete = async () => {
    if (!isConfirmValid) {
      toast.error("Veuillez taper le nom exact de l'équipe");
      return;
    }

    try {
      setDeleting(true);
      await onConfirmDelete();
    } catch (error) {
      console.error("Delete error:", error);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Supprimer l'équipe
              </h2>
              <p className="text-sm text-gray-600">
                Cette action est irréversible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Avertissement principal */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Attention - Action irréversible
                </h3>
                <p className="text-sm text-red-700">
                  Vous êtes sur le point de supprimer définitivement l'équipe "
                  {team.name}". Toutes les données associées seront perdues.
                </p>
              </div>
            </div>
          </div>

          {/* Informations sur ce qui sera supprimé */}
          <div className="space-y-3 mb-6">
            <h4 className="font-medium text-gray-900">
              Ce qui sera supprimé :
            </h4>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {team.currentPlayers} membre
                {team.currentPlayers !== 1 ? "s" : ""}
                {hasMembers && " (seront retirés de l'équipe)"}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {team.stats?.matchesPlayed || 0} match
                {(team.stats?.matchesPlayed || 0) !== 1 ? "s" : ""} historique
                {hasMatches && " (données perdues)"}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <MessageCircle className="w-4 h-4 mr-2" />
                Toutes les invitations et messages liés
              </div>
            </div>
          </div>

          {/* Avertissements spéciaux */}
          {(hasMembers || hasMatches) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
                <div className="space-y-2">
                  {hasMembers && (
                    <p className="text-sm text-yellow-800">
                      <strong>Membres actifs :</strong>{" "}
                      {team.currentPlayers - 1} autre
                      {team.currentPlayers > 2 ? "s" : ""}
                      membre{team.currentPlayers > 2 ? "s" : ""} ser
                      {team.currentPlayers > 2 ? "ont" : "a"} automatiquement
                      retiré{team.currentPlayers > 2 ? "s" : ""}
                      de l'équipe.
                    </p>
                  )}
                  {hasMatches && (
                    <p className="text-sm text-yellow-800">
                      <strong>Historique :</strong> Toutes les statistiques et
                      l'historique des matchs seront perdus.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation par saisie */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pour confirmer, tapez le nom de l'équipe :{" "}
              <span className="font-semibold">"{team.name}"</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Nom de l'équipe"
              autoComplete="off"
            />
            {confirmText && !isConfirmValid && (
              <p className="text-red-500 text-sm mt-1">
                Le nom ne correspond pas
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmValid || deleting}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteTeamModal;
