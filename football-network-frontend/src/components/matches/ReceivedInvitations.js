import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  Check,
  X,
  Clock,
} from "lucide-react";
import RespondModal from "./RespondModal";

const ReceivedInvitations = ({ invitations, onRespond, loading }) => {
  const [selectedInvitation, setSelectedInvitation] = useState(null);

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

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucune invitation reçue
        </h3>
        <p className="text-gray-600">
          Les invitations de match que vous recevrez apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {invitations.map((invitation) => {
          const { date, time } = formatDate(invitation.proposedDate);
          const expired = isExpired(invitation.expiresAt);

          return (
            <div
              key={invitation.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                expired ? "opacity-75 bg-gray-50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Invitation de {invitation.senderTeam.name}
                      </h3>
                      <p className="text-gray-600">
                        Capitaine: {invitation.senderTeam.captain.firstName}{" "}
                        {invitation.senderTeam.captain.lastName}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invitation.senderTeam.skillLevel === "beginner"
                            ? "bg-green-100 text-green-800"
                            : invitation.senderTeam.skillLevel === "amateur"
                            ? "bg-blue-100 text-blue-800"
                            : invitation.senderTeam.skillLevel ===
                              "intermediate"
                            ? "bg-yellow-100 text-yellow-800"
                            : invitation.senderTeam.skillLevel === "advanced"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invitation.senderTeam.skillLevel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-2" />
                      <div>
                        <div className="font-medium capitalize">{date}</div>
                        <div className="text-sm">{time}</div>
                      </div>
                    </div>

                    {invitation.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-2" />
                        <div>
                          <div className="font-medium">
                            {invitation.location.name}
                          </div>
                          <div className="text-sm">
                            {invitation.location.address}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {invitation.message && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-start">
                        <MessageSquare className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <p className="text-gray-700 text-sm">
                          {invitation.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {expired && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-800 text-sm">
                        ⚠️ Cette invitation a expiré le{" "}
                        {new Date(invitation.expiresAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!expired && invitation.status === "pending" && (
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() =>
                      setSelectedInvitation({
                        ...invitation,
                        action: "decline",
                      })
                    }
                    className="flex items-center px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Refuser
                  </button>
                  <button
                    onClick={() =>
                      setSelectedInvitation({ ...invitation, action: "accept" })
                    }
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accepter
                  </button>
                </div>
              )}

              {invitation.status !== "pending" && (
                <div className="pt-4 border-t">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      invitation.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {invitation.status === "accepted"
                      ? "✓ Acceptée"
                      : "✗ Refusée"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de réponse */}
      {selectedInvitation && (
        <RespondModal
          invitation={selectedInvitation}
          onClose={() => setSelectedInvitation(null)}
          onRespond={onRespond}
        />
      )}
    </>
  );
};

export default ReceivedInvitations;
