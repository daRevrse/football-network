import React from "react";
import { MapPin, Zap, Users, Navigation } from "lucide-react";

const SearchFilters = ({ filters, onFilterChange, onSearch, loading }) => {
  const skillLevels = [
    { value: "", label: "Tous les niveaux" },
    { value: "beginner", label: "Débutant" },
    { value: "amateur", label: "Amateur" },
    { value: "intermediate", label: "Intermédiaire" },
    { value: "advanced", label: "Avancé" },
    { value: "semi_pro", label: "Semi-professionnel" },
  ];

  const radiusOptions = [
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 25, label: "25 km" },
    { value: 50, label: "50 km" },
    { value: 100, label: "100 km" },
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const canUseLocation = filters.userLat && filters.userLng;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Filtres de recherche
      </h3>

      {/* Niveau de compétence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Zap className="inline w-4 h-4 mr-1" />
          Niveau de compétence
        </label>
        <select
          value={filters.skillLevel}
          onChange={(e) => handleFilterChange("skillLevel", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {skillLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {/* Localisation par ville */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          Ville
        </label>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => handleFilterChange("city", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Paris, Lyon, Marseille..."
        />
      </div>

      {/* Géolocalisation */}
      {canUseLocation && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.useLocation}
                onChange={(e) =>
                  handleFilterChange("useLocation", e.target.checked)
                }
                className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                <Navigation className="inline w-4 h-4 mr-1" />
                Recherche par proximité
              </span>
            </label>
          </div>

          {filters.useLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rayon de recherche
              </label>
              <select
                value={filters.radius}
                onChange={(e) =>
                  handleFilterChange("radius", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {radiusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {!canUseLocation && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <Navigation className="inline w-4 h-4 mr-1" />
            Activez la géolocalisation pour rechercher par proximité
          </p>
        </div>
      )}

      {/* Bouton de recherche */}
      <button
        onClick={onSearch}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <Users className="w-4 h-4 mr-2" />
        {loading ? "Recherche..." : "Rechercher"}
      </button>

      {/* Reset filtres */}
      <button
        onClick={() =>
          onFilterChange({
            search: "",
            skillLevel: "",
            city: "",
            useLocation: false,
            radius: 50,
          })
        }
        className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
};

export default SearchFilters;
