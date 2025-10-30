import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Edit3,
  X,
  Camera,
  Upload,
  Trash2,
  Award,
  Users as UsersIcon,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Schema de validation pour le profil
const profileSchema = yup.object({
  firstName: yup
    .string()
    .min(2, "Minimum 2 caractères")
    .required("Prénom requis"),
  lastName: yup.string().min(2, "Minimum 2 caractères").required("Nom requis"),
  phone: yup.string().optional(),
  birthDate: yup.date().optional().nullable(),
  bio: yup.string().max(500, "Maximum 500 caractères").optional(),
  position: yup.string().optional(),
  skillLevel: yup.string().optional(),
  locationCity: yup.string().max(100, "Maximum 100 caractères").optional(),
});

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(null);
  const [stats, setStats] = useState({
    teamsCount: 0,
    matchesCount: 0,
    winRate: 0,
  });

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(profileSchema),
  });

  // Options pour les sélects
  const positions = [
    { value: "goalkeeper", label: "Gardien de but" },
    { value: "defender", label: "Défenseur" },
    { value: "midfielder", label: "Milieu de terrain" },
    { value: "forward", label: "Attaquant" },
    { value: "any", label: "Polyvalent" },
  ];

  const skillLevels = [
    { value: "beginner", label: "Débutant" },
    { value: "amateur", label: "Amateur" },
    { value: "intermediate", label: "Intermédiaire" },
    { value: "advanced", label: "Avancé" },
    { value: "semi_pro", label: "Semi-professionnel" },
  ];

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/profile`);
      const profile = response.data;

      setProfileData(profile);

      // Charger les URLs des photos
      if (profile.profilePictureUrl) {
        setProfilePictureUrl(
          `${API_BASE_URL.replace("/api", "")}${profile.profilePictureUrl}`
        );
      }
      if (profile.coverPhotoUrl) {
        setCoverPhotoUrl(
          `${API_BASE_URL.replace("/api", "")}${profile.coverPhotoUrl}`
        );
      }

      // Pré-remplir le formulaire
      reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        birthDate: profile.birthDate ? profile.birthDate.split("T")[0] : "",
        bio: profile.bio || "",
        position: profile.position || "any",
        skillLevel: profile.skillLevel || "amateur",
        locationCity: profile.locationCity || "",
      });
    } catch (error) {
      toast.error("Erreur lors du chargement du profil");
      console.error("Load profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Charger les statistiques de l'utilisateur
      const response = await axios.get(`${API_BASE_URL}/users/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Load stats error:", error);
      // Les stats ne sont pas critiques, on ne fait pas de toast
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      // Nettoyer les données (enlever les champs vides)
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== "" && value !== null
        )
      );

      await axios.put(`${API_BASE_URL}/users/profile`, cleanData);

      toast.success("Profil mis à jour avec succès !");
      setIsEditing(false);
      await loadProfile();

      // Mettre à jour le contexte Auth si nécessaire
      if (updateUser) {
        updateUser({
          ...user,
          firstName: data.firstName,
          lastName: data.lastName,
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors de la mise à jour"
      );
      console.error("Update profile error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file, isProfilePicture = true) => {
    try {
      setUploadingPhoto(true);

      // Validation du fichier
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }

      // Étape 1: Upload du fichier
      const formData = new FormData();
      formData.append("files", file);

      // ✅ IMPORTANT: Passer le contexte en QUERY PARAM, pas dans formData
      const uploadContext = isProfilePicture ? "user_profile" : "user_cover";

      const uploadResponse = await axios.post(
        `${API_BASE_URL}/uploads?upload_context=${uploadContext}`, // ← QUERY PARAM ICI
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadId = uploadResponse.data.files[0].id;
      const uploadUrl = uploadResponse.data.files[0].url;

      // Étape 2: Associer la photo au profil
      const endpoint = isProfilePicture
        ? "/users/profile/picture"
        : "/users/profile/cover";

      await axios.post(`${API_BASE_URL}${endpoint}`, { uploadId });

      // Mettre à jour l'affichage local
      const fullUrl = `${API_BASE_URL.replace("/api", "")}${uploadUrl}`;

      if (isProfilePicture) {
        setProfilePictureUrl(fullUrl);
        toast.success("Photo de profil mise à jour !");
      } else {
        setCoverPhotoUrl(fullUrl);
        toast.success("Photo de couverture mise à jour !");
      }

      await loadProfile();
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error(
        error.response?.data?.error || "Erreur lors de l'upload de la photo"
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (isProfilePicture = true) => {
    try {
      const endpoint = isProfilePicture
        ? "/users/profile/picture"
        : "/users/profile/cover";

      await axios.delete(`${API_BASE_URL}${endpoint}`);

      if (isProfilePicture) {
        setProfilePictureUrl(null);
        toast.success("Photo de profil supprimée");
      } else {
        setCoverPhotoUrl(null);
        toast.success("Photo de couverture supprimée");
      }

      await loadProfile();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error("Remove photo error:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const getPositionLabel = (position) => {
    return positions.find((p) => p.value === position)?.label || position;
  };

  const getSkillLevelLabel = (skillLevel) => {
    return skillLevels.find((s) => s.value === skillLevel)?.label || skillLevel;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Photo de couverture */}
        <div className="relative h-48 bg-gradient-to-r from-green-500 to-green-600">
          {coverPhotoUrl ? (
            <img
              src={coverPhotoUrl}
              alt="Couverture"
              className="w-full h-full object-cover"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>

          {/* Boutons pour changer la couverture */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="bg-white/90 hover:bg-white p-2 rounded-lg transition-colors shadow-lg"
              title="Changer la photo de couverture"
            >
              <Camera className="w-5 h-5 text-gray-700" />
            </button>
            {coverPhotoUrl && (
              <button
                onClick={() => handleRemovePhoto(false)}
                className="bg-red-500/90 hover:bg-red-600 p-2 rounded-lg transition-colors shadow-lg text-white"
                title="Supprimer la photo de couverture"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file, false);
            }}
          />
        </div>

        {/* Header avec photo de profil */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            {/* Photo de profil */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>

              {/* Bouton pour changer la photo de profil */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 bg-white hover:bg-gray-50 p-2 rounded-full shadow-lg border-2 border-gray-200 transition-colors"
                title="Changer la photo de profil"
              >
                {uploadingPhoto ? (
                  <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
                ) : (
                  <Camera className="w-5 h-5 text-gray-700" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file, true);
                }}
              />
            </div>

            {/* Infos utilisateur */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profileData?.firstName} {profileData?.lastName}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {getPositionLabel(profileData?.position)} •{" "}
                    {getSkillLevelLabel(profileData?.skillLevel)}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Membre depuis {formatDate(profileData?.createdAt)}
                  </p>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier le profil
                  </button>
                )}
              </div>

              {/* Statistiques en ligne */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-600">
                    <UsersIcon className="w-4 h-4" />
                    <span className="text-sm">Équipes</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.teamsCount || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">Matchs</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.matchesCount || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Victoires</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.winRate ? `${stats.winRate}%` : "0%"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 border-t">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informations personnelles */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Informations personnelles
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        {...register("firstName")}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.firstName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg">
                        {profileData?.firstName}
                      </p>
                    )}
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        {...register("lastName")}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-gray-50 rounded-lg">
                        {profileData?.lastName}
                      </p>
                    )}
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600">
                    {profileData?.email}
                    <span className="text-xs text-gray-500 block mt-1">
                      (non modifiable)
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Téléphone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      {...register("phone")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="06 12 34 56 78"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">
                      {profileData?.phone || "Non renseigné"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Date de naissance
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      {...register("birthDate")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">
                      {formatDate(profileData?.birthDate)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Ville
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      {...register("locationCity")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Paris, Lyon, Marseille..."
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">
                      {profileData?.locationCity || "Non renseignée"}
                    </p>
                  )}
                </div>
              </div>

              {/* Informations football */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Profil football
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position préférée
                  </label>
                  {isEditing ? (
                    <select
                      {...register("position")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {positions.map((position) => (
                        <option key={position.value} value={position.value}>
                          {position.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">
                      {getPositionLabel(profileData?.position)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de jeu
                  </label>
                  {isEditing ? (
                    <select
                      {...register("skillLevel")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {skillLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">
                      {getSkillLevelLabel(profileData?.skillLevel)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biographie
                  </label>
                  {isEditing ? (
                    <textarea
                      {...register("bio")}
                      rows={6}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                        errors.bio ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Parlez-nous de votre parcours footballistique, vos préférences de jeu..."
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg min-h-[140px] whitespace-pre-wrap">
                      {profileData?.bio || "Aucune biographie renseignée"}
                    </p>
                  )}
                  {errors.bio && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.bio.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
