import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Users,
  Trophy,
  Calendar,
  Star,
  Shield,
  Crown,
  Briefcase,
  UserPlus,
  UserMinus,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PublicTeamProfile = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followActionLoading, setFollowActionLoading] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [teamRes, followRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/teams/${teamId}/followers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTeam(teamRes.data);
      setIsFollowing(followRes.data.isFollowing);
      setFollowersCount(followRes.data.followersCount);
    } catch (error) {
      toast.error("Erreur lors du chargement de l'équipe");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      setFollowActionLoading(true);
      const endpoint = isFollowing ? "unfollow" : "follow";

      await axios.post(
        `${API_BASE_URL}/teams/${teamId}/${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsFollowing(!isFollowing);
      setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1));
      toast.success(
        isFollowing ? "Équipe retirée de vos abonnements" : "Équipe suivie !"
      );
    } catch (error) {
      toast.error("Erreur lors de l'action");
    } finally {
      setFollowActionLoading(false);
    }
  };

  const getSkillLabel = (skill) => {
    const skills = {
      beginner: "Débutant",
      amateur: "Amateur",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
      semi_pro: "Semi-professionnel",
    };
    return skills[skill] || skill;
  };

  const getSkillColor = (level) => {
    const colors = {
      beginner: "bg-green-100 text-green-700 border-green-200",
      amateur: "bg-blue-100 text-blue-700 border-blue-200",
      intermediate: "bg-purple-100 text-purple-700 border-purple-200",
      advanced: "bg-orange-100 text-orange-700 border-orange-200",
      semi_pro: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[level] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!team) return null;

  const manager = team.members?.find((m) => m.role === "manager");
  const captain = team.members?.find((m) => m.role === "captain");
  const players = team.members?.filter(
    (m) => m.role !== "manager" && m.role !== "captain"
  );

  const winRate =
    team.stats?.matchesPlayed > 0
      ? Math.round((team.stats.matchesWon / team.stats.matchesPlayed) * 100)
      : 0;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Retour
      </button>

      {/* Header avec bannière */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-6">
        <div className="h-48 md:h-64 relative bg-gradient-to-r from-green-600 to-emerald-700">
          {team.bannerUrl && (
            <img
              src={`${API_BASE_URL.replace("/api", "")}${team.bannerUrl}`}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="relative px-6 pb-6">
          {/* Logo */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-20">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                {team.logoUrl ? (
                  <img
                    src={`${API_BASE_URL.replace("/api", "")}${team.logoUrl}`}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Shield className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {team.name}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSkillColor(
                      team.skillLevel
                    )}`}
                  >
                    {getSkillLabel(team.skillLevel)}
                  </span>
                  {team.locationCity && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      <MapPin className="w-4 h-4 mr-1" />
                      {team.locationCity}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton Follow/Unfollow */}
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {followersCount}
                </div>
                <div className="text-xs text-gray-500">Abonné(s)</div>
              </div>
              <button
                onClick={handleFollowToggle}
                disabled={followActionLoading}
                className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-green-600 text-white hover:bg-green-700 shadow-green-600/20"
                }`}
              >
                {followActionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-5 h-5 mr-2" />
                    Ne plus suivre
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Suivre
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          {team.description && (
            <div className="mt-6">
              <p className="text-gray-700 leading-relaxed">
                {team.description}
              </p>
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-gray-900">
                {team.currentPlayers}/{team.maxPlayers}
              </div>
              <div className="text-xs text-gray-500">Joueurs</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold text-gray-900">
                {team.stats?.matchesPlayed || 0}
              </div>
              <div className="text-xs text-gray-500">Matchs</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-gray-900">{winRate}%</div>
              <div className="text-xs text-gray-500">Victoires</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-gray-900">
                {team.stats?.averageRating && Number(team.stats.averageRating) > 0
                  ? Number(team.stats.averageRating).toFixed(1)
                  : "-"}
              </div>
              <div className="text-xs text-gray-500">Note moyenne</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manager et Capitaine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Manager */}
        {manager && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Manager
            </h3>
            <div
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition"
              onClick={() => navigate(`/users/${manager.id}`)}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                {manager.firstName?.[0]}
                {manager.lastName?.[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {manager.firstName} {manager.lastName}
                </div>
                <div className="text-xs text-blue-600 flex items-center">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Manager
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capitaine */}
        {captain && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Capitaine
            </h3>
            <div
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition"
              onClick={() => navigate(`/users/${captain.id}`)}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold">
                {captain.firstName?.[0]}
                {captain.lastName?.[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {captain.firstName} {captain.lastName}
                </div>
                <div className="text-xs text-yellow-600 flex items-center">
                  <Crown className="w-3 h-3 mr-1" />
                  Capitaine
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des joueurs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            Membres de l'équipe ({team.members?.length || 0})
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {players?.map((member) => (
            <div
              key={member.id}
              className="p-4 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => navigate(`/users/${member.id}`)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                  {member.firstName?.[0]}
                  {member.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {member.firstName} {member.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.position || "Joueur"}
                    {member.skillLevel && ` • ${getSkillLabel(member.skillLevel)}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicTeamProfile;
