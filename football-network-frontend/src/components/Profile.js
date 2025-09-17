import React, { useState, useEffect } from "react";
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
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
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

  // Charger le profil au montage du composant
  useEffect(() => {
    loadProfile();
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
      await loadProfile(); // Recharger les données
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors de la mise à jour"
      );
      console.error("Update profile error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset(); // Reset du formulaire aux valeurs d'origine
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {profileData?.firstName} {profileData?.lastName}
                </h1>
                <p className="text-green-100 mt-1">
                  {getPositionLabel(profileData?.position)} •{" "}
                  {getSkillLevelLabel(profileData?.skillLevel)}
                </p>
                <p className="text-green-100 text-sm mt-1">
                  Membre depuis {formatDate(profileData?.createdAt)}
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
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
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                        errors.bio ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Parlez-nous de votre parcours footballistique, vos préférences de jeu..."
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg min-h-[100px]">
                      {profileData?.bio || "Aucune biographie renseignée"}
                    </p>
                  )}
                  {errors.bio && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.bio.message}
                    </p>
                  )}
                </div>

                {/* Statistiques si disponibles */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Statistiques
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600">Équipes rejointes:</span>
                      <p className="font-semibold">À venir</p>
                    </div>
                    <div>
                      <span className="text-green-600">Matchs joués:</span>
                      <p className="font-semibold">À venir</p>
                    </div>
                  </div>
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
