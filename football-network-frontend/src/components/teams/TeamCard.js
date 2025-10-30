import React, { useState } from "react";
import {
  Users,
  MapPin,
  Star,
  Calendar,
  Settings,
  UserPlus,
  LogOut,
  Crown,
  Trophy,
  TrendingUp,
  Shield,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  MessageCircle,
  Eye,
  Award,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TeamCard = ({ team, onLeaveTeam, isOwner, onEditTeam, onDeleteTeam }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: "text-green-600 bg-green-100 border-green-200",
      amateur: "text-blue-600 bg-blue-100 border-blue-200",
      intermediate: "text-yellow-600 bg-yellow-100 border-yellow-200",
      advanced: "text-orange-600 bg-orange-100 border-orange-200",
      semi_pro: "text-red-600 bg-red-100 border-red-200",
    };
    return colors[level] || "text-gray-600 bg-gray-100 border-gray-200";
  };

  const getSkillLevelLabel = (level) => {
    const labels = {
      beginner: "Débutant",
      amateur: "Amateur",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
      semi_pro: "Semi-pro",
    };
    return labels[level] || level;
  };

  const winPercentage =
    team.stats.matchesPlayed > 0
      ? Math.round((team.stats.matchesWon / team.stats.matchesPlayed) * 100)
      : 0;

  const lossPercentage =
    team.stats.matchesPlayed > 0
      ? Math.round(
          ((team.stats.matchesLost || 0) / team.stats.matchesPlayed) * 100
        )
      : 0;

  const getPerformanceColor = (percentage) => {
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    if (percentage >= 30) return "text-orange-600";
    return "text-red-600";
  };

  const getTeamMood = () => {
    if (team.stats.matchesPlayed === 0)
      return { emoji: "🆕", text: "Nouvelle équipe" };
    if (winPercentage >= 80) return { emoji: "🔥", text: "En feu !" };
    if (winPercentage >= 60) return { emoji: "💪", text: "Forme excellente" };
    if (winPercentage >= 40) return { emoji: "⚖️", text: "Équilibrée" };
    if (winPercentage >= 20) return { emoji: "📈", text: "En progression" };
    return { emoji: "💪", text: "Besoin de motivation" };
  };

  const teamMood = getTeamMood();
  const occupancyPercentage = Math.round(
    (team.currentPlayers / team.maxPlayers) * 100
  );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      {/* Header avec gradient ou bannière */}
      <div className="relative">
        {/* Bannière ou gradient */}
        {team.banner_id ? (
          <div className="h-32 relative overflow-hidden">
            <img
              src={`${API_BASE_URL}/uploads/teams/${team.banner_id}`}
              alt="Bannière"
              className="w-full h-full object-cover"
              style={{
                objectPosition: team.banner_position || "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
          </div>
        ) : (
          <div
            className={`h-32 bg-gradient-to-r ${
              isOwner
                ? "from-yellow-400 via-orange-500 to-red-500"
                : "from-blue-500 via-purple-500 to-indigo-600"
            }`}
          />
        )}

        {/* Menu options pour le capitaine */}
        {isOwner && (
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                  <button
                    onClick={() => {
                      onEditTeam?.(team);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center rounded-t-lg"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier l'équipe
                  </button>
                  <button
                    onClick={() => {
                      onDeleteTeam?.(team);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer l'équipe
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logo et infos principales */}
        <div className="absolute -bottom-10 left-6 right-6">
          <div className="flex items-end space-x-4">
            {/* Logo de l'équipe */}
            {team.logo_id ? (
              <img
                src={`${API_BASE_URL}/uploads/teams/${team.logo_id}`}
                alt={team.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover bg-white"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            )}

            {/* Nom et badges */}
            <div className="flex-1 pb-2">
              <h3 className="text-xl font-bold text-gray-900 flex items-center mb-1">
                {team.name}
                {isOwner && <Crown className="w-5 h-5 ml-2 text-yellow-500" />}
              </h3>
              <div className="flex items-center space-x-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getSkillLevelColor(
                    team.skillLevel
                  )}`}
                >
                  {getSkillLevelLabel(team.skillLevel)}
                </span>
                <span className="text-sm text-gray-600">
                  {teamMood.emoji} {teamMood.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="pt-14 p-6">
        {/* Description */}
        {team.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {team.description}
          </p>
        )}

        {/* Informations rapides */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2 text-green-500" />
            <span>
              {team.currentPlayers}/{team.maxPlayers} joueurs
            </span>
          </div>

          {team.locationCity && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              <span>{team.locationCity}</span>
            </div>
          )}
        </div>

        {/* Barre de progression des membres */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Effectif</span>
            <span className="font-medium">{occupancyPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                occupancyPercentage >= 80
                  ? "bg-red-500"
                  : occupancyPercentage >= 60
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {team.stats.matchesPlayed}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <Trophy className="w-3 h-3 mr-1" />
              Matchs
            </div>
          </div>

          <div className="text-center">
            <div
              className={`text-2xl font-bold ${getPerformanceColor(
                winPercentage
              )}`}
            >
              {team.stats.matchesWon}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Victoires
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {winPercentage}%
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <Target className="w-3 h-3 mr-1" />
              Réussite
            </div>
          </div>

          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                team.stats.averageRating > 0
                  ? "text-yellow-500"
                  : "text-gray-400"
              }`}
            >
              {team.stats.averageRating > 0
                ? team.stats.averageRating.toFixed(1)
                : "-"}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <Star className="w-3 h-3 mr-1" />
              Rating
            </div>
          </div>
        </div>

        {/* Indicateurs de performance */}
        {team.stats.matchesPlayed > 0 && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Forme récente</span>
              <div className="flex space-x-1">
                {/* Simuler les 5 derniers résultats */}
                {[...Array(Math.min(5, team.stats.matchesPlayed))].map(
                  (_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white ${
                        Math.random() > 0.5
                          ? "bg-green-500"
                          : Math.random() > 0.3
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    >
                      {Math.random() > 0.5
                        ? "V"
                        : Math.random() > 0.3
                        ? "N"
                        : "D"}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-semibold">
                    {winPercentage}%
                  </div>
                  <div className="text-gray-500 text-xs">Victoires</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 font-semibold">
                    {team.stats.matchesPlayed -
                      team.stats.matchesWon -
                      (team.stats.matchesLost || 0)}
                  </div>
                  <div className="text-gray-500 text-xs">Nuls</div>
                </div>
                <div className="text-center">
                  <div className="text-red-600 font-semibold">
                    {lossPercentage}%
                  </div>
                  <div className="text-gray-500 text-xs">Défaites</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Actions principales */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to={`/teams/${team.id}`}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir l'équipe
            </Link>

            <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              Matchs
            </button>
          </div>

          {/* Actions secondaires */}
          <div className="flex space-x-2">
            <button className="flex-1 flex items-center justify-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat équipe
            </button>

            {isOwner ? (
              <button
                onClick={() => onEditTeam?.(team)}
                className="flex items-center justify-center px-3 py-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onLeaveTeam(team.id, team.name)}
                className="flex items-center justify-center px-3 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Créée le {new Date(team.createdAt).toLocaleDateString("fr-FR")}
            </span>
            <div className="flex items-center space-x-3">
              {team.stats.matchesPlayed > 0 && (
                <span className="flex items-center">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </span>
              )}
              <span className="flex items-center">
                <Award className="w-3 h-3 mr-1" />
                Niveau {getSkillLevelLabel(team.skillLevel).toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
