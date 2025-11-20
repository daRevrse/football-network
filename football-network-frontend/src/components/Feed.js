import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import {
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Award,
  Search,
  Users,
  Image as ImageIcon,
  MessageSquare,
  Filter,
  PlusCircle,
  MoreHorizontal,
  X,
  Send,
  TrendingUp,
  MapPin,
  Trophy,
  Clock,
  UserPlus,
} from "lucide-react";

// Configuration de l'API
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const POST_TYPES = {
  match_announcement: {
    icon: Calendar,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Match à venir",
  },
  match_result: {
    icon: Award,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Résultat",
  },
  team_search: {
    icon: Search,
    color: "text-purple-600",
    bg: "bg-purple-50",
    label: "Cherche équipe",
  },
  player_search: {
    icon: Users,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    label: "Cherche joueurs",
  },
  media: {
    icon: ImageIcon,
    color: "text-pink-600",
    bg: "bg-pink-50",
    label: "Media",
  },
  general: {
    icon: MessageSquare,
    color: "text-gray-600",
    bg: "bg-gray-50",
    label: "Discussion",
  },
};

// Composant Skeleton pour le chargement
const PostSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm mb-4 p-4 animate-pulse">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-48 bg-gray-200 rounded w-full"></div>
  </div>
);

const Feed = () => {
  const { token, user } = useAuth();

  // États principaux
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]); // Nouveau: Posts tendances
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // États pour la pagination (Infinite Scroll)
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  // Création de post
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState("general");
  const [creating, setCreating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // UI Image preview

  // Gestion des commentaires
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [replyTo, setReplyTo] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  // Initialisation
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    loadPosts(0, true);
    loadTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  // Infinite Scroll Logic
  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            loadPosts(nextPage, false);
            return nextPage;
          });
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const loadPosts = async (pageNum, isReset) => {
    try {
      setLoading(true);
      const typeParam = selectedType !== "all" ? `&type=${selectedType}` : "";
      const offset = pageNum * 20;

      const response = await axios.get(
        `${API_BASE_URL}/feed?limit=20&offset=${offset}${typeParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPosts((prev) =>
        isReset ? response.data.posts : [...prev, ...response.data.posts]
      );
      setHasMore(response.data.pagination.hasMore);
    } catch (error) {
      console.error("❌ Load posts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrending = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/feed/trending?limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTrendingPosts(response.data.posts);
    } catch (error) {
      console.error("❌ Load trending error:", error);
    }
  };

  // Gestion image (Preview seulement, implémentation upload requiert service dédié)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Liker un post
  const handleLike = async (postId, isLiked) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              userLiked: !isLiked,
              stats: {
                ...post.stats,
                likes: post.stats.likes + (isLiked ? -1 : 1),
              },
            }
          : post
      )
    );

    try {
      await axios({
        method: isLiked ? "DELETE" : "POST",
        url: `${API_BASE_URL}/feed/${postId}/like`,
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("❌ Like error:", error);
      // Revert on error
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                userLiked: isLiked,
                stats: {
                  ...post.stats,
                  likes: post.stats.likes + (isLiked ? 1 : -1),
                },
              }
            : post
        )
      );
    }
  };

  // ... [Gardez les fonctions existantes pour Comments, Share, Delete, Report ici] ...
  // Pour la concision, je suppose que les fonctions handleToggleComments, loadComments,
  // handleAddComment, etc. sont les mêmes que votre fichier original.

  const handleToggleComments = async (postId) => {
    const isExpanded = expandedComments[postId];
    if (isExpanded) {
      setExpandedComments((prev) => ({ ...prev, [postId]: false }));
    } else {
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      if (!comments[postId]) {
        await loadComments(postId);
      }
    }
  };

  const loadComments = async (postId) => {
    try {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      const response = await axios.get(
        `${API_BASE_URL}/feed/${postId}/comments?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments((prev) => ({ ...prev, [postId]: response.data.comments }));
    } catch (error) {
      console.error("Error loading comments", error);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId, content, parentId = null) => {
    if (!content.trim()) return;
    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      const response = await axios.post(
        `${API_BASE_URL}/feed/${postId}/comments`,
        { content, parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: { ...post.stats, comments: post.stats.comments + 1 },
              }
            : post
        )
      );
      setComments((prev) => ({
        ...prev,
        [postId]: [response.data.comment, ...(prev[postId] || [])],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setReplyTo((prev) => ({ ...prev, [postId]: null }));
    } catch (error) {
      alert("Erreur commentaire");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Supprimer ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/feed/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      alert("Erreur");
    }
  };

  const handleReportPost = async (postId, reason, desc) => {
    try {
      await axios.post(
        `${API_BASE_URL}/feed/${postId}/report`,
        { reason, description: desc },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Signalé !");
    } catch (e) {
      alert("Erreur");
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setCreating(true);

    // Note: Pour l'image réelle, il faudrait utiliser FormData et l'endpoint d'upload
    const postData = {
      type: newPostType,
      content: newPostContent,
      locationCity: user?.locationCity,
      // mediaUrl: uploadedImageUrl // À implémenter avec l'upload
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/feed`, postData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => [response.data.post, ...prev]);
      setNewPostContent("");
      setSelectedImage(null);
      setShowCreateModal(false);
    } catch (error) {
      alert("Erreur lors de la publication");
    } finally {
      setCreating(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Composant Carte Spéciale Match
  const MatchCardContent = ({ match, postType }) => {
    if (!match) return null;
    return (
      <div className="mx-4 my-2 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div
          className={`px-4 py-2 flex justify-between items-center ${
            postType === "match_result"
              ? "bg-blue-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider flex items-center">
            <Trophy className="w-3 h-3 mr-1" />
            {postType === "match_result" ? "Score Final" : "Match à venir"}
          </span>
          <span className="text-xs font-medium">
            {new Date(match.date || Date.now()).toLocaleDateString()}
          </span>
        </div>
        <div className="bg-white p-4 flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <span className="font-bold text-gray-500">A</span>
            </div>
            <span className="text-sm font-bold text-center text-gray-800 truncate w-full">
              Équipe A
            </span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center justify-center w-1/3">
            {postType === "match_result" ? (
              <div className="text-2xl font-black text-gray-900">3 - 1</div>
            ) : (
              <div className="text-xl font-bold text-gray-400">VS</div>
            )}
            <span className="text-xs text-gray-500 mt-1 bg-gray-100 px-2 py-0.5 rounded">
              {match.status || "Programmé"}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <span className="font-bold text-gray-500">B</span>
            </div>
            <span className="text-sm font-bold text-center text-gray-800 truncate w-full">
              Équipe B
            </span>
          </div>
        </div>
      </div>
    );
  };

  const PostCard = React.memo(({ post, innerRef }) => {
    if (!post || !post.author) return null;
    const postType = POST_TYPES[post.type] || POST_TYPES.general;
    const PostTypeIcon = postType.icon;

    // Détection automatique si c'est un post lié à un match
    const isMatchPost =
      post.type === "match_announcement" || post.type === "match_result";

    return (
      <div
        ref={innerRef}
        className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200"
      >
        {/* Header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {post.author.profilePicture ? (
              <img
                src={post.author.profilePicture}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-inner">
                {post.author.firstName?.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900 flex items-center">
                {post.author.firstName} {post.author.lastName}
                {post.location && (
                  <span className="text-xs text-gray-400 font-normal ml-2 flex items-center">
                    <MapPin className="w-3 h-3 mr-0.5" /> {post.location.city}
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full ${postType.bg} ${postType.color}`}
                >
                  <PostTypeIcon className="w-3 h-3 mr-1" />
                  {postType.label}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(post.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Options */}
          <div className="relative group">
            <button className="text-gray-300 hover:text-gray-600 p-2">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-0 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10 animate-fadeIn">
              {post.author.id === user?.id && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <X className="w-4 h-4 mr-2" /> Supprimer
                </button>
              )}
              <button
                onClick={() => handleReportPost(post.id, "other", "")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                🚩 Signaler
              </button>
            </div>
          </div>
        </div>

        {/* Contenu Textuel */}
        <div className="px-4 pb-3">
          <p className="text-gray-800 whitespace-pre-line text-base leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Contenu Visuel (Match ou Image) */}
        {isMatchPost && post.match ? (
          <MatchCardContent match={post.match} postType={post.type} />
        ) : post.media ? (
          <div className="w-full bg-black">
            <img
              src={post.media.url}
              alt="Media"
              className="w-full max-h-[500px] object-contain"
            />
          </div>
        ) : null}

        {/* Stats Bar */}
        <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex space-x-3">
            {post.stats.likes > 0 && <span>{post.stats.likes} j'aime</span>}
            {post.stats.comments > 0 && <span>{post.stats.comments} coms</span>}
          </div>
          {post.stats.shares > 0 && <span>{post.stats.shares} partages</span>}
        </div>

        {/* Action Buttons */}
        <div className="px-2 py-1 border-t border-gray-100 flex justify-between">
          <button
            onClick={() => handleLike(post.id, post.userLiked)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
              post.userLiked ? "text-red-500" : "text-gray-500"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${post.userLiked ? "fill-current" : ""}`}
            />
          </button>
          <button
            onClick={() => handleToggleComments(post.id)}
            className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Zone Commentaires (Simplifiée pour l'exemple) */}
        {expandedComments[post.id] && (
          <div className="border-t border-gray-100 bg-gray-50 p-3 animate-slideDown">
            {/* Input */}
            <div className="flex items-center space-x-2 mb-4">
              <input
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Ajouter un commentaire..."
                value={commentInputs[post.id] || ""}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [post.id]: e.target.value,
                  }))
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  handleAddComment(post.id, commentInputs[post.id])
                }
              />
              <button
                onClick={() =>
                  handleAddComment(post.id, commentInputs[post.id])
                }
                className="text-green-600 p-2 hover:bg-green-100 rounded-full"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {/* Liste rapide */}
            <div className="space-y-3">
              {loadingComments[post.id] && (
                <div className="text-center text-xs text-gray-400">
                  Chargement...
                </div>
              )}
              {comments[post.id]?.map((c) => (
                <div key={c.id} className="flex space-x-2 text-sm">
                  <span className="font-bold text-gray-800">
                    {c.first_name}:
                  </span>
                  <span className="text-gray-600">{c.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden md:block">
              Fil d'actualité
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors ${
                showFilters
                  ? "bg-green-100 text-green-700"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Publier</span>
            </button>
          </div>
        </div>

        {/* Barre de filtres animée */}
        {showFilters && (
          <div className="max-w-6xl mx-auto px-4 py-3 flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
            <button
              onClick={() => setSelectedType("all")}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedType === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Tout voir
            </button>
            {Object.entries(POST_TYPES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`whitespace-nowrap flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  selectedType === key
                    ? `${value.bg} ${value.color} border-transparent ring-1 ring-current`
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <value.icon className="w-3 h-3 mr-2" />
                {value.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Principale (Feed) */}
        <div className="lg:col-span-2">
          {/* Create Post Teaser (Mobile/Desktop) */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-500 text-sm">
              Quoi de neuf sur le terrain, {user?.firstName} ?
            </div>
            <ImageIcon className="w-6 h-6 text-green-500" />
          </div>

          {loading && page === 0 ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Aucune publication trouvée.</p>
            </div>
          ) : (
            posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                innerRef={
                  index === posts.length - 1 ? lastPostElementRef : null
                }
              />
            ))
          )}

          {loading && page > 0 && (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}
        </div>

        {/* Colonne de Droite (Tendances & Infos) - Masquée sur mobile */}
        <div className="hidden lg:block space-y-6">
          {/* Trending Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Tendances
            </h2>
            <div className="space-y-4">
              {trendingPosts.length > 0 ? (
                trendingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {post.author.firstName} {post.author.lastName}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {post.content}
                      </p>
                      <div className="mt-1 text-xs text-gray-400">
                        {post.stats.likes} j'aime
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Aucune tendance pour le moment.
                </p>
              )}
            </div>
            <button className="w-full mt-4 text-center text-sm text-green-600 font-medium hover:underline">
              Voir plus
            </button>
          </div>

          {/* Footer Links */}
          <div className="text-xs text-gray-400 px-4 text-center">
            &copy; 2024 Football Network • Confidentialité • Conditions
          </div>
        </div>
      </div>

      {/* Modal de création améliorée */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Créer une publication
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4">
              {/* Sélection Type */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {Object.entries(POST_TYPES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setNewPostType(key)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      newPostType === key
                        ? `${value.bg} ${value.color} ring-1 ring-current`
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    <value.icon className="w-3 h-3" />
                    <span>{value.label}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Partagez vos résultats, cherchez des joueurs..."
                className="w-full h-32 p-3 text-gray-700 placeholder-gray-400 resize-none focus:outline-none text-lg"
                autoFocus
              />

              {/* Zone Image Preview */}
              {selectedImage && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-full max-h-60 object-cover"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-2">
                <label className="p-2 text-green-600 hover:bg-green-50 rounded-full cursor-pointer transition-colors">
                  <ImageIcon className="w-6 h-6" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
                <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
                  <MapPin className="w-6 h-6" />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || creating}
                className="px-6 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-200"
              >
                {creating ? "Envoi..." : "Publier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
