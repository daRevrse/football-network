import React, { useState } from "react";
import { X, Check, MessageSquare, MapPin } from "lucide-react";

const RespondModal = ({ invitation, onClose, onRespond }) => {
  const [responseMessage, setResponseMessage] = useState("");
  const [responding, setResponding] = useState(false);
  const [showBookingInfo, setShowBookingInfo] = useState(false);

  const isAccepting = invitation.action === "accept";
  const hasVenueBooking = invitation.venue && invitation.venueId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponding(true);

    try {
      await onRespond(
        invitation.id,
        isAccepting ? "accepted" : "declined",
        responseMessage.trim() || null
      );
      onClose();
    } catch (error) {
      console.error("Response error:", error);
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3
            className={`text-lg font-semibold ${
              isAccepting ? "text-green-800" : "text-red-800"
            }`}
          >
            {isAccepting ? "Accepter l'invitation" : "Refuser l'invitation"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-3">
              {isAccepting
                ? `Vous allez accepter l'invitation de match avec ${invitation.senderTeam.name}.`
                : `Vous allez refuser l'invitation de match avec ${invitation.senderTeam.name}.`}
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-600">
                <strong>Date proposée:</strong>{" "}
                {new Date(invitation.proposedDate).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {invitation.location && (
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Lieu:</strong> {invitation.location.name}
                </div>
              )}
              {hasVenueBooking && isAccepting && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="text-xs text-green-800">
                      <div className="font-medium mb-1">Terrain déjà réservé</div>
                      <div>Une réservation sera automatiquement créée pour ce terrain lors de l'acceptation.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isAccepting && !hasVenueBooking && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-800">
                    <strong>Rappel:</strong> Aucun terrain n'est encore réservé pour ce match. Vous pourrez en réserver un après l'acceptation.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Message de réponse (optionnel)
            </label>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder={
                isAccepting
                  ? "Excellent ! Nous sommes impatients de jouer contre vous..."
                  : "Désolé, nous ne sommes pas disponibles à cette date..."
              }
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {responseMessage.length}/500 caractères
            </p>
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
              type="submit"
              disabled={responding}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                isAccepting
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              <Check className="w-4 h-4 mr-2" />
              {responding
                ? "En cours..."
                : isAccepting
                ? "Accepter"
                : "Refuser"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RespondModal;
