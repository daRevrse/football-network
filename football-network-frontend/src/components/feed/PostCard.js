import React from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Calendar,
  Trophy,
  Users,
  UserPlus,
  Target,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Composant pour Match à venir
const MatchAnnouncementPost = ({ post, onLike }) => {
  const matchDate = post.matchDate || post.match_date;

  return (
    <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-5">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2.5 rounded-full">
          <Calendar className="w-5 h-5 text-blue-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-bold text-blue-900">Match à venir</h3>
          <p className="text-sm text-blue-700">
            {matchDate
              ? new Date(matchDate).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Date à confirmer"}
          </p>
        </div>
      </div>

      {post.team && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-blue-50">
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center w-1/3">
              <div className="font-bold text-gray-900 truncate">
                {post.team.name || "Notre équipe"}
              </div>
              <div className="text-xs text-gray-500">Domicile</div>
            </div>
            <div className="text-sm font-bold text-blue-400 px-2">VS</div>
            <div className="text-center w-1/3">
              <div className="font-bold text-gray-900 truncate">
                {post.matchOpponent || post.match_opponent || "Adversaire"}
              </div>
              <div className="text-sm text-gray-600">Extérieur</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 border border-blue-50">
        <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>
      </div>

      {post.location && (
        <div className="mt-4 flex items-center text-xs text-blue-600 font-medium">
          <MapPin className="w-3.5 h-3.5 mr-1" />
          {post.location.city}
        </div>
      )}
    </div>
  );
};

// Composant pour Résultat de match
const MatchResultPost = ({ post, onLike }) => {
  const homeScore = post.matchScoreHome ?? post.match_score_home ?? 0;
  const awayScore = post.matchScoreAway ?? post.match_score_away ?? 0;
  const isWin = homeScore > awayScore;
  const isDraw = homeScore === awayScore;

  const bgColor = isWin
    ? "bg-emerald-50/50 border-emerald-100/50"
    : isDraw
    ? "bg-amber-50/50 border-amber-100/50"
    : "bg-red-50/50 border-red-100/50";

  const iconBg = isWin
    ? "bg-emerald-100"
    : isDraw
    ? "bg-amber-100"
    : "bg-red-100";
  const iconColor = isWin
    ? "text-emerald-600"
    : isDraw
    ? "text-amber-600"
    : "text-red-600";
  const textColor = isWin
    ? "text-emerald-900"
    : isDraw
    ? "text-amber-900"
    : "text-red-900";

  return (
    <div className={`${bgColor} border rounded-xl p-5`}>
      <div className="flex items-center mb-4">
        <div className={`${iconBg} p-2.5 rounded-full`}>
          <Trophy className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="ml-4">
          <h3 className={`text-lg font-bold ${textColor}`}>
            {isWin ? "Victoire ! 🎉" : isDraw ? "Match nul" : "Défaite"}
          </h3>
          <p className="text-sm text-gray-700">Résultat du match</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 mb-4 border border-white/50 shadow-sm">
        <div className="flex items-center justify-center space-x-6">
          <div className="text-center flex-1">
            <div className="font-bold text-sm text-gray-500 mb-1 truncate">
              {post.team?.name || "Notre équipe"}
            </div>
            <div className="text-4xl font-black text-gray-900">{homeScore}</div>
          </div>
          <div className="text-xl font-bold text-gray-300">-</div>
          <div className="text-center flex-1">
            <div className="font-bold text-sm text-gray-500 mb-1 truncate">
              {post.matchOpponent || post.match_opponent || "Adversaire"}
            </div>
            <div className="text-4xl font-black text-gray-900">{awayScore}</div>
          </div>
        </div>
      </div>

      <div className="bg-white/70 rounded-lg p-4">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
      </div>
    </div>
  );
};

// Composant pour Recrutement
const RecruitmentPost = ({ post, onLike }) => {
  const skillLevels = {
    beginner: "Débutant",
    amateur: "Amateur",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
    semi_pro: "Semi-professionnel",
  };

  const positions = {
    goalkeeper: "Gardien",
    defender: "Défenseur",
    midfielder: "Milieu",
    forward: "Attaquant",
    any: "Tous postes",
  };

  return (
    <div className="bg-purple-50/50 border border-purple-100/50 rounded-xl p-5">
      <div className="flex items-center mb-4">
        <div className="bg-purple-100 p-2.5 rounded-full">
          <UserPlus className="w-5 h-5 text-purple-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-bold text-purple-900">Recrutement</h3>
          <p className="text-sm text-purple-700">
            {post.team?.name || "Équipe"} recherche des joueurs
          </p>
        </div>
      </div>

      <div className="bg-white/80 rounded-lg p-5 mb-4 space-y-3">
        {(post.recruitmentPosition || post.recruitment_position) && (
          <div className="flex items-center">
            <Target className="w-5 h-5 text-purple-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600 uppercase font-semibold">
                Poste recherché
              </div>
              <div className="text-lg font-bold text-gray-900">
                {positions[
                  post.recruitmentPosition || post.recruitment_position
                ] ||
                  post.recruitmentPosition ||
                  post.recruitment_position}
              </div>
            </div>
          </div>
        )}

        {(post.recruitmentSkillLevel || post.recruitment_skill_level) && (
          <div className="flex items-center">
            <Trophy className="w-5 h-5 text-purple-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600 uppercase font-semibold">
                Niveau demandé
              </div>
              <div className="text-lg font-bold text-gray-900">
                {skillLevels[
                  post.recruitmentSkillLevel || post.recruitment_skill_level
                ] ||
                  post.recruitmentSkillLevel ||
                  post.recruitment_skill_level}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 border border-purple-50">
        <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>
      </div>

      {(post.recruitmentDescription || post.recruitment_description) && (
        <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100/50 mb-4">
          <p className="text-sm text-purple-800 leading-relaxed">
            {post.recruitmentDescription || post.recruitment_description}
          </p>
        </div>
      )}

      <div>
        <button className="w-full bg-white border border-purple-200 text-purple-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center text-sm shadow-sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Postuler
        </button>
      </div>
    </div>
  );
};

// Composant pour Publication avec média
const MediaPost = ({ post, onLike }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="p-4">
        <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>
      </div>

      {post.media && (
        <div className="relative bg-black">
          {post.media.type === "video" ? (
            <video
              controls
              className="w-full max-h-[400px] object-cover"
              poster={post.media.thumbnail}
            >
              <source src={post.media.url} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          ) : (
            <img
              src={post.media.url}
              alt="Post media"
              className="w-full max-h-[400px] object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
};

// Composant pour Publication générale
const GeneralPost = ({ post, onLike }) => {
  return (
    <div className="bg-white rounded-xl p-6">
      <p className="text-gray-800 leading-relaxed whitespace-pre-line">
        {post.content}
      </p>
    </div>
  );
};

// Composant principal PostCard
const PostCard = ({ post, isLast, onLike, isAuthenticated }) => {
  const handleLike = () => {
    if (onLike) {
      onLike(post.id, post.userLiked);
    }
  };

  const renderPostContent = () => {
    switch (post.type || post.post_type) {
      case "match_announcement":
        return <MatchAnnouncementPost post={post} onLike={handleLike} />;
      case "match_result":
        return <MatchResultPost post={post} onLike={handleLike} />;
      case "recruitment":
        return <RecruitmentPost post={post} onLike={handleLike} />;
      case "media":
        return <MediaPost post={post} onLike={handleLike} />;
      case "general":
      default:
        return <GeneralPost post={post} onLike={handleLike} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden border border-gray-100">
      {/* Header du post */}
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
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shadow-sm">
              {post.author?.profilePictureUrl ? (
                <img
                  src={
                    API_BASE_URL.replace("/api", "") +
                    post.author.profilePictureUrl
                  }
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
            <div className="text-xs text-gray-500">
              {new Date(post.createdAt || post.created_at).toLocaleDateString(
                "fr-FR",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu du post */}
      <div className="px-4 pb-4">{renderPostContent()}</div>

      {/* Footer avec actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex space-x-6">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1.5 text-sm font-medium transition ${
              post.userLiked || post.user_liked
                ? "text-red-500"
                : "text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${
                post.userLiked || post.user_liked ? "fill-current" : ""
              }`}
            />
            <span>{post.stats?.likes || post.likes_count || 0}</span>
          </button>
          <button className="flex items-center space-x-1.5 text-sm font-medium text-gray-500 hover:text-blue-500 transition">
            <MessageCircle className="w-5 h-5" />
            <span>{post.stats?.comments || post.comments_count || 0}</span>
          </button>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
