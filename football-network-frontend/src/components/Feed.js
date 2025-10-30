// ============================
// Feed.js - Composant Web du Feed Public
// ============================

import React, { useState, useEffect } from "react";
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
    label: "Post",
  },
};

const Feed = () => {
  const { token, user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Création de post
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState("general");
  const [creating, setCreating] = useState(false);

  // Gestion des commentaires
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [replyTo, setReplyTo] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  // Charger les posts
  useEffect(() => {
    loadPosts();
  }, [selectedType]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const typeParam = selectedType !== "all" ? `&type=${selectedType}` : "";

      const response = await axios.get(
        `${API_BASE_URL}/feed?limit=20${typeParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Load posts successful", response.data.posts);

      setPosts(response.data.posts);
    } catch (error) {
      console.error(
        "❌ Load posts error:",
        error.response?.data || error.message
      );
      if (error.response?.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Liker un post
  const handleLike = async (postId, isLiked) => {
    try {
      console.log(
        `${isLiked ? "💔" : "❤️"} ${isLiked ? "Unlike" : "Like"} post ${postId}`
      );

      const response = await axios({
        method: isLiked ? "DELETE" : "POST",
        url: `${API_BASE_URL}/feed/${postId}/like`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Like action successful");

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
    } catch (error) {
      console.error("❌ Like error:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
      } else if (error.response?.status === 403) {
        alert("Action non autorisée.");
      }
    }
  };

  // Ouvrir/Fermer les commentaires d'un post
  const handleToggleComments = async (postId) => {
    const isExpanded = expandedComments[postId];

    if (isExpanded) {
      // Fermer les commentaires
      setExpandedComments((prev) => ({ ...prev, [postId]: false }));
    } else {
      // Ouvrir et charger les commentaires
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));

      if (!comments[postId]) {
        await loadComments(postId);
      }
    }
  };

  // Charger les commentaires d'un post
  const loadComments = async (postId) => {
    try {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      console.log("💬 Loading comments for post:", postId);

      const response = await axios.get(
        `${API_BASE_URL}/feed/${postId}/comments?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Comments loaded:", response.data.comments);

      setComments((prev) => ({
        ...prev,
        [postId]: response.data.comments,
      }));
    } catch (error) {
      console.error(
        "❌ Load comments error:",
        error.response?.data || error.message
      );
      alert("Erreur lors du chargement des commentaires");
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Ajouter un commentaire
  const handleAddComment = async (postId, content, parentId = null) => {
    if (!content.trim()) {
      alert("Le commentaire ne peut pas être vide");
      return;
    }

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      console.log("💬 Adding comment to post:", postId);

      const response = await axios.post(
        `${API_BASE_URL}/feed/${postId}/comments`,
        { content, parentId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Comment added:", response.data.comment);

      // Mettre à jour le compteur de commentaires
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: {
                  ...post.stats,
                  comments: post.stats.comments + 1,
                },
              }
            : post
        )
      );

      // Ajouter le commentaire à la liste locale
      setComments((prev) => ({
        ...prev,
        [postId]: [response.data.comment, ...(prev[postId] || [])],
      }));

      // Réinitialiser l'input et la réponse
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setReplyTo((prev) => ({ ...prev, [postId]: null }));

      return response.data.comment;
    } catch (error) {
      console.error(
        "❌ Add comment error:",
        error.response?.data || error.message
      );
      alert("Erreur lors de l'ajout du commentaire");
      throw error;
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Liker un commentaire
  const handleLikeComment = async (postId, commentId, isLiked) => {
    try {
      console.log(
        `${isLiked ? "💔" : "❤️"} ${
          isLiked ? "Unlike" : "Like"
        } comment ${commentId}`
      );

      await axios({
        method: isLiked ? "DELETE" : "POST",
        url: `${API_BASE_URL}/feed/comments/${commentId}/like`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Comment like action successful");

      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                userLiked: !isLiked,
                likes: comment.likes + (isLiked ? -1 : 1),
              }
            : comment
        ),
      }));
    } catch (error) {
      console.error(
        "❌ Like comment error:",
        error.response?.data || error.message
      );
    }
  };

  // Supprimer un commentaire
  const handleDeleteComment = async (postId, commentId) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")
    ) {
      return;
    }

    try {
      console.log("🗑️ Deleting comment:", commentId);

      await axios.delete(`${API_BASE_URL}/feed/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Comment deleted");

      // Retirer le commentaire de la liste locale
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].filter((comment) => comment.id !== commentId),
      }));

      // Décrémenter le compteur
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: {
                  ...post.stats,
                  comments: Math.max(0, post.stats.comments - 1),
                },
              }
            : post
        )
      );
    } catch (error) {
      console.error(
        "❌ Delete comment error:",
        error.response?.data || error.message
      );
      alert("Erreur lors de la suppression du commentaire");
    }
  };

  // Partager un post
  const handleShare = async (postId) => {
    try {
      console.log("📤 Sharing post:", postId);

      const sharedTo = "feed"; // Options: 'feed', 'team', 'direct'

      const response = await axios.post(
        `${API_BASE_URL}/feed/${postId}/share`,
        {
          sharedTo,
          message: null, // Optionnel
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Post shared successfully");

      // Mettre à jour le compteur de partages
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: {
                  ...post.stats,
                  shares: post.stats.shares + 1,
                },
              }
            : post
        )
      );

      alert("Post partagé avec succès !");
    } catch (error) {
      console.error("❌ Share error:", error.response?.data || error.message);
      alert("Erreur lors du partage");
    }
  };

  // Supprimer un post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce post ?")) {
      return;
    }

    try {
      console.log("🗑️ Deleting post:", postId);

      const response = await axios.delete(`${API_BASE_URL}/feed/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Post deleted");

      // Retirer le post de la liste
      setPosts((prev) => prev.filter((post) => post.id !== postId));

      alert("Post supprimé avec succès");
    } catch (error) {
      console.error("❌ Delete error:", error.response?.data || error.message);
      if (error.response?.status === 403) {
        alert("Vous n'êtes pas autorisé à supprimer ce post");
      } else {
        alert("Erreur lors de la suppression");
      }
    }
  };

  // Signaler un post
  const handleReportPost = async (postId, reason, description) => {
    try {
      console.log("🚩 Reporting post:", postId);

      const response = await axios.post(
        `${API_BASE_URL}/feed/${postId}/report`,
        {
          reason, // 'spam', 'harassment', 'inappropriate', 'false_info', 'other'
          description,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Post reported");
      alert("Signalement envoyé. Merci !");
    } catch (error) {
      console.error("❌ Report error:", error.response?.data || error.message);
      alert("Erreur lors du signalement");
    }
  };

  // Créer un post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert("Le contenu ne peut pas être vide");
      return;
    }

    setCreating(true);

    const postData = {
      type: newPostType,
      content: newPostContent,
      locationCity: user?.locationCity,
    };

    console.log("📝 Creating post:", postData);
    console.log("👤 User info:", user);
    console.log("🔑 Token present:", token ? "Yes" : "No");

    try {
      const response = await axios.post(`${API_BASE_URL}/feed`, postData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Post created successfully:", response.data);

      // Ajouter le post au feed
      const newPost = response.data.post;
      setPosts((prev) => [newPost, ...prev]);

      // Vérification du post ajouté
      console.log("📋 Post ajouté au state:", {
        id: newPost.id,
        type: newPost.post_type || newPost.type,
        content: newPost.content?.substring(0, 50) + "...",
        author: newPost.user_id || newPost.author,
      });

      setNewPostContent("");
      setShowCreateModal(false);
      alert("Post publié avec succès !");
    } catch (error) {
      console.error(
        "❌ Create post error:",
        error.response?.data || error.message
      );
      console.error("❌ Full error:", error);

      if (error.response?.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
      } else if (error.response?.status === 403) {
        alert(
          "Action non autorisée. Détails: " +
            (error.response?.data?.error || "Erreur 403")
        );
        console.error("🔍 403 Details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      } else if (error.response?.status === 400) {
        const errors = error.response?.data?.errors;
        if (errors && Array.isArray(errors)) {
          alert(
            "Erreur de validation:\n" + errors.map((e) => e.msg).join("\n")
          );
        } else {
          alert(
            "Données invalides: " +
              (error.response?.data?.error || "Erreur 400")
          );
        }
      } else {
        alert(
          "Erreur lors de la création du post: " +
            (error.response?.data?.error || error.message)
        );
      }
    } finally {
      setCreating(false);
    }
  };

  // Formater le temps
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Composant d'un post
  const PostCard = ({ post }) => {
    // Contrôle de validation du post
    React.useEffect(() => {
      // Vérifications de sécurité
      if (!post) {
        console.error("❌ PostCard: post is undefined");
        return;
      }
      if (!post.author) {
        console.error("❌ PostCard: post.author is missing", post);
        return;
      }
      if (!post.type) {
        console.error("❌ PostCard: post.type is missing", post);
        return;
      }
    }, [post]);

    // Protection contre les données manquantes
    if (!post || !post.author || !post.type) {
      console.error("❌ PostCard: Invalid post data", post);
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">⚠️ Erreur d'affichage du post</p>
          <pre className="text-xs mt-2">{JSON.stringify(post, null, 2)}</pre>
        </div>
      );
    }

    const postType = POST_TYPES[post.type];

    if (!postType) {
      console.error("❌ PostCard: Unknown post type", post.type);
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-600">
            ⚠️ Type de post inconnu: {post.type}
          </p>
        </div>
      );
    }

    const PostTypeIcon = postType.icon;

    return (
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {post.author.profilePicture ? (
              <img
                src={
                  post.author.profilePicture || "https://via.placeholder.com/40"
                }
                alt={`${post.author.firstName} ${post.author.lastName}`}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-semibold text-white ">
                {post.author.firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {post.author.firstName} {post.author.lastName}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className={`inline-flex items-center ${postType.color}`}>
                  <PostTypeIcon className="w-3 h-3 mr-1" />
                  {postType.label}
                </span>
                <span>•</span>
                <span>{formatTime(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Menu d'actions */}
          <div className="relative">
            <button
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                const menu = e.currentTarget.nextElementSibling;
                menu.classList.toggle("hidden");
              }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown menu */}
            <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {post.author.id === user?.id && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Supprimer
                </button>
              )}
              <button
                onClick={() => {
                  const reason = prompt(
                    "Raison du signalement:\n- spam\n- harassment\n- inappropriate\n- false_info\n- other"
                  );
                  if (reason) {
                    const description = prompt("Description (optionnel):");
                    handleReportPost(post.id, reason, description);
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <span className="mr-2">🚩</span>
                Signaler
              </button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-4 pb-3">
          <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
        </div>

        {/* Media */}
        {post.media && (
          <div className="w-full">
            <img
              src={post.media.url}
              alt="Post media"
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Match info */}
        {post.match && (
          <div className="mx-4 mb-3 p-3 bg-blue-50 rounded-lg flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">
              Match {post.match.status === "completed" ? "terminé" : "prévu"}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {post.stats.likes} j'aime • {post.stats.comments} commentaires
            </span>
            <span>{post.stats.shares} partages</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-2 border-t border-gray-100 flex justify-around">
          <button
            onClick={() => handleLike(post.id, post.userLiked)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
              post.userLiked ? "text-red-500" : "text-gray-600"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${post.userLiked ? "fill-current" : ""}`}
            />
            <span className="font-medium">J'aime</span>
          </button>

          <button
            onClick={() => handleToggleComments(post.id)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Commenter</span>
          </button>

          <button
            onClick={() => handleShare(post.id)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Partager</span>
          </button>
        </div>

        {/* Section des commentaires */}
        {expandedComments[post.id] && (
          <div className="border-t border-gray-100">
            {/* Input pour ajouter un commentaire */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user?.first_name?.charAt(0).toUpperCase() ||
                    user?.last_name?.charAt(0).toUpperCase() ||
                    "U"}
                </div>
                <div className="flex-1">
                  {replyTo[post.id] && (
                    <div className="mb-2 flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-blue-700">
                        Réponse à <strong>{replyTo[post.id].authorName}</strong>
                      </span>
                      <button
                        onClick={() =>
                          setReplyTo((prev) => ({ ...prev, [post.id]: null }))
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end space-x-2">
                    <textarea
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      placeholder={
                        replyTo[post.id]
                          ? "Écrivez votre réponse..."
                          : "Écrivez un commentaire..."
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows="2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (commentInputs[post.id]?.trim()) {
                            handleAddComment(
                              post.id,
                              commentInputs[post.id],
                              replyTo[post.id]?.id
                            );
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() =>
                        handleAddComment(
                          post.id,
                          commentInputs[post.id],
                          replyTo[post.id]?.id
                        )
                      }
                      disabled={
                        !commentInputs[post.id]?.trim() ||
                        submittingComment[post.id]
                      }
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {submittingComment[post.id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des commentaires */}
            <div className="px-4 pb-4">
              {loadingComments[post.id] ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : comments[post.id]?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucun commentaire pour le moment</p>
                  <p className="text-sm">Soyez le premier à commenter !</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {comments[post.id]?.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {comment?.first_name?.charAt(0).toUpperCase() ||
                          comment?.last_name?.charAt(0).toUpperCase() ||
                          "U"}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {comment?.first_name ||
                                comment?.last_name ||
                                "Utilisateur"}
                            </span>
                            {comment.author?.id === user?.id && (
                              <button
                                onClick={() =>
                                  handleDeleteComment(post.id, comment.id)
                                }
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-line">
                            {comment.content}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 ml-3">
                          <button
                            onClick={() =>
                              handleLikeComment(
                                post.id,
                                comment.id,
                                comment.userLiked
                              )
                            }
                            className={`text-xs font-medium transition-colors ${
                              comment.userLiked
                                ? "text-red-500"
                                : "text-gray-500 hover:text-red-500"
                            }`}
                          >
                            {comment.userLiked ? "❤️" : "🤍"}{" "}
                            {comment.likes > 0 && comment.likes}
                          </button>
                          <button
                            onClick={() =>
                              setReplyTo((prev) => ({
                                ...prev,
                                [post.id]: {
                                  id: comment.id,
                                  authorName:
                                    comment?.first_name ||
                                    comment?.last_name ||
                                    "Utilisateur",
                                },
                              }))
                            }
                            className="text-xs font-medium text-gray-500 hover:text-green-600 transition-colors"
                          >
                            Répondre
                          </button>
                          <span className="text-xs text-gray-400">
                            {/* {new Date(comment.createdAt).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )} */}
                            {formatTime(comment.created_at)}
                          </span>
                        </div>

                        {/* Réponses au commentaire */}
                        {comment.replies?.length > 0 && (
                          <div className="mt-3 space-y-3 ml-4 border-l-2 border-gray-200 pl-3">
                            {comment.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="flex items-start space-x-2"
                              >
                                <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  {reply.author?.name
                                    ?.charAt(0)
                                    .toUpperCase() || "U"}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-xs text-gray-900">
                                        {reply.author?.name || "Utilisateur"}
                                      </span>
                                      {reply.author?.id === user?.id && (
                                        <button
                                          onClick={() =>
                                            handleDeleteComment(
                                              post.id,
                                              reply.id
                                            )
                                          }
                                          className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-800 whitespace-pre-line">
                                      {reply.content}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-3 mt-1 ml-2">
                                    <button
                                      onClick={() =>
                                        handleLikeComment(
                                          post.id,
                                          reply.id,
                                          reply.userLiked
                                        )
                                      }
                                      className={`text-xs font-medium transition-colors ${
                                        reply.userLiked
                                          ? "text-red-500"
                                          : "text-gray-500 hover:text-red-500"
                                      }`}
                                    >
                                      {reply.userLiked ? "❤️" : "🤍"}{" "}
                                      {reply.likes > 0 && reply.likes}
                                    </button>
                                    <span className="text-xs text-gray-400">
                                      {new Date(
                                        reply.createdAt
                                      ).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🏟️ Le Terrain</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="font-medium">Publier</span>
              </button>
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === "all"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tout
              </button>
              {Object.entries(POST_TYPES).map(([key, value]) => {
                const Icon = value.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedType === key
                        ? `${value.bg} ${value.color}`
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{value.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun post pour le moment
            </h3>
            <p className="text-gray-500">
              Soyez le premier à partager quelque chose !
            </p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Créer un post</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Type de post */}
            <div className="p-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de post
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(POST_TYPES).map(([key, value]) => {
                  const Icon = value.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setNewPostType(key)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        newPostType === key
                          ? `${value.bg} ${value.color} border-current`
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{value.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Quoi de neuf ?"
                className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || creating}
                className="flex items-center space-x-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Publication...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
