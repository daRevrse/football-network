import React, { useState } from "react";
import {
  Users,
  MapPin,
  Star,
  Calendar,
  Settings,
  LogOut,
  Crown,
  Trophy,
  MoreVertical,
  Edit,
  Trash2,
  MessageCircle,
  Eye,
  Target,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TeamCard = ({ team, onLeaveTeam, isOwner, onEditTeam, onDeleteTeam }) => {
  const [showMenu, setShowMenu] = useState(false);

  // --- Helpers de style ---
  const getSkillColor = (level) => {
    const colors = {
      beginner: "bg-green-100 text-green-700 border-green-200",
      amateur: "bg-blue-100 text-blue-700 border-blue-200",
      intermediate: "bg-purple-100 text-purple-700 border-purple-200",
      advanced: "bg-orange-100 text-orange-700 border-orange-200",
      semi_pro: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[level] || "bg-gray-100 text-gray-600";
  };

  const winRate =
    team.stats.matchesPlayed > 0
      ? Math.round((team.stats.matchesWon / team.stats.matchesPlayed) * 100)
      : 0;

  const occupancy = Math.round((team.currentPlayers / team.maxPlayers) * 100);
  const occupancyColor =
    occupancy >= 90
      ? "bg-red-500"
      : occupancy >= 70
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:-translate-y-1">
      {/* --- Header Banner --- */}
      <div className="h-28 relative">
        {team.bannerUrl ? (
          <img
            src={`${API_BASE_URL.replace("/api", "")}${team.bannerUrl}`}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-r ${
              isOwner
                ? "from-green-600 to-emerald-800"
                : "from-blue-600 to-indigo-800"
            }`}
          >
            <div className="absolute inset-0 bg-black/10 pattern-grid-lg opacity-20"></div>
          </div>
        )}

        {/* Badges Absolus */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm ${getSkillColor(
              team.skillLevel
            )}`}
          >
            {team.skillLevel}
          </span>
        </div>

        {/* Menu Options (Owner Only) */}
        {isOwner && (
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-md transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      onEditTeam?.(team);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2 text-blue-500" /> Modifier
                  </button>
                  <button
                    onClick={() => {
                      onDeleteTeam?.(team);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 px-5 pt-12 pb-5 relative">
        {/* Logo Flottant */}
        <div className="absolute -top-10 left-5">
          <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden relative z-10">
            {team.logoUrl ? (
              <img
                src={`${API_BASE_URL.replace("/api", "")}${team.logoUrl}`}
                alt={team.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Shield className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Titre & Ville */}
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1 flex items-center">
                {team.name}
                {isOwner && (
                  <Crown className="w-4 h-4 ml-1.5 text-yellow-500 fill-current" />
                )}
              </h3>
              <p className="text-sm text-gray-500 flex items-center mt-0.5">
                <MapPin className="w-3.5 h-3.5 mr-1" />{" "}
                {team.locationCity || "Non localisé"}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-lg font-bold ${
                  winRate >= 50 ? "text-green-600" : "text-gray-600"
                }`}
              >
                {winRate}%
              </div>
              <div className="text-[10px] text-gray-400 uppercase font-medium">
                Victoires
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-5 bg-gray-50 rounded-xl p-3">
          <div className="text-center">
            <div className="text-sm font-bold text-gray-900">
              {team.stats.matchesPlayed}
            </div>
            <div className="text-[10px] text-gray-500">Matchs</div>
          </div>
          <div className="text-center border-l border-gray-200">
            <div className="text-sm font-bold text-gray-900">
              {team.currentPlayers}
            </div>
            <div className="text-[10px] text-gray-500">Joueurs</div>
          </div>
          <div className="text-center border-l border-gray-200">
            <div className="text-sm font-bold text-gray-900 flex items-center justify-center">
              {team.stats.averageRating > 0
                ? team.stats.averageRating.toFixed(1)
                : "-"}{" "}
              <Star className="w-3 h-3 text-yellow-400 ml-1 fill-current" />
            </div>
            <div className="text-[10px] text-gray-500">Note</div>
          </div>
        </div>

        {/* Jauge Effectif */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Remplissage</span>
            <span className="font-medium">
              {team.currentPlayers}/{team.maxPlayers}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${occupancyColor} transition-all duration-500`}
              style={{ width: `${occupancy}%` }}
            ></div>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/teams/${team.id}`}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" /> Voir
          </Link>

          <button
            className="flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Chat"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          {isOwner ? (
            <button
              onClick={() => onEditTeam?.(team)}
              className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="Paramètres"
            >
              <Settings className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onLeaveTeam(team.id, team.name)}
              className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              title="Quitter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
