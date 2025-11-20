import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Calendar,
  Star,
  Settings,
  Search,
  Filter,
  Trophy,
  Shield,
  ArrowUpRight,
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

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("name");

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
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...teams];

    if (searchTerm) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter((team) => team.role === filterRole);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "matches":
          return (b.stats?.matchesPlayed || 0) - (a.stats?.matchesPlayed || 0);
        case "winRate":
          const aRate =
            a.stats?.matchesPlayed > 0
              ? a.stats.matchesWon / a.stats.matchesPlayed
              : 0;
          const bRate =
            b.stats?.matchesPlayed > 0
              ? b.stats.matchesWon / b.stats.matchesPlayed
              : 0;
          return bRate - aRate;
        default:
          return 0;
      }
    });

    setFilteredTeams(filtered);
  };

  // --- Gestionnaires d'événements ---
  const handleTeamCreated = (newTeam) => {
    setTeams((prev) => [newTeam, ...prev]);
    setShowCreateModal(false);
    toast.success("Équipe créée !");
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowEditModal(true);
  };

  const handleTeamUpdated = (updatedTeam) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === updatedTeam.id ? { ...t, ...updatedTeam } : t))
    );
    setShowEditModal(false);
    setSelectedTeam(null);
    toast.success("Équipe mise à jour !");
  };

  const handleDeleteTeam = (team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const handleTeamDeleted = async (teamId) => {
    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}`);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      setShowDeleteModal(false);
      setSelectedTeam(null);
      toast.success("Équipe supprimée");
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  const handleLeaveTeam = async (teamId, teamName) => {
    if (!window.confirm(`Quitter "${teamName}" ?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}/leave`);
      toast.success("Vous avez quitté l'équipe");
      loadMyTeams();
    } catch (error) {
      toast.error("Erreur lors du départ");
    }
  };

  // --- Stats Calculées ---
  const stats = teams.reduce(
    (acc, team) => ({
      totalTeams: acc.totalTeams + 1,
      captainTeams: acc.captainTeams + (team.role === "captain" ? 1 : 0),
      totalMatches: acc.totalMatches + (team.stats?.matchesPlayed || 0),
      totalWins: acc.totalWins + (team.stats?.matchesWon || 0),
    }),
    { totalTeams: 0, captainTeams: 0, totalMatches: 0, totalWins: 0 }
  );
  const winRate =
    stats.totalMatches > 0
      ? Math.round((stats.totalWins / stats.totalMatches) * 100)
      : 0;

  // --- Composants UI ---
  const StatBadge = ({ icon: Icon, value, label, color }) => (
    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
      <div className={`p-2 rounded-lg bg-white/10 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-300 font-medium uppercase tracking-wider">
          {label}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header & Stats Area */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 overflow-hidden shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Shield className="w-8 h-8 mr-3 text-green-400" />
              Mes Équipes
            </h1>
            <p className="text-gray-400 max-w-lg">
              Gérez vos effectifs, consultez vos statistiques et organisez vos
              prochains matchs depuis votre quartier général.
            </p>

            {/* Quick Stats Row */}
            <div className="flex flex-wrap gap-4 mt-6">
              <StatBadge
                icon={Users}
                value={stats.totalTeams}
                label="Équipes"
                color="text-blue-300"
              />
              <StatBadge
                icon={Trophy}
                value={stats.captainTeams}
                label="Capitaine"
                color="text-yellow-300"
              />
              <StatBadge
                icon={Calendar}
                value={stats.totalMatches}
                label="Matchs"
                color="text-green-300"
              />
              <StatBadge
                icon={ArrowUpRight}
                value={`${winRate}%`}
                label="Victoires"
                color="text-purple-300"
              />
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-400 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Créer une équipe
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-20 z-30">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
              placeholder="Rechercher une équipe..."
            />
          </div>

          <div className="flex gap-3">
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer text-sm font-medium text-gray-700"
              >
                <option value="all">Tous les rôles</option>
                <option value="captain">Capitaine</option>
                <option value="player">Joueur</option>
              </select>
            </div>

            <div className="relative min-w-[160px]">
              <Settings className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer text-sm font-medium text-gray-700"
              >
                <option value="name">Nom (A-Z)</option>
                <option value="created">Récents</option>
                <option value="matches">Activité</option>
                <option value="winRate">Performance</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            C'est un peu vide ici
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Vous ne faites partie d'aucune équipe pour le moment. Rejoignez une
            équipe existante ou créez la vôtre pour commencer.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-green-600 font-bold hover:text-green-700 hover:underline"
          >
            Créer ma première équipe &rarr;
          </button>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Aucune équipe ne correspond à votre recherche.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterRole("all");
            }}
            className="text-green-600 font-medium mt-2 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
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
