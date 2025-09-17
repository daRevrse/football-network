import React from "react";
import { Users, MapPin, Star, UserPlus, Navigation } from "lucide-react";

const SearchResults = ({
  teams,
  loading,
  onJoinTeam,
  onLoadMore,
  hasMoreResults,
  showLoadMore,
}) => {
  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: "text-green-600 bg-green-100",
      amateur: "text-blue-600 bg-blue-100",
      intermediate: "text-yellow-600 bg-yellow-100",
      advanced: "text-orange-600 bg-orange-100",
      semi_pro: "text-red-600 bg-red-100",
    };
    return colors[level] || "text-gray-600 bg-gray-100";
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

  if (teams.length === 0 && !loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucune équipe trouvée
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche ou d'élargir la zone
          géographique
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grille des résultats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => (
          <SearchTeamCard
            key={team.id}
            team={team}
            onJoinTeam={onJoinTeam}
            getSkillLevelColor={getSkillLevelColor}
            getSkillLevelLabel={getSkillLevelLabel}
          />
        ))}

        {/* Skeleton loading cards */}
        {loading &&
          [...Array(6)].map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="bg-white rounded-lg shadow-md p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
      </div>

      {/* Bouton "Charger plus" */}
      {showLoadMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Charger plus d'équipes
          </button>
        </div>
      )}

      {teams.length > 0 && !hasMoreResults && !loading && (
        <div className="text-center py-4">
          <p className="text-gray-600">
            Vous avez vu toutes les équipes disponibles
          </p>
        </div>
      )}
    </div>
  );
};

// Composant carte d'équipe dans les résultats
const SearchTeamCard = ({
  team,
  onJoinTeam,
  getSkillLevelColor,
  getSkillLevelLabel,
}) => {
  const winPercentage =
    team.stats?.matchesPlayed > 0
      ? Math.round((team.stats.matchesWon / team.stats.matchesPlayed) * 100)
      : 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {team.name}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(
                team.skillLevel
              )}`}
            >
              {getSkillLevelLabel(team.skillLevel)}
            </span>
          </div>

          <div className="text-right text-sm text-gray-600">
            <div className="flex items-center mb-1">
              <Users className="w-4 h-4 mr-1" />
              {team.currentPlayers}/{team.maxPlayers}
            </div>
            {team.distance && (
              <div className="flex items-center">
                <Navigation className="w-4 h-4 mr-1" />
                {team.distance} km
              </div>
            )}
          </div>
        </div>

        {/* Captain info */}
        <div className="text-sm text-gray-600 mb-3">
          Capitaine: {team.captain?.firstName} {team.captain?.lastName}
        </div>

        {team.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {team.description}
          </p>
        )}

        {team.locationCity && (
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {team.locationCity}
          </div>
        )}
      </div>

      {/* Stats */}
      {team.stats && (
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {team.stats.matchesPlayed || 0}
              </div>
              <div className="text-xs text-gray-600">Matchs</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {team.stats.matchesWon || 0}
              </div>
              <div className="text-xs text-gray-600">Victoires</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {winPercentage}%
              </div>
              <div className="text-xs text-gray-600">Réussite</div>
            </div>
          </div>

          {team.stats.averageRating > 0 && (
            <div className="mt-3 pt-3 border-t text-center">
              <div className="flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium">
                  {team.stats.averageRating.toFixed(1)}/5
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <div className="p-4 border-t">
        <button
          onClick={() => onJoinTeam(team.id, team.name)}
          disabled={team.currentPlayers >= team.maxPlayers}
          className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
            team.currentPlayers >= team.maxPlayers
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {team.currentPlayers >= team.maxPlayers
            ? "Équipe complète"
            : "Rejoindre"}
        </button>
      </div>
    </div>
  );
};

export default SearchResults;
