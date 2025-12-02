import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Calendar,
  Award,
  Activity,
  ArrowLeft,
  Users,
  Trophy,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
      setProfile(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement du profil");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const getPositionLabel = (position) => {
    const positions = {
      goalkeeper: "Gardien de but",
      defender: "Défenseur",
      midfielder: "Milieu de terrain",
      forward: "Attaquant",
      any: "Polyvalent",
    };
    return positions[position] || position;
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

  const getUserTypeLabel = (userType) => {
    return userType === "manager" ? "Manager" : "Joueur";
  };

  const getUserTypeIcon = (userType) => {
    return userType === "manager" ? Briefcase : User;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!profile) return null;

  const UserTypeIcon = getUserTypeIcon(profile.userType);

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Retour
      </button>

      {/* Header avec photo de couverture */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-6">
        <div className="h-48 md:h-64 relative bg-gradient-to-r from-blue-600 to-indigo-700">
          {profile.coverPhotoUrl && (
            <img
              src={`${API_BASE_URL.replace("/api", "")}${
                profile.coverPhotoUrl
              }`}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="relative px-6 pb-6">
          {/* Photo de profil */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-20">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                {profile.profilePictureUrl ? (
                  <img
                    src={`${API_BASE_URL.replace("/api", "")}${
                      profile.profilePictureUrl
                    }`}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {profile.firstName?.[0]}
                      {profile.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    <UserTypeIcon className="w-4 h-4 mr-1" />
                    {getUserTypeLabel(profile.userType)}
                  </span>
                  {profile.userType === "player" && profile.position && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      {getPositionLabel(profile.position)}
                    </span>
                  )}
                  {profile.userType === "player" && profile.skillLevel && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                      <Award className="w-4 h-4 mr-1" />
                      {getSkillLabel(profile.skillLevel)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne gauche */}
            <div className="space-y-4">
              {profile.locationCity && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{profile.locationCity}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <span>
                  Membre depuis{" "}
                  {new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Colonne droite - Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-gray-900">
                  {profile.stats?.teamsCount || 0}
                </div>
                <div className="text-xs text-gray-500">
                  {profile.userType === "manager" ? "Équipe(s)" : "Équipe(s)"}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-gray-900">
                  {profile.stats?.matchesCount || 0}
                </div>
                <div className="text-xs text-gray-500">Match(s)</div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                À propos
              </h2>
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
