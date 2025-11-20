import React, { useState } from "react";
import {
  X,
  Trash2,
  AlertTriangle,
  Users,
  Calendar,
  MessageCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const DeleteTeamModal = ({ team, onClose, onConfirmDelete }) => {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmValid = confirmText === team.name;
  const hasMembers = team.currentPlayers > 1;

  const handleDelete = async () => {
    if (!isConfirmValid) return toast.error("Nom incorrect");
    try {
      setDeleting(true);
      await onConfirmDelete();
    } catch (error) {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl ring-1 ring-black/5">
        {/* Header Danger */}
        <div className="bg-red-50 p-6 border-b border-red-100 flex items-start">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-900">
              Supprimer l'équipe ?
            </h2>
            <p className="text-sm text-red-700 mt-1">
              Cette action est définitive et irréversible.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Impact Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Conséquences immédiates
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-400" />{" "}
                {team.currentPlayers} membres seront libérés
              </li>
              <li className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />{" "}
                {team.stats?.matchesPlayed || 0} matchs archivés supprimés
              </li>
              <li className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2 text-gray-400" />{" "}
                Historique du chat effacé
              </li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
              Confirmer le nom :{" "}
              <span className="text-black select-all">"{team.name}"</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white font-medium"
              placeholder="Tapez le nom de l'équipe"
              autoComplete="off"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmValid || deleting}
              className="flex-1 flex items-center justify-center px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-red-500/20 transition-all"
            >
              {deleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Confirmer"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteTeamModal;
