// src/components/teams/TeamDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  MapPin,
  Crown,
  Calendar,
  Trophy,
  Star,
  Settings,
  UserPlus,
  UserMinus,
  MessageCircle,
  Edit,
  Trash2,
  TrendingUp,
  Target,
  Shield,
  Activity,
  Award,
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Image,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import EditTeamModal from "./EditTeamModal";
import DeleteTeamModal from "./DeleteTeamModal";
import InvitePlayerModal from "./InvitePlayerModal";
import TeamInvitations from "./TeamInvitations";
import TeamMediaManager from "./TeamMediaManager";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TeamDetails = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMenu, setShowMenu] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (teamId) {
      loadTeamDetails();
      loadTeamMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const loadTeamDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/teams/${teamId}`);
      setTeam(response.data);
      console.log("response", response.data);
    } catch (error) {
      console.error("Error loading team details:", error);
      toast.error("Erreur lors du chargement de l'équipe");
      navigate("/teams");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMatches = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/matches?teamId=${teamId}&limit=50`
      );
      setMatches(response.data);
      console.log("responseMatches", response.data);
    } catch (error) {
      console.error("Error loading team matches:", error);
    }
  };

  const handleLeaveTeam = async () => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir quitter l'équipe "${team?.name}" ?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}/leave`);
      toast.success("Vous avez quitté l'équipe");
      navigate("/teams");
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de la sortie");
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Supprimer ${memberName} de l'équipe ?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`);
      toast.success(`${memberName} a été retiré de l'équipe`);
      await loadTeamDetails();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors de la suppression"
      );
    }
  };

  const handleTeamUpdated = (updatedData) => {
    setTeam((prev) => ({ ...prev, ...updatedData }));
    setShowEditModal(false);
  };

  const handleTeamDeleted = () => {
    toast.success("Équipe supprimée avec succès");
    navigate("/teams");
  };

  const isOwner = team?.userRole === "captain";
  const isMember = team?.userRole != null;

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: Trophy },
    { id: "members", label: "Membres", icon: Users },
    { id: "matches", label: "Matchs", icon: Calendar },
    { id: "stats", label: "Statistiques", icon: TrendingUp },
    { id: "media", label: "Médias", icon: Image }, // 👈 NOUVEAU
    ...(isOwner
      ? [{ id: "invitations", label: "Invitations", icon: UserPlus }]
      : []),
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Équipe non trouvée</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Bouton retour */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/teams")}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux équipes
        </button>
      </div>

      {/* ==================== HEADER AVEC BANNIÈRE ET LOGO ==================== */}
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {/* Bannière */}
        {team.banner_id ? (
          <div className="h-48 relative overflow-hidden">
            <img
              src={`${API_BASE_URL}/uploads/teams/${team.banner_id}`}
              alt="Bannière"
              className="w-full h-full object-cover"
              style={{
                objectPosition: team.banner_position || "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          </div>
        ) : (
          <div
            className={`h-48 relative bg-gradient-to-r ${
              isOwner
                ? "from-yellow-400 via-orange-500 to-red-500"
                : "from-blue-500 via-purple-500 to-indigo-600"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
          </div>
        )}

        {/* Logo + Infos + Menu */}
        <div className="relative px-8 pb-6">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="flex items-end space-x-6">
              {/* Logo */}
              <div className="relative">
                {team.logo_id ? (
                  <img
                    src={`${API_BASE_URL}/uploads/teams/${team.logo_id}`}
                    alt="Logo"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
                ) : (
                  <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <Shield className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {team.verified && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-1">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Nom et description */}
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
                  {team.name}
                  {isOwner && (
                    <Crown className="w-7 h-7 ml-3 text-yellow-500" />
                  )}
                </h1>
                {team.description && (
                  <p className="text-gray-600 mb-2 max-w-2xl">
                    {team.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {team.locationCity && (
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {team.locationCity}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {team.currentPlayers}/{team.maxPlayers} joueurs
                  </span>
                  <span className="flex items-center">
                    <Trophy className="w-4 h-4 mr-1" />
                    {getSkillLevelLabel(team.skillLevel)}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu actions */}
            {isMember && (
              <div className="relative pb-2">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <MoreVertical className="w-4 h-4 mr-2" />
                  Actions
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                    {isOwner ? (
                      <>
                        <button
                          onClick={() => {
                            setShowEditModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center rounded-t-lg"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier l'équipe
                        </button>
                        <button
                          onClick={() => {
                            setShowInviteModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Inviter un joueur
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            setShowDeleteModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center rounded-b-lg"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer l'équipe
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          handleLeaveTeam();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center rounded-lg"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Quitter l'équipe
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {team.stats?.matchesPlayed || 0}
              </div>
              <div className="text-sm text-gray-600">Matchs joués</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {team.stats?.matchesWon || 0}
              </div>
              <div className="text-sm text-gray-600">Victoires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {team.stats?.matchesPlayed > 0
                  ? Math.round(
                      (team.stats.matchesWon / team.stats.matchesPlayed) * 100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Taux victoire</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {team.stats?.averageRating > 0
                  ? team.stats.averageRating.toFixed(1)
                  : "-"}
              </div>
              <div className="text-sm text-gray-600">Rating moyen</div>
            </div>
          </div>
        </div>

        {/* ==================== ONGLETS ==================== */}
        <div className="border-b">
          <nav className="flex space-x-8 px-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`-ml-0.5 mr-2 h-5 w-5 ${
                      isActive ? "text-green-500" : "text-gray-400"
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ==================== CONTENU DES ONGLETS ==================== */}
        <div className="p-8">
          {activeTab === "overview" && <OverviewTab team={team} />}

          {activeTab === "members" && (
            <MembersTab
              team={team}
              isOwner={isOwner}
              onRemoveMember={handleRemoveMember}
              onInvitePlayer={() => setShowInviteModal(true)}
            />
          )}

          {activeTab === "matches" && (
            <MatchesTab matches={matches} team={team} />
          )}

          {activeTab === "stats" && <StatsTab team={team} matches={matches} />}

          {/* 👇 NOUVEAU ONGLET MÉDIAS */}
          {activeTab === "media" && (
            <TeamMediaManager
              team={team}
              isCapta={isOwner}
              onUpdate={loadTeamDetails}
            />
          )}

          {activeTab === "invitations" && isOwner && (
            <TeamInvitations teamId={team.id} teamName={team.name} />
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}
      {showEditModal && (
        <EditTeamModal
          team={team}
          onClose={() => setShowEditModal(false)}
          onTeamUpdated={handleTeamUpdated}
        />
      )}

      {showDeleteModal && (
        <DeleteTeamModal
          team={team}
          onClose={() => setShowDeleteModal(false)}
          onConfirmDelete={handleTeamDeleted}
        />
      )}

      {showInviteModal && (
        <InvitePlayerModal
          team={team}
          onClose={() => setShowInviteModal(false)}
          onPlayerInvited={() => {
            setShowInviteModal(false);
            loadTeamDetails();
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// Utilitaires
// ==========================================
const getSkillLevelLabel = (level) => {
  const labels = {
    beginner: "débutant",
    amateur: "amateur",
    intermediate: "intermédiaire",
    advanced: "avancé",
    semi_pro: "semi-pro",
  };
  return labels[level] || level || "-";
};

// ==========================================
// OverviewTab
// ==========================================
const OverviewTab = ({ team }) => {
  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Informations générales
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Niveau:</span>
              <span className="font-medium capitalize">
                {getSkillLevelLabel(team.skillLevel)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Capacité:</span>
              <span className="font-medium">
                {team.currentPlayers}/{team.maxPlayers} joueurs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Créée le:</span>
              <span className="font-medium">
                {team.createdAt
                  ? new Date(team.createdAt).toLocaleDateString("fr-FR")
                  : "-"}
              </span>
            </div>
            {team.locationCity && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ville:</span>
                <span className="font-medium">{team.locationCity}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            Capitaine
          </h3>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {team.captain?.firstName?.[0] || "-"}
              {team.captain?.lastName?.[0] || "-"}
            </div>
            <div>
              <p className="font-semibold">
                {team.captain?.firstName} {team.captain?.lastName}
              </p>
              <p className="text-gray-600 text-sm">{team.captain?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Performances de l'équipe
        </h3>

        {team.stats?.matchesPlayed > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {team.stats.matchesPlayed}
              </div>
              <div className="text-gray-600">Matchs joués</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {team.stats.matchesWon}
              </div>
              <div className="text-gray-600">Victoires</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {team.stats.matchesDrawn || 0}
              </div>
              <div className="text-gray-600">Matchs nuls</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {team.stats.matchesLost || 0}
              </div>
              <div className="text-gray-600">Défaites</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Aucun match joué pour le moment</p>
            <p className="text-sm">
              Les statistiques apparaîtront après le premier match
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MembersTab
// ==========================================
const MembersTab = ({ team, isOwner, onRemoveMember, onInvitePlayer }) => {
  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Membres de l'équipe ({team.currentPlayers}/{team.maxPlayers})
        </h3>

        {isOwner && team.currentPlayers < team.maxPlayers && (
          <button
            onClick={onInvitePlayer}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Inviter un joueur
          </button>
        )}
      </div>

      {/* Liste des membres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.members?.map((member) => (
          <div
            key={member.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    member.role === "captain" ? "bg-yellow-500" : "bg-blue-500"
                  }`}
                >
                  {member.firstName?.[0] || "-"}
                  {member.lastName?.[0] || "-"}
                </div>

                <div>
                  <div className="flex items-center">
                    <p className="font-semibold">
                      {member.firstName} {member.lastName}
                    </p>
                    {member.role === "captain" && (
                      <Crown className="w-4 h-4 text-yellow-500 ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {member.position || "-"} •{" "}
                    {getSkillLevelLabel(member.skillLevel)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Membre depuis{" "}
                    {member.joinedAt
                      ? new Date(member.joinedAt).toLocaleDateString("fr-FR")
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Actions pour le capitaine */}
              {isOwner && member.role !== "captain" && (
                <button
                  onClick={() =>
                    onRemoveMember(
                      member.id,
                      `${member.firstName} ${member.lastName}`
                    )
                  }
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Retirer de l'équipe"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )) || <div>Aucun membre</div>}
      </div>

      {/* État vide ou équipe pleine */}
      {team.currentPlayers === team.maxPlayers && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-800 font-medium">
              Équipe complète !
            </span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            L'équipe a atteint sa capacité maximale de {team.maxPlayers}{" "}
            joueurs.
          </p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MatchesTab
// ==========================================
const MatchesTab = ({ matches = [], team }) => {
  const upcomingMatches = matches.filter(
    (match) =>
      new Date(match.matchDate) > new Date() && match.status !== "cancelled"
  );

  const pastMatches = matches.filter(
    (match) =>
      new Date(match.matchDate) <= new Date() || match.status === "completed"
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getMatchResult = (match, teamId) => {
    if (match.status !== "completed") return null;

    const isHome = match.homeTeam?.id === teamId;
    const ourScore = isHome ? match.score?.home : match.score?.away;
    const theirScore = isHome ? match.score?.away : match.score?.home;

    if (ourScore > theirScore) return "victory";
    if (ourScore < theirScore) return "defeat";
    return "draw";
  };

  const MatchCard = ({ match }) => {
    const { date, time } = formatDate(match.matchDate);
    const result = getMatchResult(match, team.id);
    const isHome = match.homeTeam?.id === team.id;
    const opponent = isHome ? match.awayTeam : match.homeTeam;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                result === "victory"
                  ? "bg-green-500"
                  : result === "defeat"
                  ? "bg-red-500"
                  : result === "draw"
                  ? "bg-yellow-500"
                  : "bg-gray-300"
              }`}
            />
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                match.status === "confirmed"
                  ? "bg-blue-100 text-blue-800"
                  : match.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : match.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {match.status === "confirmed"
                ? "Confirmé"
                : match.status === "completed"
                ? "Terminé"
                : match.status === "cancelled"
                ? "Annulé"
                : "En attente"}
            </span>
          </div>

          <div className="text-right text-sm text-gray-600">
            <div className="capitalize">{date}</div>
            <div>{time}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <p className="font-semibold">{team.name}</p>
            <p className="text-sm text-gray-600">
              {isHome ? "Domicile" : "Extérieur"}
            </p>
          </div>

          <div className="mx-4">
            {match.status === "completed" ? (
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {isHome ? match.score?.home : match.score?.away} -{" "}
                  {isHome ? match.score?.away : match.score?.home}
                </div>
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-400">VS</div>
            )}
          </div>

          <div className="text-center flex-1">
            <p className="font-semibold">{opponent?.name || "À définir"}</p>
            <p className="text-sm text-gray-600">
              {opponent
                ? isHome
                  ? "Visiteur"
                  : "Domicile"
                : "Équipe à confirmer"}
            </p>
          </div>
        </div>

        {match.location && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{match.location.name}</span>
          </div>
        )}

        <div className="flex space-x-2">
          <Link
            to={`/matches/${match.id}`}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            Détails
          </Link>

          {(match.status === "confirmed" || match.status === "completed") && (
            <Link
              to={`/matches/${match.id}`}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Matchs à venir */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-500" />
          Matchs à venir ({upcomingMatches.length})
        </h3>

        {upcomingMatches.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Aucun match à venir</p>
            <p className="text-sm text-gray-500">
              Les prochains matchs apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>

      {/* Matchs passés */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-green-500" />
          Matchs passés ({pastMatches.length})
        </h3>

        {pastMatches.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Aucun match passé</p>
            <p className="text-sm text-gray-500">
              Les anciens matchs apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pastMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// StatsTab
// ==========================================
const StatsTab = ({ team, matches = [] }) => {
  // Calculer des statistiques avancées
  const calculateAdvancedStats = () => {
    if (!matches || matches.length === 0) return null;

    const completedMatches = matches.filter((m) => m.status === "completed");
    const homeMatches = completedMatches.filter(
      (m) => m.homeTeam?.id === team.id
    );
    const awayMatches = completedMatches.filter(
      (m) => m.awayTeam?.id === team.id
    );

    const homeWins = homeMatches.filter(
      (m) => (m.score?.home ?? 0) > (m.score?.away ?? 0)
    ).length;
    const awayWins = awayMatches.filter(
      (m) => (m.score?.away ?? 0) > (m.score?.home ?? 0)
    ).length;

    const totalGoalsScored = [
      ...homeMatches.map((m) => m.score?.home ?? 0),
      ...awayMatches.map((m) => m.score?.away ?? 0),
    ].reduce((sum, goals) => sum + goals, 0);

    const totalGoalsConceded = [
      ...homeMatches.map((m) => m.score?.away ?? 0),
      ...awayMatches.map((m) => m.score?.home ?? 0),
    ].reduce((sum, goals) => sum + goals, 0);

    return {
      homeRecord: { played: homeMatches.length, won: homeWins },
      awayRecord: { played: awayMatches.length, won: awayWins },
      avgGoalsScored: completedMatches.length
        ? (totalGoalsScored / completedMatches.length).toFixed(1)
        : 0,
      avgGoalsConceded: completedMatches.length
        ? (totalGoalsConceded / completedMatches.length).toFixed(1)
        : 0,
      goalDifference: totalGoalsScored - totalGoalsConceded,
      cleanSheets: completedMatches.filter((m) => {
        const isHome = m.homeTeam?.id === team.id;
        const goalsConceded = isHome ? m.score?.away ?? 0 : m.score?.home ?? 0;
        return goalsConceded === 0;
      }).length,
    };
  };

  const advancedStats = calculateAdvancedStats();

  // Forme récente (5 derniers matchs)
  const recentForm = matches
    .filter((m) => m.status === "completed")
    .slice(0, 5)
    .map((match) => {
      const isHome = match.homeTeam?.id === team.id;
      const ourScore = isHome ? match.score?.home ?? 0 : match.score?.away ?? 0;
      const theirScore = isHome
        ? match.score?.away ?? 0
        : match.score?.home ?? 0;

      if (ourScore > theirScore) return "W";
      if (ourScore < theirScore) return "L";
      return "D";
    });

  return (
    <div className="space-y-8">
      {!team.stats || team.stats.matchesPlayed === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Pas encore de statistiques
          </h3>
          <p className="text-gray-600">
            Les statistiques apparaîtront après les premiers matchs
          </p>
        </div>
      ) : (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-6 h-6 text-green-600" />
                <span className="text-2xl font-bold text-green-900">
                  {team.stats.matchesWon}
                </span>
              </div>
              <p className="text-green-800 font-medium">Victoires</p>
              <p className="text-green-600 text-sm">
                {team.stats.matchesPlayed > 0
                  ? Math.round(
                      (team.stats.matchesWon / team.stats.matchesPlayed) * 100
                    )
                  : 0}
                % de réussite
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-900">
                  {advancedStats?.goalDifference > 0 ? "+" : ""}
                  {advancedStats?.goalDifference || 0}
                </span>
              </div>
              <p className="text-yellow-800 font-medium">Diff. de buts</p>
              <p className="text-yellow-600 text-sm">
                {advancedStats?.avgGoalsScored || 0} marqués / match
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="text-2xl font-bold text-blue-900">
                  {advancedStats?.cleanSheets || 0}
                </span>
              </div>
              <p className="text-blue-800 font-medium">Clean sheets</p>
              <p className="text-blue-600 text-sm">
                {advancedStats?.avgGoalsConceded || 0} encaissés / match
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-6 h-6 text-purple-600" />
                <span className="text-2xl font-bold text-purple-900">
                  {team.stats.averageRating > 0
                    ? team.stats.averageRating.toFixed(1)
                    : "-"}
                </span>
              </div>
              <p className="text-purple-800 font-medium">Rating moyen</p>
              <p className="text-purple-600 text-sm">Sur 5 étoiles</p>
            </div>
          </div>

          {/* Forme récente */}
          {recentForm.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Forme récente</h3>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 mr-4">5 derniers matchs:</span>
                {recentForm.map((result, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      result === "W"
                        ? "bg-green-500"
                        : result === "L"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    {result}
                  </div>
                ))}
                <span className="text-sm text-gray-500 ml-4">
                  (W = Victoire, D = Nul, L = Défaite)
                </span>
              </div>
            </div>
          )}

          {/* Statistiques domicile/extérieur */}
          {advancedStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">À domicile</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matchs joués:</span>
                    <span className="font-medium">
                      {advancedStats.homeRecord.played}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Victoires:</span>
                    <span className="font-medium text-green-600">
                      {advancedStats.homeRecord.won}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux de réussite:</span>
                    <span className="font-medium">
                      {advancedStats.homeRecord.played > 0
                        ? Math.round(
                            (advancedStats.homeRecord.won /
                              advancedStats.homeRecord.played) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">À l'extérieur</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matchs joués:</span>
                    <span className="font-medium">
                      {advancedStats.awayRecord.played}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Victoires:</span>
                    <span className="font-medium text-green-600">
                      {advancedStats.awayRecord.won}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux de réussite:</span>
                    <span className="font-medium">
                      {advancedStats.awayRecord.played > 0
                        ? Math.round(
                            (advancedStats.awayRecord.won /
                              advancedStats.awayRecord.played) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamDetails;
