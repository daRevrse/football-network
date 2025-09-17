import React from "react";
import {
  Calendar,
  MapPin,
  MessageSquare,
  Clock,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

const SentInvitations = ({ invitations, loading }) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "accepted":
        return <Check className="w-5 h-5 text-green-500" />;
      case "declined":
        return <X className="w-5 h-5 text-red-500" />;
      case "expired":
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "accepted":
        return "Acceptée";
      case "declined":
        return "Refusée";
      case "expired":
        return "Expirée";
      default:
        return status;
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucune invitation envoyée
        </h3>
        <p className="text-gray-600">
          Commencez par envoyer des invitations de match aux autres équipes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => {
        const { date, time } = formatDate(invitation.proposedDate);

        return (
          <div
            key={invitation.id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Invitation à {invitation.receiverTeam.name}
                </h3>
                <p className="text-gray-600">
                  Capitaine: {invitation.receiverTeam.captain.firstName}{" "}
                  {invitation.receiverTeam.captain.lastName}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {getStatusIcon(invitation.status)}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    invitation.status
                  )}`}
                >
                  {getStatusLabel(invitation.status)}
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
                    <div className="text-sm">{invitation.location.address}</div>
                  </div>
                </div>
              )}
            </div>

            {invitation.message && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <MessageSquare className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                  <p className="text-gray-700 text-sm">{invitation.message}</p>
                </div>
              </div>
            )}

            {invitation.responseMessage && invitation.status !== "pending" && (
              <div
                className={`rounded-lg p-3 mb-4 ${
                  invitation.status === "accepted" ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <h4
                  className={`font-medium text-sm mb-1 ${
                    invitation.status === "accepted"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  Réponse de l'équipe:
                </h4>
                <p
                  className={`text-sm ${
                    invitation.status === "accepted"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {invitation.responseMessage}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-500">
              <span>
                Envoyée le{" "}
                {new Date(invitation.sentAt).toLocaleDateString("fr-FR")}
              </span>
              {invitation.expiresAt && invitation.status === "pending" && (
                <span>
                  Expire le{" "}
                  {new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SentInvitations;
