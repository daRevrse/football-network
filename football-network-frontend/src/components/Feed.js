import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  Calendar,
  Trophy,
  PlusCircle,
  Loader2,
  MapPin,
  ArrowRight,
  Star,
  Send,
  LogIn,
  UserPlus,
  Plus,
} from "lucide-react";
import PostCard from "./feed/PostCard";
import CreatePostModal from "./feed/CreatePostModal";
import { useUserProfile } from "../contexts/UserContext";

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

const Feed = () => {
  const { token, user } = useAuth();
  const { profilePictureUrl } = useUserProfile();
  const isAuthenticated = !!user; // Booléen pour vérifier l'état

  // États des Données
  const [posts, setPosts] = useState([]);
  const [suggestedTeams, setSuggestedTeams] = useState([]);
  const [trendingMatches, setTrendingMatches] = useState([]);
  const [followingTeams, setFollowingTeams] = useState(new Set());

  // États d'UI
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Pagination (désactivée pour l'instant)
  const [page, setPage] = useState(0);

  const [stats, setStats] = useState({
    teamsCount: 0,
    matchesCount: 0,
    winRate: 0,
    goals: 0,
    assists: 0,
  });

  // --- Chargement des données ---

  useEffect(() => {
    loadSidebarData();
  }, [isAuthenticated]); // Recharger si l'état de connexion change

  useEffect(() => {
    setPage(0);
    setPosts([]);
    loadFeed();
    loadStats();
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

      // Charger les posts depuis le nouveau endpoint feed
      const res = await axios.get(`${API_BASE_URL}/feed?limit=50`, config);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Feed load error:", err);
      setPosts([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/stats`);
      setStats((prev) => ({ ...prev, ...response.data }));
    } catch (error) {
      console.log("Stats non disponibles");
    }
  };

  // Scroll infini (désactivé pour l'instant car pas de pagination)
  const lastPostRef = useCallback((node) => {
    // Pas de pagination pour le moment
    if (node) {
      // Observer maintenu pour compatibilité mais ne fait rien
    }
  }, []);

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

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  const handleLike = async (postId, currentlyLiked) => {
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
              userLiked: !currentlyLiked,
              stats: {
                ...p.stats,
                likes: (p.stats?.likes || 0) + (currentlyLiked ? -1 : 1),
              },
            }
          : p
      )
    );

    try {
      if (currentlyLiked) {
        await axios.delete(`${API_BASE_URL}/feed/${postId}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `${API_BASE_URL}/feed/${postId}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      // Rollback
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                userLiked: currentlyLiked,
                stats: {
                  ...p.stats,
                  likes: (p.stats?.likes || 0) + (currentlyLiked ? 1 : -1),
                },
              }
            : p
        )
      );
    }
  };

  // --- Sous-Composants ---

  const MatchCard = ({ match }) => {
    const getStatusDisplay = (status) => {
      switch (status) {
        case "pending":
          return { label: "En attente", color: "bg-yellow-100 text-yellow-700" };
        case "confirmed":
          return { label: "Confirmé", color: "bg-green-100 text-green-700" };
        case "in_progress":
          return { label: "En cours", color: "bg-blue-100 text-blue-700" };
        case "completed":
          return { label: "Terminé", color: "bg-gray-100 text-gray-700" };
        case "cancelled":
          return { label: "Annulé", color: "bg-red-100 text-red-700" };
        default:
          return { label: "Prévu", color: "bg-gray-100 text-gray-600" };
      }
    };

    const statusDisplay = getStatusDisplay(match.status);

    return (
      <Link
        to={`/matches/${match.id}/public`}
        className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition p-2 rounded-lg cursor-pointer"
      >
        <div className="flex flex-col min-w-0 flex-1 mr-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />{" "}
              {new Date(match.match_date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusDisplay.color}`}>
              {statusDisplay.label}
            </span>
          </div>
          <div className="flex items-center justify-between font-semibold text-gray-800 text-sm">
            <span className="truncate">{match.home_team}</span>
            <span className="mx-2 text-gray-400">vs</span>
            <span className="truncate">{match.away_team}</span>
          </div>
        </div>
      </Link>
    );
  };

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
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
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
                    <div className="font-bold text-gray-900">
                      {stats.matchesCount}
                    </div>
                    <div className="text-gray-400 text-xs">Matchs</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {stats.teamsCount}
                    </div>
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
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-700 font-bold">
                    {user?.firstName?.[0]}
                  </div>
                  <div className="flex-1 text-left text-gray-500 group-hover:text-gray-700 transition">
                    Quoi de neuf sur le terrain ?
                  </div>
                  <Plus className="w-5 h-5 text-green-600" />
                </button>
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
                    onLike={handleLike}
                    isAuthenticated={isAuthenticated}
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

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
        token={token}
      />
    </div>
  );
};

export default Feed;
