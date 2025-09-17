import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Calendar,
  Star,
  Settings,
  UserPlus,
  LogOut,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import CreateTeamModal from "./CreateTeamModal";
import EditTeamModal from "./EditTeamModal";
import DeleteTeamModal from "./DeleteTeamModal";
import TeamCard from "./TeamCard";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const MyTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // all, captain, player
  const [sortBy, setSortBy] = useState("name"); // name, created, matches, winRate

  useEffect(() => {
    loadMyTeams();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [teams, searchTerm, filterRole, sortBy]);

  const loadMyTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/teams/my`);
      setTeams(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des équipes");
      console.error("Load teams error:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...teams];

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par rôle
    if (filterRole !== "all") {
      filtered = filtered.filter((team) => team.role === filterRole);
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "matches":
          return (b.stats?.matchesPlayed || 0) - (a.stats?.matchesPlayed || 0);
        case "winRate":
          const aWinRate =
            a.stats?.matchesPlayed > 0
              ? a.stats.matchesWon / a.stats.matchesPlayed
              : 0;
          const bWinRate =
            b.stats?.matchesPlayed > 0
              ? b.stats.matchesWon / b.stats.matchesPlayed
              : 0;
          return bWinRate - aWinRate;
        default:
          return 0;
      }
    });

    setFilteredTeams(filtered);
  };

  const handleTeamCreated = (newTeam) => {
    setTeams((prev) => [newTeam, ...prev]);
    setShowCreateModal(false);
    toast.success("Équipe créée avec succès !");
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowEditModal(true);
  };

  const handleTeamUpdated = (updatedTeam) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === updatedTeam.id ? { ...team, ...updatedTeam } : team
      )
    );
    setShowEditModal(false);
    setSelectedTeam(null);
    toast.success("Équipe mise à jour avec succès !");
  };

  const handleDeleteTeam = (team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const handleTeamDeleted = async (teamId) => {
    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}`);
      setTeams((prev) => prev.filter((team) => team.id !== teamId));
      setShowDeleteModal(false);
      setSelectedTeam(null);
      toast.success("Équipe supprimée avec succès");
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors de la suppression"
      );
    }
  };

  const handleLeaveTeam = async (teamId, teamName) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir quitter l'équipe "${teamName}" ?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}/leave`);
      toast.success("Vous avez quitté l'équipe");
      await loadMyTeams(); // Recharger la liste
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors de la sortie de l'équipe"
      );
    }
  };

  // Statistiques globales
  const totalStats = teams.reduce(
    (acc, team) => {
      return {
        totalTeams: acc.totalTeams + 1,
        captainTeams: acc.captainTeams + (team.role === "captain" ? 1 : 0),
        totalMatches: acc.totalMatches + (team.stats?.matchesPlayed || 0),
        totalWins: acc.totalWins + (team.stats?.matchesWon || 0),
      };
    },
    { totalTeams: 0, captainTeams: 0, totalMatches: 0, totalWins: 0 }
  );

  const globalWinRate =
    totalStats.totalMatches > 0
      ? Math.round((totalStats.totalWins / totalStats.totalMatches) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header avec statistiques */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Équipes</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos équipes et suivez leurs performances
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer une équipe
          </button>
        </div>

        {/* Statistiques globales */}
        {teams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {totalStats.totalTeams}
                  </div>
                  <div className="text-blue-700 text-sm">Équipes</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {totalStats.captainTeams}
                  </div>
                  <div className="text-yellow-700 text-sm">Capitainats</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {totalStats.totalMatches}
                  </div>
                  <div className="text-green-700 text-sm">Matchs joués</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex items-center">
                <Settings className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-900">
                    {globalWinRate}%
                  </div>
                  <div className="text-purple-700 text-sm">
                    Taux de réussite
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtres et recherche */}
      {teams.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Rechercher une équipe..."
                />
              </div>
            </div>

            {/* Filtre par rôle */}
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tous les rôles</option>
                <option value="captain">Capitaine</option>
                <option value="player">Joueur</option>
              </select>
            </div>

            {/* Tri */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="name">Nom A-Z</option>
                <option value="created">Plus récentes</option>
                <option value="matches">Plus de matchs</option>
                <option value="winRate">Meilleur taux</option>
              </select>
            </div>
          </div>

          {/* Résultats de recherche */}
          {(searchTerm || filterRole !== "all") && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                {filteredTeams.length} équipe
                {filteredTeams.length !== 1 ? "s" : ""} trouvée
                {filteredTeams.length !== 1 ? "s" : ""}
                {searchTerm && ` pour "${searchTerm}"`}
                {filterRole !== "all" &&
                  ` (${filterRole === "captain" ? "Capitaine" : "Joueur"})`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Liste des équipes */}
      {teams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune équipe trouvée
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre première équipe pour commencer à organiser des matchs
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center mx-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer ma première équipe
          </button>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun résultat
          </h3>
          <p className="text-gray-600 mb-4">
            Aucune équipe ne correspond à vos critères de recherche
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterRole("all");
            }}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          {/* Compteur et actions rapides */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              Affichage de {filteredTeams.length} équipe
              {filteredTeams.length !== 1 ? "s" : ""} sur {teams.length}
            </div>

            {/* Actions rapides pour les capitaines */}
            {totalStats.captainTeams > 0 && (
              <div className="flex items-center space-x-2">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Exporter les stats
                </button>
                <span className="text-gray-300">•</span>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                  Invitations en masse
                </button>
              </div>
            )}
          </div>

          {/* Grille des équipes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onLeaveTeam={handleLeaveTeam}
                onEditTeam={handleEditTeam}
                onDeleteTeam={handleDeleteTeam}
                isOwner={team.role === "captain"}
              />
            ))}
          </div>

          {/* Pagination si nécessaire */}
          {teams.length > 12 && (
            <div className="mt-8 flex justify-center">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Charger plus d'équipes
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}

      {showEditModal && selectedTeam && (
        <EditTeamModal
          team={selectedTeam}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeam(null);
          }}
          onTeamUpdated={handleTeamUpdated}
        />
      )}

      {showDeleteModal && selectedTeam && (
        <DeleteTeamModal
          team={selectedTeam}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTeam(null);
          }}
          onConfirmDelete={() => handleTeamDeleted(selectedTeam.id)}
        />
      )}
    </div>
  );
};

export default MyTeams;
