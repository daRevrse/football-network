import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import PostCard from "./feed/PostCard";
import CreatePostModal from "./feed/CreatePostModal";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const ImprovedFeed = () => {
  const { token, user } = useAuth();
  const isAuthenticated = !!user;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const res = await axios.get(`${API_BASE_URL}/feed?limit=50`, config);
      setPosts(res.data.posts || []);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Erreur lors du chargement des publications");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, currentlyLiked) => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour aimer une publication");
      return;
    }

    // Optimistic update
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
      // Rollback on error
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
      toast.error("Erreur lors de l'action");
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fil d'actualités
          </h1>
          <p className="text-gray-600">
            Découvrez les dernières activités de votre communauté
          </p>
        </div>

        {/* Create Post Button */}
        {isAuthenticated && (
          <div className="mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center justify-center space-x-2 hover:bg-gray-50 transition group"
            >
              <Plus className="w-5 h-5 text-green-600 group-hover:scale-110 transition" />
              <span className="font-semibold text-gray-700">
                Créer une publication
              </span>
            </button>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune publication pour le moment
            </h3>
            <p className="text-gray-600 mb-4">
              Soyez le premier à partager quelque chose !
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
              >
                <Plus className="w-5 h-5 mr-2" />
                Créer une publication
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                isLast={index === posts.length - 1}
                onLike={handleLike}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
          token={token}
        />
      </div>
    </div>
  );
};

export default ImprovedFeed;
