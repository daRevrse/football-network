import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import MatchChat from "./MatchChat";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const MatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
      setMatch(response.data);
    } catch (error) {
      console.error("Error loading match:", error);
      toast.error("Erreur lors du chargement du match");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Match non trouvé</p>
      </div>
    );
  }

  const { date, time } = formatDate(match.matchDate);
  const isUserInvolved =
    match.userTeamId &&
    (match.homeTeam.id === match.userTeamId ||
      match.awayTeam?.id === match.userTeamId);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>

        {isUserInvolved && (
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showChat
                ? "bg-green-100 text-green-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {showChat ? "Fermer le chat" : "Ouvrir le chat"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Informations principales du match */}
        <div className={showChat ? "xl:col-span-2" : "xl:col-span-3"}>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* En-tête du match */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    match.status
                  )} !text-gray-800`}
                >
                  {getStatusLabel(match.status)}
                </span>
                <span className="text-green-100 text-sm">
                  {match.type === "friendly" ? "Match amical" : match.type}
                </span>
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">
                  {match.homeTeam.name} vs {match.awayTeam?.name || "À définir"}
                </h1>

                {match.status === "completed" && (
                  <div className="text-4xl font-bold mb-4">
                    {match.score.home} - {match.score.away}
                  </div>
                )}

                <div className="flex items-center justify-center space-x-6 text-green-100">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    <div>
                      <div className="capitalize">{date}</div>
                      <div>{time}</div>
                    </div>
                  </div>

                  {match.location && (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <div>
                        <div>{match.location.name}</div>
                        <div className="text-sm">{match.location.city}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Détails des équipes */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Équipe domicile */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {match.homeTeam.name} (Domicile)
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Capitaine:</span>{" "}
                      {match.homeTeam.captain.firstName}{" "}
                      {match.homeTeam.captain.lastName}
                    </div>
                    <div>
                      <span className="font-medium">Niveau:</span>{" "}
                      {match.homeTeam.skillLevel}
                    </div>
                  </div>
                </div>

                {/* Équipe visiteur */}
                {match.awayTeam ? (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      {match.awayTeam.name} (Visiteur)
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Capitaine:</span>{" "}
                        {match.awayTeam.captain.firstName}{" "}
                        {match.awayTeam.captain.lastName}
                      </div>
                      <div>
                        <span className="font-medium">Niveau:</span>{" "}
                        {match.awayTeam.skillLevel}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>Équipe visiteur à définir</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations additionnelles */}
              {(match.location || match.refereeContact || match.notes) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">
                    Informations additionnelles
                  </h3>

                  {match.location && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Lieu</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{match.location.name}</p>
                        <p className="text-gray-600">
                          {match.location.address}
                        </p>
                        {match.location.fieldType && (
                          <p className="text-sm text-gray-500 mt-1">
                            Type: {match.location.fieldType}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {match.refereeContact && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Arbitre
                      </h4>
                      <p className="bg-gray-50 rounded-lg p-3">
                        {match.refereeContact}
                      </p>
                    </div>
                  )}

                  {match.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                      <p className="bg-gray-50 rounded-lg p-3">{match.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat */}
        {showChat && isUserInvolved && (
          <div className="xl:col-span-1">
            <div className="h-96 xl:h-[600px]">
              <MatchChat matchId={matchId} onClose={() => setShowChat(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetails;
