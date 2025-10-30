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
  Trash2,
  Award,
  Users as UsersIcon,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../contexts/UserContext";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Schema de validation
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
  const {
    profilePictureUrl,
    coverPhotoUrl,
    refreshProfilePicture,
    refreshCoverPhoto,
  } = useUserProfile();

  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  // Chargement initial
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
      const response = await axios.get(`${API_BASE_URL}/users/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Load stats error:", error);
      // Stats non critiques
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);

      // Nettoyer les données vides
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== "" && value !== null
        )
      );

      await axios.put(`${API_BASE_URL}/users/profile`, cleanData);

      toast.success("Profil mis à jour avec succès !");
      setIsEditing(false);
      await loadProfile();

      // Mettre à jour le contexte Auth
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

      // Validation
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

      const uploadContext = isProfilePicture ? "user_profile" : "user_cover";

      const uploadResponse = await axios.post(
        `${API_BASE_URL}/uploads?upload_context=${uploadContext}`,
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

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        uploadId,
      });

      // Étape 3: Mettre à jour le contexte avec l'URL retournée par le backend
      const photoUrl = isProfilePicture
        ? response.data.profilePictureUrl
        : response.data.coverPhotoUrl;

      const fullUrl = `${API_BASE_URL.replace("/api", "")}${photoUrl}`;

      if (isProfilePicture) {
        refreshProfilePicture(fullUrl);
        toast.success("Photo de profil mise à jour !");
      } else {
        refreshCoverPhoto(fullUrl);
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
    const photoType = isProfilePicture
      ? "photo de profil"
      : "photo de couverture";

    // Confirmation avant suppression
    if (
      !window.confirm(`Êtes-vous sûr de vouloir supprimer votre ${photoType} ?`)
    ) {
      return;
    }

    try {
      const endpoint = isProfilePicture
        ? "/users/profile/picture"
        : "/users/profile/cover";

      await axios.delete(`${API_BASE_URL}${endpoint}`);

      // Mettre à jour le contexte
      if (isProfilePicture) {
        refreshProfilePicture(null);
        toast.success("Photo de profil supprimée");
      } else {
        refreshCoverPhoto(null);
        toast.success("Photo de couverture supprimée");
      }

      await loadProfile();
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Erreur lors de la suppression";
      toast.error(errorMsg);
      console.error("Remove photo error:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPositionLabel = (position) => {
    return (
      positions.find((p) => p.value === position)?.label ||
      position ||
      "Non renseigné"
    );
  };

  const getSkillLevelLabel = (skillLevel) => {
    return (
      skillLevels.find((s) => s.value === skillLevel)?.label ||
      skillLevel ||
      "Non renseigné"
    );
  };

  const getMemberSince = (createdAt) => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Photo de couverture avec nom et bouton modifier */}
        <div className="relative h-64 bg-gradient-to-r from-green-500 via-green-600 to-green-700">
          {coverPhotoUrl && (
            <img
              src={coverPhotoUrl}
              alt="Couverture"
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>

          {/* Nom de l'utilisateur sur la couverture */}
          <div className="absolute bottom-8 left-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              {profileData?.firstName} {profileData?.lastName}
            </h1>
            <p className="text-white/90 text-sm mt-1 drop-shadow">
              {profileData?.email}
            </p>
          </div>

          {/* Bouton modifier en haut à droite */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-6 right-6 flex items-center gap-2 bg-white text-green-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all shadow-lg font-semibold"
            >
              <Edit3 className="w-4 h-4" />
              Modifier le profil
            </button>
          )}

          {/* Boutons pour la couverture */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="bg-white/95 hover:bg-white p-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              title="Changer la photo de couverture"
            >
              <Camera className="w-5 h-5 text-gray-700" />
            </button>
            {coverPhotoUrl && (
              <button
                onClick={() => handleRemovePhoto(false)}
                className="bg-red-500/95 hover:bg-red-600 p-3 rounded-lg transition-all shadow-lg hover:shadow-xl text-white"
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

        {/* Photo de profil et statistiques */}
        <div className="px-6 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row gap-6 -mt-16">
            {/* Photo de profil */}
            <div className="relative flex-shrink-0">
              <div className="w-40 h-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <User className="w-20 h-20 text-white" />
                  </div>
                )}
              </div>

              {/* Boutons pour gérer la photo de profil */}
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="bg-white hover:bg-gray-50 p-2 rounded-full shadow-lg border-2 border-gray-200 transition-all hover:scale-110 disabled:opacity-50"
                  title="Changer la photo de profil"
                >
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500" />
                  ) : (
                    <Camera className="w-4 h-4 text-gray-700" />
                  )}
                </button>

                {profilePictureUrl && (
                  <button
                    onClick={() => handleRemovePhoto(true)}
                    className="bg-red-500 hover:bg-red-600 p-2 rounded-full shadow-lg transition-all hover:scale-110 text-white"
                    title="Supprimer la photo de profil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

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

            {/* Statistiques et date d'inscription */}
            <div className="flex-1 flex flex-col justify-end pb-2">
              {/* Date d'inscription */}
              {profileData?.createdAt && (
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Membre depuis {getMemberSince(profileData.createdAt)}
                </p>
              )}

              {/* Statistiques en ligne */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Équipes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.teamsCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Matchs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.matchesCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Victoires</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.winRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="px-6 sm:px-8 pb-8 pt-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section Informations personnelles */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 pb-3 border-b-2 border-gray-200">
                    Informations personnelles
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Prénom *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          {...register("firstName")}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                            errors.firstName
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg font-medium text-gray-900">
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nom *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          {...register("lastName")}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                            errors.lastName
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg font-medium text-gray-900">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-2" />
                      Email
                    </label>
                    <div className="px-4 py-3 bg-gray-100 rounded-lg border-2 border-gray-200">
                      <p className="text-gray-700 font-medium">
                        {profileData?.email}
                      </p>
                      <span className="text-xs text-gray-500 block mt-1">
                        L'email ne peut pas être modifié
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="inline w-4 h-4 mr-2" />
                      Téléphone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        {...register("phone")}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="06 12 34 56 78"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profileData?.phone || "Non renseigné"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Date de naissance
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        {...register("birthDate")}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {formatDate(profileData?.birthDate)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-2" />
                      Ville
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        {...register("locationCity")}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Paris, Lyon, Marseille..."
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profileData?.locationCity || "Non renseignée"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section Profil football */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 pb-3 border-b-2 border-gray-200">
                    Profil football
                  </h2>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Position préférée
                    </label>
                    {isEditing ? (
                      <select
                        {...register("position")}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                      >
                        {positions.map((position) => (
                          <option key={position.value} value={position.value}>
                            {position.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {getPositionLabel(profileData?.position)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Niveau de jeu
                    </label>
                    {isEditing ? (
                      <select
                        {...register("skillLevel")}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                      >
                        {skillLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {getSkillLevelLabel(profileData?.skillLevel)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Biographie
                    </label>
                    {isEditing ? (
                      <textarea
                        {...register("bio")}
                        rows={8}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all ${
                          errors.bio ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Parlez-nous de votre parcours footballistique, vos préférences de jeu, vos expériences..."
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg min-h-[200px]">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {profileData?.bio || "Aucune biographie renseignée"}
                        </p>
                      </div>
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
                <div className="mt-8 flex justify-end gap-4 pt-6 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-medium"
                  >
                    <X className="w-5 h-5" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
