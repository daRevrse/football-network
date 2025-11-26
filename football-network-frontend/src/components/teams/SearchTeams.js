import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Globe, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import SearchFilters from "./SearchFilters";
import SearchResults from "./SearchResults";
import { debounce } from "lodash";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const SearchTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const isManager = user?.userType === "manager";

  // États des filtres
  const [filters, setFilters] = useState({
    search: "",
    skillLevel: "",
    city: "",
    radius: 50,
    useLocation: false,
    userLat: null,
    userLng: null,
    limit: 12,
    offset: 0,
  });

  const [hasMoreResults, setHasMoreResults] = useState(true);

  // Debounce pour la recherche
  const debouncedSearch = useCallback(
    debounce((searchFilters) => {
      searchTeams(searchFilters, true);
    }, 500),
    []
  );

  useEffect(() => {
    searchTeams(filters, true);

    // Géolocalisation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters((prev) => ({
            ...prev,
            userLat: position.coords.latitude,
            userLng: position.coords.longitude,
          }));
        },
        (error) => console.log("Geo error:", error)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasSearched) {
      debouncedSearch({ ...filters, offset: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search,
    filters.skillLevel,
    filters.city,
    filters.useLocation,
    filters.radius,
  ]);

  const searchTeams = async (searchFilters = filters, resetResults = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchFilters.search) params.append("search", searchFilters.search);
      if (searchFilters.skillLevel)
        params.append("skillLevel", searchFilters.skillLevel);
      if (searchFilters.city) params.append("city", searchFilters.city);
      if (searchFilters.useLocation && searchFilters.userLat) {
        params.append("lat", searchFilters.userLat);
        params.append("lng", searchFilters.userLng);
        params.append("radius", searchFilters.radius);
      }
      params.append("limit", searchFilters.limit);
      params.append("offset", searchFilters.offset);

      const [searchResponse, myTeamsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/teams?${params}`),
        axios.get(`${API_BASE_URL}/teams/my`),
      ]);

      const searchResults = searchResponse.data;
      const myTeamIds = new Set(myTeamsResponse.data.map((t) => t.id));
      const filteredTeams = searchResults.filter((t) => !myTeamIds.has(t.id));

      if (resetResults) {
        setTeams(filteredTeams);
      } else {
        setTeams((prev) => [...prev, ...filteredTeams]);
      }

      setHasMoreResults(searchResults.length === searchFilters.limit);
      setTotalResults(
        resetResults
          ? filteredTeams.length
          : teams.length + filteredTeams.length
      );
      setHasSearched(true);
    } catch (error) {
      toast.error("Erreur recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId, teamName) => {
    // Blocage Manager
    if (isManager) {
      toast.error("Les managers ne peuvent pas rejoindre d'autres équipes.");
      return;
    }

    if (!window.confirm(`Rejoindre "${teamName}" ?`)) return;
    try {
      await axios.post(`${API_BASE_URL}/teams/${teamId}/join`);
      toast.success("Demande envoyée !");
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      setTotalResults((prev) => prev - 1);
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur adhésion");
    }
  };

  const handleLoadMore = () => {
    const newOffset = filters.offset + filters.limit;
    setFilters((prev) => ({ ...prev, offset: newOffset }));
    searchTeams({ ...filters, offset: newOffset }, false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl text-center">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-inner">
            <Globe className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {isManager
              ? "Trouvez des adversaires"
              : "Trouvez votre prochaine équipe"}
          </h1>
          <p className="text-indigo-200 text-lg mb-8">
            {isManager
              ? "Recherchez d'autres clubs pour organiser des matchs amicaux ou de compétition."
              : "Rejoignez une communauté de passionnés et participez aux meilleurs matchs de votre région."}
          </p>

          {/* Barre de recherche centrale */}
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full pl-12 pr-4 py-4 bg-white rounded-xl shadow-lg text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-indigo-500/30 outline-none transition-all text-lg"
              placeholder="Rechercher par nom, ville..."
            />
            <Search className="absolute left-4 bottom-4 h-6 w-6 text-indigo-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 px-4 md:px-0">
        {/* Sidebar Filters */}
        <div
          className={`xl:col-span-1 ${
            showFilters ? "block" : "hidden xl:block"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center">
                <SlidersHorizontal className="w-5 h-5 mr-2" /> Filtres
              </h3>
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    skillLevel: "",
                    city: "",
                    useLocation: false,
                  })
                }
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Réinitialiser
              </button>
            </div>
            <SearchFilters
              filters={filters}
              onFilterChange={(newFilters) =>
                setFilters((prev) => ({ ...prev, ...newFilters }))
              }
            />
          </div>
        </div>

        {/* Results Grid */}
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-800 text-lg">
              {totalResults > 0
                ? `${totalResults} équipes trouvées`
                : "Résultats"}
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="xl:hidden flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 shadow-sm"
            >
              <Filter className="w-4 h-4 mr-2" /> Filtres
            </button>
          </div>

          <SearchResults
            teams={teams}
            loading={loading}
            onJoinTeam={handleJoinTeam}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreResults}
            isManager={isManager} // On passe l'info si SearchResults sait l'utiliser (sinon handleJoinTeam protège)
          />
        </div>
      </div>
    </div>
  );
};

export default SearchTeams;
