import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("upcoming"); // upcoming, completed, all

  useEffect(() => {
    loadMatches();
  }, [activeFilter]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter === "upcoming") {
        params.append("upcoming", "true");
        params.append("status", "confirmed");
      }
      if (activeFilter === "completed") params.append("status", "completed");
      params.append("limit", "50");

      const response = await axios.get(`${API_BASE_URL}/matches?${params}`);
      setMatches(response.data);
    } catch (error) {
      toast.error("Erreur chargement matchs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Calendrier des Matchs
          </h1>
          <p className="text-gray-500 mt-1">
            Suivez vos rencontres et organisez vos prochains défis.
          </p>
        </div>
        <Link
          to="/matches/create"
          className="inline-flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" /> Organiser un match
        </Link>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          {["upcoming", "completed", "all"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {filter === "upcoming"
                ? "À venir"
                : filter === "completed"
                ? "Terminés"
                : "Tous"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une équipe..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Aucun match trouvé
          </h3>
          <p className="text-gray-500">
            Vous n'avez aucun match prévu pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map((match) => (
            <MatchListItem key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
};

const MatchListItem = ({ match }) => {
  const date = new Date(match.matchDate);
  const isCompleted = match.status === "completed";

  return (
    <Link
      to={`/matches/${match.id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Status Bar */}
      <div
        className={`h-1.5 w-full ${
          isCompleted ? "bg-gray-200" : "bg-green-500"
        }`}
      ></div>

      <div className="p-6 flex items-center justify-between">
        {/* Home */}
        <div className="flex flex-col items-center w-1/3">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-50 mb-2 flex items-center justify-center border border-gray-100">
            {match.homeTeam.logoUrl ? (
              <img
                src={match.homeTeam.logoUrl}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="font-bold text-gray-400">
                {match.homeTeam.name[0]}
              </span>
            )}
          </div>
          <span className="font-bold text-gray-900 text-center text-sm line-clamp-1">
            {match.homeTeam.name}
          </span>
        </div>

        {/* Center Info */}
        <div className="flex flex-col items-center w-1/3">
          {isCompleted ? (
            <div className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
              {match.score?.home} - {match.score?.away}
            </div>
          ) : (
            <div className="px-3 py-1 bg-gray-100 rounded text-xs font-bold text-gray-500 mb-2">
              {date.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            {date.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </div>

          <div className="flex items-center text-xs text-gray-400">
            <MapPin className="w-3 h-3 mr-1" /> {match.location?.name || "TBD"}
          </div>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center w-1/3">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-50 mb-2 flex items-center justify-center border border-gray-100">
            {match.awayTeam?.logoUrl ? (
              <img
                src={match.awayTeam.logoUrl}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="font-bold text-gray-400">
                {match.awayTeam?.name?.[0] || "?"}
              </span>
            )}
          </div>
          <span className="font-bold text-gray-900 text-center text-sm line-clamp-1">
            {match.awayTeam?.name || "En attente"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default Matches;
