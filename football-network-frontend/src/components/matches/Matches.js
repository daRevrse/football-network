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
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";




const Matches = () => {
  const { token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("upcoming"); // upcoming, completed, all
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMatches();
  }, [activeFilter]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (activeFilter === "upcoming") {
        params.upcoming = "true";
        params.status = "planning"; // Matches standard backend status
      } else if (activeFilter === "completed") {
        params.status = "completed";
      }

      const response = await api.get('/matches', { params });
      setMatches(response.data.matches || response.data || []);


    } catch (error) {
      console.error("Error loading matches:", error);
      setError("Erreur lors du chargement des matchs");
      toast.error("Erreur chargement matchs");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les matchs selon la recherche
  const filteredMatches = matches.filter((match) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      match.home_team?.toLowerCase().includes(query) ||
      match.away_team?.toLowerCase().includes(query) ||
      match.homeTeam?.name?.toLowerCase().includes(query) ||
      match.awayTeam?.name?.toLowerCase().includes(query)
    );
  });

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
          className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700 transition-colors"
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
                  ? "bg-white text-emerald-700 shadow-sm border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-900"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <div>
            <p className="text-red-800 font-medium">{error}</p>
            <button
              onClick={loadMatches}
              className="text-red-600 text-sm underline hover:text-red-700 mt-1"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Matches Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Aucun match trouvé
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? "Aucun match ne correspond à votre recherche."
              : "Vous n'avez aucun match prévu pour le moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMatches.map((match) => (
            <MatchListItem key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
};

const MatchListItem = ({ match }) => {
  // Gérer les différents formats de date possibles
  const date = new Date(match.match_date || match.matchDate);
  const isCompleted = match.status === "completed";

  // Gérer les différents formats de noms d'équipe
  const homeTeamName = match.home_team || match.homeTeam?.name || "Équipe domicile";
  const awayTeamName = match.away_team || match.awayTeam?.name || "Équipe extérieure";
  const homeTeamLogo = match.home_team_logo || match.homeTeam?.logo_url || match.homeTeam?.logoUrl;
  const awayTeamLogo = match.away_team_logo || match.awayTeam?.logo_url || match.awayTeam?.logoUrl;

  // Gérer les scores
  const homeScore = match.home_score ?? match.score?.home ?? match.team_score;
  const awayScore = match.away_score ?? match.score?.away ?? match.opponent_score;

  // Gérer la localisation
  const locationName = match.location_name || match.location?.name || match.location || "Lieu à déterminer";

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Terminé</span>;
      case "confirmed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmé</span>;
      case "pending":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">En attente</span>;
      case "cancelled":
      case "refused":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Refusé/Annulé</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{status || "Inconnu"}</span>;
    }
  };

  return (
    <Link
      to={`/matches/${match.id}`}
      className="group bg-white rounded-xl border border-gray-200 hover:border-emerald-500/30 hover:shadow-md transition-all duration-200 flex flex-col p-5"
    >
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          <span className="mx-1">•</span>
          {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div>
          {getStatusBadge(match.status)}
        </div>
      </div>

      {/* Match Up */}
      <div className="flex items-center justify-between flex-1">
        {/* Home */}
        <div className="flex flex-col items-center w-[40%] text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 overflow-hidden shadow-sm shadow-gray-100">
            {homeTeamLogo ? (
              <img src={homeTeamLogo} alt={homeTeamName} className="w-full h-full object-cover" />
            ) : <span className="font-bold text-gray-400">{homeTeamName[0]}</span>}
          </div>

          <span className="font-bold text-gray-900 text-sm">{homeTeamName}</span>
        </div>

        {/* Score/VS */}
        <div className="flex flex-col items-center w-[20%]">
          {isCompleted && homeScore !== null && homeScore !== undefined ? (
            <div className="text-2xl font-black text-gray-900 tracking-tighter">
              {homeScore} <span className="text-gray-300 mx-1">-</span> {awayScore ?? 0}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-500">VS</span>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center w-[40%] text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 overflow-hidden shadow-sm shadow-gray-100">
            {awayTeamLogo ? (
              <img src={awayTeamLogo} alt={awayTeamName} className="w-full h-full object-cover" />
            ) : <span className="font-bold text-gray-400">{awayTeamName?.[0] || "?"}</span>}
          </div>

          <span className="font-bold text-gray-900 text-sm">{awayTeamName}</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-500 font-medium">
          <MapPin className="w-4 h-4 mr-1.5 text-gray-400" /> 
          <span className="truncate max-w-[200px]">{locationName}</span>
        </div>
        <div className="text-emerald-600 font-medium group-hover:translate-x-1 transition-transform flex items-center text-xs">
          Détails <Plus className="w-3 h-3 ml-1" />
        </div>
      </div>
    </Link>
  );
};

export default Matches;
