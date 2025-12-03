import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Heart,
  MessageCircle,
  Share2,
  Users,
  Calendar,
  Trophy,
  PlusCircle,
  Loader2,
  Search,
  MapPin,
  ArrowRight,
  Star,
  Image as ImageIcon,
  Send,
  LogIn,
  UserPlus,
} from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_URL;

// --- SKELETONS ---
const SidebarSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-4 mb-4 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PostSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-4 mb-4 animate-pulse">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/6"></div>
      </div>
    </div>
    <div className="h-24 bg-gray-200 rounded w-full mb-4"></div>
    <div className="h-8 bg-gray-200 rounded w-full"></div>
  </div>
);

// --- CONFIGURATION TYPES POST ---
const POST_TYPES = {
  match_announcement: {
    label: "Match",
    color: "text-green-600",
    bg: "bg-green-50",
    icon: Calendar,
  },
  match_result: {
    label: "Résultat",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: Trophy,
  },
  recruitment: {
    label: "Recrutement",
    color: "text-purple-600",
    bg: "bg-purple-50",
    icon: Users,
  },
  general: {
    label: "Discussion",
    color: "text-gray-600",
    bg: "bg-gray-50",
    icon: MessageCircle,
  },
};

const LandingFeed = () => {
  const { token, user } = useAuth();
  const isAuthenticated = !!user; // Booléen pour vérifier l'état

  // États des Données
  const [posts, setPosts] = useState([]);
  const [suggestedTeams, setSuggestedTeams] = useState([]);
  const [trendingMatches, setTrendingMatches] = useState([]);
  const [followingTeams, setFollowingTeams] = useState(new Set());

  // États d'UI
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [createContent, setCreateContent] = useState("");
  const [createType, setCreateType] = useState("general");
  const [isCreating, setIsCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Pagination (désactivée pour l'instant)
  const [page, setPage] = useState(0);

  // --- Chargement des données ---

  useEffect(() => {
    loadSidebarData();
  }, [isAuthenticated]); // Recharger si l'état de connexion change

  useEffect(() => {
    setPage(0);
    setPosts([]);
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, isAuthenticated]);

  const loadSidebarData = async () => {
    try {
      setLoadingSidebar(true);

      // Configuration headers conditionnelle
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const fetchSafely = async (url) => {
        try {
          const res = await axios.get(url, config);
          return res.data;
        } catch (e) {
          // On ignore silencieusement les erreurs 401/403 pour les invités
          return null;
        }
      };

      // Si invité, on charge uniquement les tendances publiques
      const requests = [
        fetchSafely(`${API_BASE_URL}/matches/trending?limit=5`),
      ];

      // Si connecté, on charge aussi les suggestions personnalisées
      if (isAuthenticated) {
        requests.push(fetchSafely(`${API_BASE_URL}/teams/suggestions?limit=5`));
      }

      const [matchesData, teamsData] = await Promise.all(requests);

      if (matchesData?.matches) setTrendingMatches(matchesData.matches);
      if (teamsData?.teams) setSuggestedTeams(teamsData.teams);
    } catch (error) {
      console.error("Sidebar error:", error);
    } finally {
      setLoadingSidebar(false);
    }
  };

  const loadFeed = async () => {
    try {
      setLoadingFeed(true);

      // Configuration headers conditionnelle
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      // Pour les utilisateurs connectés, charger les activités des équipes suivies
      if (isAuthenticated) {
        const res = await axios.get(
          `${API_BASE_URL}/teams/feed/activities?limit=20`,
          config
        );

        // Transformer les activités en posts pour l'affichage
        const transformedPosts = res.data.activities.map((activity) => {
          if (activity.type === "match") {
            return {
              id: `match-${activity.id}`,
              type: "match_result",
              content: `${activity.team.name} ${activity.match.result === "win" ? "a gagné" : activity.match.result === "loss" ? "a perdu" : "a fait match nul"} contre ${activity.match.opponent} (${activity.match.teamScore}-${activity.match.opponentScore})`,
              author: {
                id: activity.team.id,
                isTeam: true,
                firstName: activity.team.name,
                lastName: "",
                profilePicture: activity.team.logoUrl
                  ? `${API_BASE_URL.replace("/api", "")}${activity.team.logoUrl}`
                  : null,
              },
              createdAt: activity.date,
              stats: { likes: 0, comments: 0 },
              userLiked: false,
              location: activity.match.location
                ? { city: activity.match.location }
                : null,
            };
          } else if (activity.type === "new_member") {
            return {
              id: `member-${activity.id}`,
              type: "general",
              content: `${activity.member.firstName} ${activity.member.lastName} a rejoint l'équipe !`,
              author: {
                id: activity.team.id,
                isTeam: true,
                firstName: activity.team.name,
                lastName: "",
                profilePicture: activity.team.logoUrl
                  ? `${API_BASE_URL.replace("/api", "")}${activity.team.logoUrl}`
                  : null,
              },
              createdAt: activity.date,
              stats: { likes: 0, comments: 0 },
              userLiked: false,
            };
          }
          return null;
        }).filter(Boolean);

        setPosts(transformedPosts);
      } else {
        // Pour les invités, charger les posts publics depuis /api/feed
        const res = await axios.get(
          `${API_BASE_URL}/feed?limit=20&type=${activeFilter === "all" ? "all" : activeFilter}`,
          config
        );

        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error("Feed load error:", err);
      setPosts([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Scroll infini (désactivé pour l'instant car pas de pagination)
  const lastPostRef = useCallback(
    (node) => {
      // Pas de pagination pour le moment
      if (node) {
        // Observer maintenu pour compatibilité mais ne fait rien
      }
    },
    []
  );

  // --- Actions ---

  const handleFollowTeam = async (teamId) => {
    if (!isAuthenticated) {
      alert("Connectez-vous pour suivre une équipe !");
      return;
    }

    try {
      // Optimistic update
      setFollowingTeams((prev) => new Set(prev).add(teamId));

      await axios.post(
        `${API_BASE_URL}/teams/${teamId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      // Rollback on error
      setFollowingTeams((prev) => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });

      if (error.response?.status === 400) {
        alert("Vous suivez déjà cette équipe");
      } else {
        alert("Erreur lors du suivi de l'équipe");
      }
    }
  };

  const handleCreatePost = async () => {
    if (!createContent.trim() || !isAuthenticated) return;
    setIsCreating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/feed`,
        { content: createContent, type: createType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts([res.data.post, ...posts]);
      setCreateContent("");
      setCreateType("general");
    } catch (error) {
      alert("Erreur lors de la publication");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (postId, liked) => {
    if (!isAuthenticated) {
      alert("Connectez-vous pour aimer ce post !");
      return;
    }

    // Optimistic Update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              userLiked: !liked,
              stats: { ...p.stats, likes: p.stats.likes + (liked ? -1 : 1) },
            }
          : p
      )
    );

    try {
      await axios({
        method: liked ? "DELETE" : "POST",
        url: `${API_BASE_URL}/feed/${postId}/like`,
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      // Rollback
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                userLiked: liked,
                stats: { ...p.stats, likes: p.stats.likes + (liked ? 1 : -1) },
              }
            : p
        )
      );
    }
  };

  // --- Sous-Composants ---

  const MatchCard = ({ match }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition p-2 rounded-lg cursor-pointer">
      <div className="flex flex-col min-w-0 flex-1 mr-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />{" "}
            {new Date(match.match_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className="bg-gray-100 px-1.5 rounded text-gray-600">
            {match.status || "Prévu"}
          </span>
        </div>
        <div className="flex items-center justify-between font-semibold text-gray-800 text-sm">
          <span className="truncate">{match.home_team}</span>
          <span className="mx-2 text-gray-400">vs</span>
          <span className="truncate">{match.away_team}</span>
        </div>
      </div>
    </div>
  );

  const TeamSuggestion = ({ team }) => {
    const isFollowing = followingTeams.has(team.id);

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <Link
          to={`/teams/${team.id}/public`}
          className="flex items-center space-x-3 overflow-hidden flex-1 hover:bg-gray-50 -m-2 p-2 rounded-lg transition"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
            {team.logo_url ? (
              <img
                src={`${API_BASE_URL.replace("/api", "")}${team.logo_url}`}
                alt={team.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              team.name[0]
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {team.name}
            </p>
            <p className="text-xs text-gray-500 flex items-center truncate">
              <MapPin className="w-3 h-3 mr-0.5" /> {team.city || "Local"}
            </p>
          </div>
        </Link>
        <button
          onClick={() => handleFollowTeam(team.id)}
          disabled={isFollowing}
          className={`p-1.5 rounded-full transition ${
            isFollowing
              ? "text-gray-400 bg-gray-100 cursor-not-allowed"
              : "text-green-600 hover:bg-green-50"
          }`}
          title={isFollowing ? "Déjà suivi" : "Suivre cette équipe"}
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const PostCard = ({ post, isLast }) => {
    const typeConfig = POST_TYPES[post.type] || POST_TYPES.general;
    const Icon = typeConfig.icon;

    return (
      <div
        ref={isLast ? lastPostRef : null}
        className="bg-white rounded-xl shadow-sm mb-5 overflow-hidden border border-gray-100"
      >
        <div className="p-4 flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Link
              to={
                isAuthenticated
                  ? post.author?.isTeam
                    ? `/teams/${post.author.id}/public`
                    : `/users/${post.author?.id}`
                  : "#"
              }
              className="block"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                {post.author?.profilePicture ? (
                  <img
                    src={post.author.profilePicture}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  post.author?.firstName?.[0]
                )}
              </div>
            </Link>
            <div>
              <div className="flex items-center">
                <Link
                  to={
                    isAuthenticated
                      ? post.author?.isTeam
                        ? `/teams/${post.author.id}/public`
                        : `/users/${post.author?.id}`
                      : "#"
                  }
                  className="font-bold text-gray-900 hover:underline mr-2"
                >
                  {post.author?.firstName} {post.author?.lastName}
                </Link>
                {post.location && (
                  <span className="text-xs text-gray-400 flex items-center">
                    <MapPin className="w-3 h-3 mr-0.5" />
                    {post.location.city}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span
                  className={`flex items-center px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.color} font-medium`}
                >
                  <Icon className="w-3 h-3 mr-1" /> {typeConfig.label}
                </span>
                <span className="text-gray-400">
                  • {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-2">
          <p className="text-gray-800 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        </div>

        {post.media && (
          <div className="mt-2 mb-4 bg-black">
            <img
              src={post.media.url}
              alt="Post media"
              className="w-full max-h-[500px] object-contain"
            />
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between mt-2">
          <div className="flex space-x-6">
            <button
              onClick={() => handleLike(post.id, post.userLiked)}
              className={`flex items-center space-x-1.5 text-sm font-medium transition ${
                post.userLiked
                  ? "text-red-500"
                  : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-5 h-5 ${post.userLiked ? "fill-current" : ""}`}
              />
              <span>{post.stats?.likes || 0}</span>
            </button>
            <button className="flex items-center space-x-1.5 text-sm font-medium text-gray-500 hover:text-blue-500 transition">
              <MessageCircle className="w-5 h-5" />
              <span>{post.stats?.comments || 0}</span>
            </button>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. GAUCHE : Profil ou Invitation à rejoindre */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            {isAuthenticated ? (
              // VERSION CONNECTÉE
              <div className="bg-white rounded-xl shadow-sm p-6 text-center sticky top-24">
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 mb-3 overflow-hidden">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-10 h-10 m-5 text-gray-400" />
                  )}
                </div>
                <h2 className="font-bold text-gray-900 text-lg">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {user?.position || "Joueur passionné"}
                </p>
                <div className="flex justify-center space-x-4 text-sm border-t pt-4">
                  <div>
                    <div className="font-bold text-gray-900">12</div>
                    <div className="text-gray-400 text-xs">Matchs</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">3</div>
                    <div className="text-gray-400 text-xs">Équipes</div>
                  </div>
                </div>

                <div className="mt-6 text-left">
                  <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-3">
                    Raccourcis
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        to="/matches"
                        className="flex items-center text-gray-700 hover:bg-gray-50 p-2 rounded-lg transition"
                      >
                        <Calendar className="w-5 h-5 mr-3 text-green-600" /> Mes
                        Matchs
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/teams"
                        className="flex items-center text-gray-700 hover:bg-gray-50 p-2 rounded-lg transition"
                      >
                        <Users className="w-5 h-5 mr-3 text-blue-600" /> Mes
                        Équipes
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              // VERSION INVITÉ
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto mb-4 flex items-center justify-center transform -rotate-6">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Rejoignez le terrain
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Connectez-vous pour interagir, créer des équipes et
                    organiser des matchs.
                  </p>
                </div>
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full py-2.5 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    <LogIn className="w-4 h-4 mr-2" /> Se connecter
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center justify-center w-full py-2.5 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition shadow-lg shadow-green-600/20"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Créer un compte
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. CENTRE : Feed */}
          <main className="lg:col-span-6">
            {/* Zone de création OU Bannière de bienvenue */}
            {isAuthenticated ? (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-700 font-bold">
                    {user?.firstName?.[0]}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={createContent}
                      onChange={(e) => setCreateContent(e.target.value)}
                      placeholder="Quoi de neuf sur le terrain ?"
                      className="w-full border-none resize-none focus:ring-0 text-gray-700 text-lg h-16 placeholder-gray-400"
                    />
                    <div className="flex flex-wrap gap-2 mt-2 pb-2 border-b border-gray-50">
                      {Object.entries(POST_TYPES).map(([key, conf]) => (
                        <button
                          key={key}
                          onClick={() => setCreateType(key)}
                          className={`text-xs px-3 py-1 rounded-full transition flex items-center ${
                            createType === key
                              ? `${conf.bg} ${conf.color} ring-1 ring-current`
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          <conf.icon className="w-3 h-3 mr-1" /> {conf.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                          <ImageIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                          <MapPin className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={handleCreatePost}
                        disabled={isCreating || !createContent.trim()}
                        className="bg-green-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-green-700 transition disabled:opacity-50 flex items-center"
                      >
                        {isCreating && (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        )}
                        Publier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-lg p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold mb-2">
                    Bienvenue sur Football Network ⚽
                  </h1>
                  <p className="text-green-50 mb-6 max-w-xl">
                    La plateforme ultime pour gérer vos équipes, organiser des
                    matchs et trouver des joueurs. Rejoignez la communauté dès
                    maintenant !
                  </p>
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-6 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-gray-50 transition shadow-md"
                  >
                    Commencer l'aventure <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Filtres */}
            <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <h3 className="font-bold text-lg text-gray-800 mr-4">
                Actualités
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    activeFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  Tout
                </button>
                <button
                  onClick={() => setActiveFilter("match_result")}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    activeFilter === "match_result"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  Résultats
                </button>
                <button
                  onClick={() => setActiveFilter("recruitment")}
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    activeFilter === "recruitment"
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  Mercato
                </button>
              </div>
            </div>

            {/* Liste des Posts */}
            <div className="space-y-6">
              {loadingFeed && page === 0 ? (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 font-medium">
                    C'est calme par ici
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {isAuthenticated
                      ? "Soyez le premier à publier quelque chose !"
                      : "Connectez-vous pour participer à la conversation."}
                  </p>
                </div>
              ) : (
                posts.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isLast={idx === posts.length - 1}
                  />
                ))
              )}

              {loadingFeed && page > 0 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                </div>
              )}
            </div>
          </main>

          {/* 3. DROITE : Tendances (Toujours visible) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 sticky top-24">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-white to-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <Trophy className="w-4 h-4 mr-2 text-yellow-500" /> A
                  l'affiche
                </h3>
                <Link
                  to="/matches"
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Voir tout
                </Link>
              </div>
              <div className="p-2">
                {loadingSidebar ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Chargement...
                  </div>
                ) : trendingMatches.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    Aucun match tendance
                  </div>
                ) : (
                  trendingMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                )}
              </div>
            </div>

            {/* Suggestions (Uniquement si connecté) */}
            {isAuthenticated && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-white to-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <Star className="w-4 h-4 mr-2 text-green-500" /> Clubs à
                    suivre
                  </h3>
                  <Link
                    to="/teams/search"
                    className="text-xs text-blue-600 font-medium hover:underline"
                  >
                    Voir tout
                  </Link>
                </div>
                <div className="p-4 space-y-2">
                  {suggestedTeams.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs">
                      Aucune suggestion
                    </div>
                  ) : (
                    suggestedTeams.map((team) => (
                      <TeamSuggestion key={team.id} team={team} />
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="text-center text-xs text-gray-400 px-6 leading-relaxed">
              <p>Football Network © 2025</p>
              <div className="flex justify-center space-x-2 mt-1">
                <a href="#" className="hover:text-gray-600">
                  A propos
                </a>
                <span>•</span>
                <a href="#" className="hover:text-gray-600">
                  Confidentialité
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LandingFeed;
