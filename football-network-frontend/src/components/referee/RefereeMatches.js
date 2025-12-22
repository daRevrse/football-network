import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldUser,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const RefereeMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, completed

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/referee/matches/my-matches`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // S'assurer que response.data est bien un tableau
      const matchesData = Array.isArray(response.data)
        ? response.data
        : response.data?.matches || [];
      setMatches(matchesData);
    } catch (error) {
      console.error("Erreur lors du chargement des matchs:", error);
      setMatches([]); // Mettre un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };


  const getFilteredMatches = () => {
    const now = new Date();
    switch (filter) {
      case "upcoming":
        return matches.filter(
          (m) => ["pending", "confirmed"].includes(m.status) && new Date(m.matchDate) > now
        );
      case "completed":
        return matches.filter((m) => m.status === "completed");
      default:
        return matches;
    }
  };

  const filteredMatches = getFilteredMatches();

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmé", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "En cours", color: "bg-green-100 text-green-800" },
      completed: { label: "Terminé", color: "bg-gray-100 text-gray-800" },
      cancelled: { label: "Annulé", color: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos matchs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShieldUser className="w-8 h-8 mr-3 text-blue-600" />
              Mes Matchs
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez vos matchs assignés et validez les scores
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Total matchs</p>
            <p className="text-3xl font-bold text-gray-900">{matches.length}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-sm text-blue-600 mb-1">À venir</p>
            <p className="text-3xl font-bold text-blue-700">
              {matches.filter((m) => ["pending", "confirmed"].includes(m.status) && new Date(m.matchDate) > new Date()).length}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <p className="text-sm text-green-600 mb-1">Validés</p>
            <p className="text-3xl font-bold text-green-700">
              {matches.filter((m) => m.isRefereeVerified).length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
            <p className="text-sm text-orange-600 mb-1">En attente</p>
            <p className="text-3xl font-bold text-orange-700">
              {matches.filter((m) => m.status === "completed" && !m.isRefereeVerified).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tous ({matches?.length})
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "upcoming"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          À venir (
          {
            matches?.filter(
              (m) =>
                ["pending", "confirmed"].includes(m.status) && new Date(m.matchDate) > new Date()
            ).length
          }
          )
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "completed"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Terminés ({matches?.filter((m) => m.status === "completed").length})
        </button>
      </div>

      {/* Liste des matchs */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun match trouvé
          </h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "Vous n'avez aucun match assigné pour le moment."
              : `Aucun match ${
                  filter === "upcoming" ? "à venir" : "terminé"
                } pour le moment.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredMatches.map((match) => {
            return (
              <div
                key={match.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Informations match */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {getStatusBadge(match.status)}
                      {match.isRefereeVerified && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validé par arbitre
                        </span>
                      )}
                      {match.hasConsensus && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Consensus atteint
                        </span>
                      )}
                      {match.hasDispute && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Désaccord sur le score
                        </span>
                      )}
                    </div>

                    {/* Équipes */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-1 text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {match.homeTeam?.name || "Équipe A"}
                        </p>
                        <p className="text-sm text-gray-500">Domicile</p>
                      </div>
                      <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
                        <span className="text-2xl font-bold text-gray-900">
                          {match.score?.home ?? "-"}
                        </span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {match.score?.away ?? "-"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-900">
                          {match.awayTeam?.name || "À définir"}
                        </p>
                        <p className="text-sm text-gray-500">Extérieur</p>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        {formatDate(match.matchDate)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        {formatTime(match.matchDate)}
                      </div>
                      {match.location?.name && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                          {match.location.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    {/* Validation du score - Uniquement si le match est terminé */}
                    {match.status === "completed" && !match.isRefereeVerified && (
                      <Link
                        to={`/referee/matches/${match.id}/validate`}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Valider score
                      </Link>
                    )}

                    {/* Bouton Détails pour tous les matchs */}
                    <Link
                      to={`/matches/${match.id}`}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Voir détails
                    </Link>

                    {/* Rapport arbitre - Si match terminé et validé */}
                    {match.status === "completed" && match.isRefereeVerified && (
                      <Link
                        to={`/referee/matches/${match.id}/report`}
                        className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Voir rapport
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RefereeMatches;
