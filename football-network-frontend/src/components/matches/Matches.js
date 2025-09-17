import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Eye,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// 🔹 Fonction utilitaire : formatage de la date
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
    isToday: date.toDateString() === new Date().toDateString(),
    isPast: date < new Date(),
  };
};

// 🔹 Fonction utilitaire : couleurs du statut
const getStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

// 🔹 Fonction utilitaire : libellés du statut
const getStatusLabel = (status) => {
  const labels = {
    pending: "En attente",
    confirmed: "Confirmé",
    completed: "Terminé",
    cancelled: "Annulé",
  };
  return labels[status] || status;
};

const Matches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    loadMatches();
  }, [activeTab]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (activeTab === "upcoming") {
        params.append("upcoming", "true");
        params.append("status", "confirmed");
      } else if (activeTab === "completed") {
        params.append("status", "completed");
      }
      params.append("limit", "20");

      const response = await axios.get(`${API_BASE_URL}/matches?${params}`);
      setMatches(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des matchs");
      console.error("Load matches error:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "upcoming", label: "À venir", icon: Clock },
    { id: "completed", label: "Terminés", icon: Trophy },
    { id: "all", label: "Tous", icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Matchs</h1>
          <p className="text-gray-600 mt-1">
            Consultez vos matchs passés et à venir
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    isActive
                      ? "text-green-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Liste des matchs */}
      {matches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {activeTab === "upcoming"
              ? "Aucun match à venir"
              : activeTab === "completed"
              ? "Aucun match terminé"
              : "Aucun match trouvé"}
          </h3>
          <p className="text-gray-600">
            {activeTab === "upcoming"
              ? "Vos prochains matchs apparaîtront ici une fois confirmés"
              : "L'historique de vos matchs apparaîtra ici"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
};

// 🔹 Composant carte de match
const MatchCard = ({ match }) => {
  const { date, time, isToday, isPast } = formatDate(match.matchDate);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header du match */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                match.status
              )}`}
            >
              {getStatusLabel(match.status)}
            </span>
            {isToday && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                Aujourd'hui
              </span>
            )}
          </div>
          <span className="text-gray-500 text-sm">
            {match.type === "friendly" ? "Match amical" : match.type}
          </span>
        </div>

        {/* Équipes et score */}
        <div className="flex items-center justify-center mb-6">
          <div className="text-center flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {match.homeTeam.name}
            </h3>
            <p className="text-sm text-gray-600">{match.homeTeam.skillLevel}</p>
          </div>

          <div className="mx-6">
            {match.status === "completed" ? (
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {match.score.home} - {match.score.away}
                </div>
                <div className="text-sm text-gray-500">Score final</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">VS</div>
                <div className="text-sm text-gray-500">
                  {isPast ? "Passé" : "À venir"}
                </div>
              </div>
            )}
          </div>

          <div className="text-center flex-1">
            {match.awayTeam ? (
              <>
                <h3 className="text-lg font-bold text-gray-900">
                  {match.awayTeam.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {match.awayTeam.skillLevel}
                </p>
              </>
            ) : (
              <div className="text-gray-500">
                <p className="text-lg">À définir</p>
                <p className="text-sm">Équipe visiteur</p>
              </div>
            )}
          </div>
        </div>

        {/* Informations du match */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-5 h-5 mr-2" />
            <div>
              <div className="font-medium capitalize">{date}</div>
              <div className="text-sm">{time}</div>
            </div>
          </div>

          {match.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <div>
                <div className="font-medium">{match.location.name}</div>
                <div className="text-sm">{match.location.address}</div>
              </div>
            </div>
          )}

          <div className="flex items-center text-gray-600">
            <Users className="w-5 h-5 mr-2" />
            <div>
              <div className="font-medium">Durée</div>
              <div className="text-sm">{match.duration || 90} minutes</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <Link
              to={`/matches/${match.id}`}
              className="flex items-center px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              Détails
            </Link>

            {(match.status === "confirmed" || match.status === "completed") && (
              <Link
                to={`/matches/${match.id}`}
                className="flex items-center px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Link>
            )}
          </div>

          <div className="text-sm text-gray-500">
            Créé le {new Date(match.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matches;
