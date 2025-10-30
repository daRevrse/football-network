import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Heart,
  MessageCircle,
  Share2,
  Users,
  Calendar,
  Trophy,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Feed = () => {
  const { token, user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [creating, setCreating] = useState(false);
  const [suggestedTeams, setSuggestedTeams] = useState([]);
  const [trendingMatches, setTrendingMatches] = useState([]);

  // Charger les posts
  useEffect(() => {
    loadFeed();
    loadSidebarData();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Erreur lors du chargement du feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSidebarData = async () => {
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/teams/suggestions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/matches/trending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setSuggestedTeams(teamsRes.data.teams || []);
      setTrendingMatches(matchesRes.data.matches || []);
    } catch (error) {
      console.error("Erreur sidebar:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/feed`,
        { content: newPost },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts([res.data.post, ...posts]);
      setNewPost("");
    } catch (error) {
      alert("Erreur lors de la création du post");
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId, liked) => {
    try {
      await axios({
        method: liked ? "DELETE" : "POST",
        url: `${API_BASE_URL}/feed/${postId}/like`,
        headers: { Authorization: `Bearer ${token}` },
      });
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
    } catch (error) {
      console.error("Erreur like:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Colonne principale */}
      <main className="flex-1 max-w-2xl mx-auto py-6 px-4">
        {/* Zone de publication */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white font-semibold flex items-center justify-center">
              {user?.first_name?.[0]?.toUpperCase() || "U"}
            </div>
            <textarea
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
              placeholder="Partagez un résultat, un match à venir, ou un moment fort..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleCreatePost}
              disabled={creating || !newPost.trim()}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              <span>Publier</span>
            </button>
          </div>
        </div>

        {/* Flux principal */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Aucun post pour le moment ⚽
            <p className="text-sm">Publie ton premier message !</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow-sm mb-5 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                    {post.author?.first_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {post.author?.first_name} {post.author?.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-gray-800 whitespace-pre-line">
                {post.content}
              </p>

              {post.media && (
                <img
                  src={post.media.url}
                  alt="Media"
                  className="mt-3 w-full rounded-lg object-cover max-h-96"
                />
              )}

              <div className="flex justify-around mt-4 border-t border-gray-100 pt-2 text-gray-600">
                <button
                  onClick={() => handleLike(post.id, post.userLiked)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-gray-50 ${
                    post.userLiked ? "text-red-500" : ""
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      post.userLiked ? "fill-current" : ""
                    }`}
                  />
                  <span>{post.stats?.likes || 0}</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-gray-50">
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.stats?.comments || 0}</span>
                </button>
                <button
                  onClick={() => alert("Fonctionnalité à venir !")}
                  className="flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-gray-50"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{post.stats?.shares || 0}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Barre latérale droite */}
      <aside className="hidden lg:block w-80 p-6 space-y-6">
        {/* Matchs populaires */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3 flex items-center space-x-2 text-gray-800">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Matchs populaires</span>
          </h3>
          <div className="space-y-3">
            {trendingMatches.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="text-sm text-gray-700 border-b pb-2 last:border-0"
              >
                <p className="font-medium">
                  {m.home_team} vs {m.away_team}
                </p>
                <p className="text-gray-500 flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(m.match_date).toLocaleDateString("fr-FR")}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions d’équipes */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3 flex items-center space-x-2 text-gray-800">
            <Users className="w-5 h-5 text-green-500" />
            <span>Équipes à suivre</span>
          </h3>
          <div className="space-y-3">
            {suggestedTeams.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold">
                    {t.name[0]}
                  </div>
                  <span className="text-gray-800 font-medium">{t.name}</span>
                </div>
                <button className="text-sm text-green-600 hover:underline">
                  Suivre
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Feed;
