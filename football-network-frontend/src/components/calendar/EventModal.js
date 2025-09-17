import React from "react";
import {
  X,
  Calendar,
  MapPin,
  Users,
  Clock,
  Trophy,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const EventModal = ({ event, onClose }) => {
  const formatDateTime = (date) => {
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
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
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

  const { date, time } = formatDateTime(event.date);
  const match = event.data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(
                event.status
              )}`}
            >
              {getStatusLabel(event.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Date et heure */}
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <div className="font-medium capitalize">{date}</div>
              <div className="text-gray-600">{time}</div>
            </div>
          </div>

          {/* Lieu */}
          {event.location && (
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium">{event.location.name}</div>
                <div className="text-gray-600">{event.location.address}</div>
              </div>
            </div>
          )}

          {/* Équipes */}
          {match && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Équipes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="font-medium text-lg">
                    {match.homeTeam.name}
                  </div>
                  <div className="text-sm text-gray-600">Domicile</div>
                  <div className="text-sm text-gray-500">
                    {match.homeTeam.skillLevel}
                  </div>
                </div>

                <div className="text-center">
                  {match.awayTeam ? (
                    <>
                      <div className="font-medium text-lg">
                        {match.awayTeam.name}
                      </div>
                      <div className="text-sm text-gray-600">Visiteur</div>
                      <div className="text-sm text-gray-500">
                        {match.awayTeam.skillLevel}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">
                      <div>À définir</div>
                      <div className="text-sm">Équipe visiteur</div>
                    </div>
                  )}
                </div>
              </div>

              {match.status === "completed" && (
                <div className="text-center mt-4 pt-4 border-t">
                  <div className="text-2xl font-bold">
                    {match.score.home} - {match.score.away}
                  </div>
                  <div className="text-sm text-gray-600">Score final</div>
                </div>
              )}
            </div>
          )}

          {/* Durée */}
          {match && (
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium">Durée</div>
                <div className="text-gray-600">
                  {match.duration || 90} minutes
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {match?.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-gray-700">{match.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex space-x-3">
          {match && (
            <>
              <Link
                to={`/matches/${match.id}`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Voir détails
              </Link>

              {(match.status === "confirmed" ||
                match.status === "completed") && (
                <Link
                  to={`/matches/${match.id}`}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Link>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
