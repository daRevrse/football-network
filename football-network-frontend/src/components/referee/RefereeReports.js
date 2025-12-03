import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Clock,
  MessageSquare,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const RefereeReports = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      // On charge tous les matchs et on extrait les incidents
      const response = await axios.get(
        `${API_BASE_URL}/referee/matches/my-matches`
      );
      const matches = response.data || [];

      // Pour chaque match, charger les incidents
      const allIncidents = [];
      for (const match of matches) {
        try {
          const incidentsResponse = await axios.get(
            `${API_BASE_URL}/matches/${match.id}/incidents`
          );
          const matchIncidents = (incidentsResponse.data || []).map((inc) => ({
            ...inc,
            match_info: {
              id: match.id,
              home_team_name: match.home_team_name,
              away_team_name: match.away_team_name,
              match_date: match.match_date,
            },
          }));
          allIncidents.push(...matchIncidents);
        } catch (error) {
          console.error(`Erreur incidents match ${match.id}:`, error);
        }
      }

      setIncidents(allIncidents.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      ));
    } catch (error) {
      console.error("Erreur lors du chargement des rapports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIncidentIcon = (type) => {
    const iconConfig = {
      yellow_card: { icon: AlertTriangle, color: "text-yellow-500" },
      red_card: { icon: XCircle, color: "text-red-500" },
      injury: { icon: User, color: "text-orange-500" },
      other: { icon: MessageSquare, color: "text-blue-500" },
    };
    const config = iconConfig[type] || iconConfig.other;
    const Icon = config.icon;
    return <Icon className={`w-5 h-5 ${config.color}`} />;
  };

  const getIncidentLabel = (type) => {
    const labels = {
      yellow_card: "Carton Jaune",
      red_card: "Carton Rouge",
      injury: "Blessure",
      goal: "But",
      substitution: "Remplacement",
      other: "Autre",
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilteredIncidents = () => {
    if (filter === "all") return incidents;
    return incidents.filter((inc) => inc.incident_type === filter);
  };

  const filteredIncidents = getFilteredIncidents();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-purple-600" />
              Rapports d'Incidents
            </h1>
            <p className="text-gray-600 mt-2">
              Consultez tous les incidents rapportés lors de vos matchs
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-3xl font-bold text-purple-600">
              {incidents.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tous ({incidents.length})
        </button>
        <button
          onClick={() => setFilter("yellow_card")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "yellow_card"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Cartons Jaunes (
          {incidents.filter((i) => i.incident_type === "yellow_card").length})
        </button>
        <button
          onClick={() => setFilter("red_card")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "red_card"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Cartons Rouges (
          {incidents.filter((i) => i.incident_type === "red_card").length})
        </button>
        <button
          onClick={() => setFilter("injury")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "injury"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Blessures ({incidents.filter((i) => i.incident_type === "injury").length}
          )
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">
                Cartons Jaunes
              </p>
              <p className="text-2xl font-bold text-yellow-700">
                {incidents.filter((i) => i.incident_type === "yellow_card").length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Cartons Rouges</p>
              <p className="text-2xl font-bold text-red-700">
                {incidents.filter((i) => i.incident_type === "red_card").length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Blessures</p>
              <p className="text-2xl font-bold text-orange-700">
                {incidents.filter((i) => i.incident_type === "injury").length}
              </p>
            </div>
            <User className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Autres</p>
              <p className="text-2xl font-bold text-blue-700">
                {incidents.filter((i) => i.incident_type === "other").length}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Liste des incidents */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun incident
          </h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "Vous n'avez rapporté aucun incident pour le moment."
              : `Aucun incident de type "${getIncidentLabel(filter)}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">{getIncidentIcon(incident.incident_type)}</div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {getIncidentLabel(incident.incident_type)}
                      </h3>
                      {incident.minute_occurred && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                          {incident.minute_occurred}'
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/matches/${incident.match_info?.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block"
                    >
                      {incident.match_info?.home_team_name} vs{" "}
                      {incident.match_info?.away_team_name || "TBD"}
                    </Link>

                    {incident.player_name && (
                      <p className="text-gray-700 mb-2">
                        <span className="font-medium">Joueur:</span>{" "}
                        {incident.player_name}
                      </p>
                    )}

                    {incident.team_name && (
                      <p className="text-gray-600 mb-2">
                        <span className="font-medium">Équipe:</span>{" "}
                        {incident.team_name}
                      </p>
                    )}

                    {incident.description && (
                      <p className="text-gray-600 mb-3">{incident.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(incident.created_at)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(incident.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RefereeReports;
