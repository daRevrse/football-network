import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  MapPin,
  Users,
  Star,
  UserPlus,
  Map,
} from "lucide-react";
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);

  // Debounce pour la recherche en temps réel
  const debouncedSearch = useCallback(
    debounce((searchFilters) => {
      searchTeams(searchFilters, true);
    }, 500),
    []
  );

  useEffect(() => {
    // Recherche initiale avec filtres par défaut
    searchTeams(filters, true);

    // Demander la géolocalisation si le navigateur le supporte
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters((prev) => ({
            ...prev,
            userLat: position.coords.latitude,
            userLng: position.coords.longitude,
          }));
        },
        (error) => {
          console.log("Geolocation not available:", error);
        }
      );
    }
  }, []);

  // Effect pour la recherche automatique quand les filtres changent
  useEffect(() => {
    if (hasSearched) {
      debouncedSearch({ ...filters, offset: 0 });
      setCurrentPage(1);
    }
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
      if (resetResults) {
        setTeams([]);
      }

      const params = new URLSearchParams();

      if (searchFilters.search) params.append("search", searchFilters.search);
      if (searchFilters.skillLevel)
        params.append("skillLevel", searchFilters.skillLevel);
      if (searchFilters.city) params.append("city", searchFilters.city);
      if (
        searchFilters.useLocation &&
        searchFilters.userLat &&
        searchFilters.userLng
      ) {
        params.append("lat", searchFilters.userLat);
        params.append("lng", searchFilters.userLng);
        params.append("radius", searchFilters.radius);
      }
      params.append("limit", searchFilters.limit);
      params.append("offset", searchFilters.offset);

      // Récupérer les équipes de recherche et les équipes de l'utilisateur en parallèle
      const [searchResponse, myTeamsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/teams?${params}`),
        axios.get(`${API_BASE_URL}/teams/my`),
      ]);

      const searchResults = searchResponse.data;
      const myTeamIds = new Set(myTeamsResponse.data.map((team) => team.id));

      // Filtrer les équipes où l'utilisateur est déjà membre
      const filteredTeams = searchResults.filter(
        (team) => !myTeamIds.has(team.id)
      );

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
      toast.error("Erreur lors de la recherche");
      console.error("Search teams error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      offset: 0,
    }));
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    const newOffset = currentPage * filters.limit;
    setFilters((prev) => ({ ...prev, offset: newOffset }));
    setCurrentPage((prev) => prev + 1);
    searchTeams({ ...filters, offset: newOffset }, false);
  };

  const handleJoinTeam = async (teamId, teamName) => {
    if (!window.confirm(`Voulez-vous rejoindre l'équipe "${teamName}" ?`)) {
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/teams/${teamId}/join`);
      toast.success("Vous avez rejoint l'équipe !");

      // Retirer l'équipe de la liste des résultats
      setTeams((prev) => prev.filter((team) => team.id !== teamId));
      setTotalResults((prev) => prev - 1);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Erreur lors de l'inscription";

      if (errorMessage.includes("Already a member")) {
        toast.error("Vous êtes déjà membre de cette équipe");
        // Retirer l'équipe de la liste car l'utilisateur en est déjà membre
        setTeams((prev) => prev.filter((team) => team.id !== teamId));
        setTotalResults((prev) => prev - 1);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header avec barre de recherche */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Rechercher des équipes
            </h1>
            <p className="text-gray-600 mt-1">
              Trouvez des équipes à rejoindre près de chez vous
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="relative lg:w-96">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Rechercher par nom d'équipe..."
            />
          </div>
        </div>

        {/* Bouton filtres et résultats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres avancés
          </button>

          {hasSearched && (
            <p className="text-gray-600">
              {totalResults} équipe{totalResults !== 1 ? "s" : ""} trouvée
              {totalResults !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Panneau des filtres */}
        {showFilters && (
          <div className="xl:col-span-1">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={() => searchTeams({ ...filters, offset: 0 }, true)}
              loading={loading}
            />
          </div>
        )}

        {/* Résultats */}
        <div className={`${showFilters ? "xl:col-span-3" : "xl:col-span-4"}`}>
          {!hasSearched && !loading ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Recherchez des équipes à rejoindre
              </h3>
              <p className="text-gray-600">
                Utilisez la barre de recherche ou les filtres pour trouver des
                équipes
              </p>
            </div>
          ) : (
            <SearchResults
              teams={teams}
              loading={loading}
              onJoinTeam={handleJoinTeam}
              onLoadMore={handleLoadMore}
              hasMoreResults={hasMoreResults}
              showLoadMore={teams.length > 0 && hasMoreResults && !loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchTeams;
