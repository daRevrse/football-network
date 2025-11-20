import React from "react";
import { Users, MapPin, Award, UserPlus, Frown } from "lucide-react";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const SearchResults = ({ teams, loading, onJoinTeam, onLoadMore, hasMore }) => {
  const getSkillLabel = (level) => {
    const map = {
      beginner: "Débutant",
      amateur: "Amateur",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
      semi_pro: "Semi-pro",
    };
    return map[level] || level;
  };

  if (loading && teams.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl h-64 animate-pulse shadow-sm"
          ></div>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Frown className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Aucune équipe trouvée
        </h3>
        <p className="text-gray-500">
          Essayez de modifier vos filtres pour élargir la recherche.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Bannière miniature */}
            <div className="h-24 relative bg-gray-100">
              {team.bannerUrl ? (
                <img
                  src={`${API_BASE_URL.replace("/api", "")}${team.bannerUrl}`}
                  alt="banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              )}

              {/* Logo positionné à cheval */}
              <div className="absolute -bottom-8 left-6">
                <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden">
                  {team.logoUrl ? (
                    <img
                      src={`${API_BASE_URL.replace("/api", "")}${team.logoUrl}`}
                      alt={team.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xl">
                      {team.name[0]}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-10 px-6 pb-6 flex-1 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                  {team.name}
                </h3>
                {team.locationCity && (
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" /> {team.locationCity}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium flex items-center">
                  <Award className="w-3 h-3 mr-1" />{" "}
                  {getSkillLabel(team.skillLevel)}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium flex items-center">
                  <Users className="w-3 h-3 mr-1" /> {team.currentPlayers}/
                  {team.maxPlayers}
                </span>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={() => onJoinTeam(team.id, team.name)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center shadow-lg shadow-indigo-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Rejoindre
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Voir plus d'équipes"}
          </button>
        </div>
      )}
    </>
  );
};

export default SearchResults;
