import React from "react";
import { MapPin, Trophy, Navigation } from "lucide-react";

const SearchFilters = ({ filters, onFilterChange }) => {
  const handleChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  return (
    <div className="space-y-8">
      {/* Localisation */}
      <div className="space-y-4">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-indigo-500" /> Localisation
        </label>

        {/* Toggle Géolocalisation */}
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={filters.useLocation}
              onChange={(e) => handleChange("useLocation", e.target.checked)}
              disabled={!filters.userLat}
            />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors flex items-center">
            Autour de moi <Navigation className="w-3 h-3 ml-1.5 inline" />
          </span>
        </label>

        {/* Ville (si pas de géo) */}
        {!filters.useLocation && (
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Ville (ex: Paris)"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        )}

        {/* Rayon Slider */}
        {filters.useLocation && (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Rayon</span>
              <span className="font-bold text-indigo-600">
                {filters.radius} km
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={filters.radius}
              onChange={(e) => handleChange("radius", parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        )}
      </div>

      <hr className="border-gray-100" />

      {/* Niveau */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
          <Trophy className="w-4 h-4 mr-2 text-yellow-500" /> Niveau
        </label>
        <div className="space-y-2">
          {[
            { val: "", label: "Tous les niveaux" },
            { val: "beginner", label: "Débutant" },
            { val: "amateur", label: "Amateur" },
            { val: "intermediate", label: "Intermédiaire" },
            { val: "advanced", label: "Avancé" },
            { val: "semi_pro", label: "Semi-Pro" },
          ].map((opt) => (
            <label key={opt.val} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="skillLevel"
                checked={filters.skillLevel === opt.val}
                onChange={() => handleChange("skillLevel", opt.val)}
                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-600">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
