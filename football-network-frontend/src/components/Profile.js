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
  Activity,
  Briefcase,
  Layers,
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
  const [activeTab, setActiveTab] = useState("infos"); // 'infos', 'stats', 'teams'
  const [stats, setStats] = useState({
    teamsCount: 0,
    matchesCount: 0,
    winRate: 0,
    goals: 0,
    assists: 0,
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
      toast.error("Erreur chargement profil");
    } finally {
      setLoading(false);
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

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "" && v !== null)
      );
      await axios.put(`${API_BASE_URL}/users/profile`, cleanData);
      toast.success("Profil mis à jour !");
      setIsEditing(false);
      await loadProfile();
      if (updateUser)
        updateUser({
          ...user,
          firstName: data.firstName,
          lastName: data.lastName,
        });
    } catch (error) {
      toast.error("Erreur mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file, isProfilePicture = true) => {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("files", file);
      const uploadContext = isProfilePicture ? "user_profile" : "user_cover";

      const uploadRes = await axios.post(
        `${API_BASE_URL}/uploads?upload_context=${uploadContext}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const endpoint = isProfilePicture
        ? "/users/profile/picture"
        : "/users/profile/cover";
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        uploadId: uploadRes.data.files[0].id,
      });

      const fullUrl = `${API_BASE_URL.replace("/api", "")}${
        isProfilePicture
          ? response.data.profilePictureUrl
          : response.data.coverPhotoUrl
      }`;

      if (isProfilePicture) {
        refreshProfilePicture(fullUrl);
        toast.success("Photo de profil mise à jour");
      } else {
        refreshCoverPhoto(fullUrl);
        toast.success("Couverture mise à jour");
      }
      await loadProfile();
    } catch (error) {
      toast.error("Erreur upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value, isLink }) => (
    <div className="flex items-center py-3 border-b border-gray-50 last:border-0">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 mr-4">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
          {label}
        </p>
        <p
          className={`text-gray-900 font-medium ${
            isLink ? "text-blue-600 hover:underline cursor-pointer" : ""
          }`}
        >
          {value || "Non renseigné"}
        </p>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* --- Header Section --- */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-gray-100">
        {/* Cover Photo */}
        <div className="relative h-48 md:h-64 bg-gray-200 group">
          {coverPhotoUrl ? (
            <img
              src={coverPhotoUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-green-600 to-emerald-800 flex items-center justify-center">
              <Activity className="w-12 h-12 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

          {/* Edit Cover Button */}
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            ref={coverInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && handlePhotoUpload(e.target.files[0], false)
            }
          />
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row items-end md:items-center -mt-12 md:-mt-16 mb-4 md:mb-0">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative group">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handlePhotoUpload(e.target.files[0], true)
                }
              />
            </div>

            {/* Name & Basic Info */}
            <div className="mt-4 md:mt-0 md:ml-6 flex-1 md:pt-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {profileData?.firstName} {profileData?.lastName}
                    {profileData?.position && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium uppercase border border-green-200">
                        {
                          positions.find(
                            (p) => p.value === profileData.position
                          )?.label
                        }
                      </span>
                    )}
                  </h1>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />{" "}
                    {profileData?.locationCity || "Localisation non renseignée"}
                    <span className="mx-1">•</span>
                    <span>
                      Membre depuis{" "}
                      {new Date(profileData?.createdAt).getFullYear()}
                    </span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 md:mt-0 flex gap-3">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                    >
                      <Edit3 className="w-4 h-4 mr-2" /> Modifier
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex space-x-6 mt-8 border-b border-gray-200 overflow-x-auto">
            {["infos", "stats"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium capitalize border-b-2 transition ${
                  activeTab === tab
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "infos" ? "Informations" : "Statistiques"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bio & Quick Stats */}
        <div className="space-y-6">
          {/* Bio Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-green-600" /> À propos
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {profileData?.bio ||
                "Aucune biographie renseignée. Dites-en plus sur votre style de jeu !"}
            </p>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-orange-500" /> En bref
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.matchesCount}
                </div>
                <div className="text-xs text-gray-500 uppercase">Matchs</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.teamsCount}
                </div>
                <div className="text-xs text-gray-500 uppercase">Équipes</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center col-span-2">
                <div className="text-2xl font-bold text-green-600">
                  {stats.winRate}%
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  Taux de victoire
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details / Edit Form */}
        <div className="lg:col-span-2">
          {activeTab === "infos" ? (
            isEditing ? (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">Éditer le profil</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        {...register("firstName")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        {...register("lastName")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="text"
                        {...register("phone")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        {...register("locationCity")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <select
                        {...register("position")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                      >
                        {positions.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Niveau
                      </label>
                      <select
                        {...register("skillLevel")}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                      >
                        {skillLevels.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biographie
                      </label>
                      <textarea
                        {...register("bio")}
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                        placeholder="Racontez votre parcours..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm flex items-center"
                  >
                    {saving ? (
                      "Sauvegarde..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Enregistrer
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" /> Informations
                  personnelles
                </h3>
                <div className="space-y-2">
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={profileData?.email}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Téléphone"
                    value={profileData?.phone}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Date de naissance"
                    value={
                      profileData?.birthDate
                        ? new Date(profileData.birthDate).toLocaleDateString()
                        : null
                    }
                  />
                  <InfoRow
                    icon={Award}
                    label="Niveau"
                    value={
                      skillLevels.find(
                        (s) => s.value === profileData?.skillLevel
                      )?.label
                    }
                  />
                  <InfoRow
                    icon={Layers}
                    label="Position"
                    value={
                      positions.find((p) => p.value === profileData?.position)
                        ?.label
                    }
                  />
                </div>
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-gray-900 font-bold">
                Statistiques détaillées
              </h3>
              <p className="text-gray-500">
                Les statistiques avancées seront bientôt disponibles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
