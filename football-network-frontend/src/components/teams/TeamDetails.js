import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  MapPin,
  Crown,
  Calendar,
  Trophy,
  Star,
  UserPlus,
  UserMinus,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Shield,
  Activity,
  CheckCircle,
  Image,
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
  const { user } = useAuth(); // Ajout du hook auth

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
    if (teamId) loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [teamRes, matchesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/teams/${teamId}`),
        axios.get(`${API_BASE_URL}/matches?teamId=${teamId}&limit=20`),
      ]);
      setTeam(teamRes.data);
      setMatches(matchesRes.data);

      console.log("teamRes.data", teamRes.data);
    } catch (error) {
      toast.error("Erreur chargement équipe");
      navigate("/teams");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm(`Quitter "${team?.name}" ?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}/leave`);
      toast.success("Vous avez quitté l'équipe");
      navigate("/teams");
    } catch (error) {
      toast.error("Erreur lors du départ");
    }
  };

  const handleRemoveMember = async (memberId, name) => {
    if (!window.confirm(`Retirer ${name} ?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`);
      toast.success("Membre retiré");
      loadTeamData();
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  const handleTeamDeleted = () => {
    toast.success("Équipe supprimée");
    navigate("/teams");
  };

  const isOwner = team?.userRole === "captain";
  const isMember = team?.userRole != null;

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: Trophy },
    { id: "members", label: "Effectif", icon: Users },
    { id: "matches", label: "Calendrier", icon: Calendar },
    { id: "media", label: "Galerie", icon: Image },
    ...(isOwner
      ? [{ id: "invitations", label: "Recrutement", icon: UserPlus }]
      : []),
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  if (!team) return null;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header Immersif */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-6 relative group">
        <div className="h-48 md:h-64 relative bg-gray-900">
          {team.bannerUrl ? (
            <img
              src={`${API_BASE_URL.replace("/api", "")}${team.bannerUrl}`}
              alt="Banner"
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-r ${
                isOwner
                  ? "from-yellow-500 to-orange-600"
                  : "from-blue-600 to-indigo-700"
              }`}
            >
              <div className="absolute inset-0 bg-black/20 pattern-grid-lg opacity-30"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

          <button
            onClick={() => navigate("/teams")}
            className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {isMember && (
            <div className="absolute top-6 right-6 z-20">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all"
              >
                <MoreVertical className="w-6 h-6" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                    {isOwner ? (
                      <>
                        <button
                          onClick={() => {
                            setShowEditModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-3 hover:bg-gray-50 text-left flex items-center text-gray-700 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4 mr-3 text-blue-500" />{" "}
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            setShowInviteModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-3 hover:bg-gray-50 text-left flex items-center text-gray-700 text-sm font-medium"
                        >
                          <UserPlus className="w-4 h-4 mr-3 text-green-500" />{" "}
                          Inviter
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            setShowDeleteModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-3 hover:bg-red-50 text-left flex items-center text-red-600 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4 mr-3" /> Supprimer
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleLeaveTeam}
                        className="w-full px-4 py-3 hover:bg-red-50 text-left flex items-center text-red-600 text-sm font-medium"
                      >
                        <UserMinus className="w-4 h-4 mr-3" /> Quitter l'équipe
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="relative px-6 md:px-10 pb-6">
          <div className="flex flex-col md:flex-row items-end -mt-16 mb-6">
            <div className="relative mr-6 mb-4 md:mb-0">
              <div className="w-32 h-32 rounded-3xl border-4 border-white bg-white shadow-2xl overflow-hidden">
                {team.logoUrl ? (
                  <img
                    src={`${API_BASE_URL.replace("/api", "")}${team.logoUrl}`}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Shield className="w-14 h-14 text-gray-300" />
                  </div>
                )}
              </div>
              {team.verified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 text-white md:text-gray-900 md:mb-2">
              <h1 className="text-3xl md:text-4xl font-bold flex items-center drop-shadow-md md:drop-shadow-none">
                {team.name}
                {isOwner && (
                  <Crown className="w-6 h-6 ml-3 text-yellow-400 fill-current" />
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm md:text-gray-500 font-medium">
                {team.locationCity && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" /> {team.locationCity}
                  </span>
                )}
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" /> {team.currentPlayers}{" "}
                  joueurs
                </span>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200 text-xs uppercase tracking-wide">
                  {team.skillLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex space-x-1 md:space-x-8 overflow-x-auto border-b border-gray-100 pb-1 scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
                  }`}
                >
                  <tab.icon
                    className={`w-4 h-4 mr-2 ${
                      isActive ? "fill-current opacity-20" : ""
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "overview" && <OverviewTab team={team} />}
        {activeTab === "members" && (
          <MembersTab
            team={team}
            isOwner={isOwner}
            onRemoveMember={handleRemoveMember}
            onInvite={() => setShowInviteModal(true)}
          />
        )}
        {activeTab === "matches" && <MatchesTab matches={matches} />}
        {activeTab === "media" && (
          <TeamMediaManager
            team={team}
            isCapta={isOwner}
            onUpdate={loadTeamData}
          />
        )}
        {activeTab === "invitations" && isOwner && (
          <TeamInvitations teamId={team.id} teamName={team.name} />
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditTeamModal
          team={team}
          onClose={() => setShowEditModal(false)}
          onTeamUpdated={(data) => {
            setTeam({ ...team, ...data });
            setShowEditModal(false);
          }}
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
            loadTeamData();
          }}
        />
      )}
    </div>
  );
};

// --- Sous-composants ---

const OverviewTab = ({ team }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-500" /> À propos
        </h3>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
          {team.description ||
            "Aucune description renseignée pour cette équipe."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox
          label="Matchs"
          value={team.stats?.matchesPlayed || 0}
          color="bg-blue-50 text-blue-600"
        />
        <StatBox
          label="Victoires"
          value={team.stats?.matchesWon || 0}
          color="bg-green-50 text-green-600"
        />
        <StatBox
          label="Défaites"
          value={team.stats?.matchesLost || 0}
          color="bg-red-50 text-red-600"
        />
        {/* FIX: Ajout de Number() pour éviter le crash */}
        <StatBox
          label="Rating"
          value={
            team.stats?.averageRating
              ? Number(team.stats.averageRating).toFixed(1)
              : "-"
          }
          icon={Star}
          color="bg-yellow-50 text-yellow-600"
        />
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Capitaine
        </h3>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold">
            {team.captain?.firstName?.[0]}
            {team.captain?.lastName?.[0]}
          </div>
          <div>
            <div className="font-bold text-gray-900">
              {team.captain?.firstName} {team.captain?.lastName}
            </div>
            <div className="text-xs text-gray-500">Fondateur</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatBox = ({ label, value, color, icon: Icon }) => (
  <div
    className={`p-4 rounded-xl ${color} flex flex-col items-center justify-center text-center`}
  >
    <div className="text-2xl font-bold mb-1 flex items-center">
      {value} {Icon && <Icon className="w-4 h-4 ml-1 fill-current" />}
    </div>
    <div className="text-xs font-medium uppercase opacity-80">{label}</div>
  </div>
);

const MembersTab = ({ team, isOwner, onRemoveMember, onInvite }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <h3 className="font-bold text-gray-900">
        Effectif ({team.currentPlayers}/{team.maxPlayers})
      </h3>
      {isOwner && (
        <button
          onClick={onInvite}
          className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          + Ajouter
        </button>
      )}
    </div>
    <div className="divide-y divide-gray-100">
      {team.members?.map((member) => (
        <div
          key={member.id}
          className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center space-x-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                member.role === "captain" ? "bg-yellow-500" : "bg-gray-400"
              }`}
            >
              {member.firstName[0]}
            </div>
            <div>
              <div className="font-medium text-gray-900 flex items-center">
                {member.firstName} {member.lastName}
                {member.role === "captain" && (
                  <Crown className="w-3 h-3 ml-2 text-yellow-500 fill-current" />
                )}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {member.position || "Joueur"}
              </div>
            </div>
          </div>
          {isOwner && member.role !== "captain" && (
            <button
              onClick={() => onRemoveMember(member.id, member.firstName)}
              className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

const MatchesTab = ({ matches }) => (
  <div className="space-y-4">
    {matches.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucun match programmé.</p>
      </div>
    ) : (
      matches.map((match) => (
        <div
          key={match.id}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
        >
          <div className="flex items-center space-x-6">
            <div className="text-center min-w-[60px]">
              <div className="text-sm font-bold text-gray-900 uppercase">
                {new Date(match.matchDate).toLocaleDateString("fr", {
                  month: "short",
                })}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {new Date(match.matchDate).getDate()}
              </div>
            </div>
            <div>
              <div className="font-bold text-gray-900 flex items-center">
                {match.homeTeam.name}{" "}
                <span className="mx-2 text-gray-400 font-normal">vs</span>{" "}
                {match.awayTeam?.name || "À déterminer"}
              </div>
              <div className="text-sm text-gray-500 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" />{" "}
                {match.location?.name || "Lieu à définir"}
              </div>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              match.status === "completed"
                ? "bg-gray-100 text-gray-600"
                : "bg-green-100 text-green-700"
            }`}
          >
            {match.status === "completed" ? "Terminé" : "À venir"}
          </div>
        </div>
      ))
    )}
  </div>
);

export default TeamDetails;
