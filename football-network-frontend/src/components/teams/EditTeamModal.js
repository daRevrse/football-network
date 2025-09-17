import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { X, Save, Users, MapPin, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const editTeamSchema = yup.object({
  name: yup
    .string()
    .min(3, "Minimum 3 caractères")
    .max(150, "Maximum 150 caractères")
    .required("Nom requis"),
  description: yup.string().max(1000, "Maximum 1000 caractères").optional(),
  skillLevel: yup.string().required("Niveau requis"),
  maxPlayers: yup
    .number()
    .min(8, "Minimum 8 joueurs")
    .max(30, "Maximum 30 joueurs")
    .required("Nombre maximum requis"),
  locationCity: yup.string().max(100, "Maximum 100 caractères").optional(),
});

const EditTeamModal = ({ team, onClose, onTeamUpdated }) => {
  const [updating, setUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editTeamSchema),
    defaultValues: {
      name: team.name,
      description: team.description || "",
      skillLevel: team.skillLevel,
      maxPlayers: team.maxPlayers,
      locationCity: team.locationCity || "",
    },
  });

  const skillLevels = [
    { value: "beginner", label: "Débutant" },
    { value: "amateur", label: "Amateur" },
    { value: "intermediate", label: "Intermédiaire" },
    { value: "advanced", label: "Avancé" },
    { value: "semi_pro", label: "Semi-professionnel" },
  ];

  const onSubmit = async (data) => {
    try {
      setUpdating(true);
      await axios.put(`${API_BASE_URL}/teams/${team.id}`, data);

      onTeamUpdated({ ...team, ...data });
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors de la mise à jour"
      );
      console.error("Update team error:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Modifier l'équipe
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Informations de base
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'équipe *
              </label>
              <input
                type="text"
                {...register("name")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ex: FC Amateurs Paris"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Décrivez votre équipe, vos objectifs, votre style de jeu..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Configuration équipe */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau de jeu *
                </label>
                <select
                  {...register("skillLevel")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.skillLevel ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {skillLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.skillLevel && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.skillLevel.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre maximum de joueurs *
                </label>
                <input
                  type="number"
                  {...register("maxPlayers")}
                  min="8"
                  max="30"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.maxPlayers ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.maxPlayers && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.maxPlayers.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Actuellement {team.currentPlayers} joueur
                  {team.currentPlayers !== 1 ? "s" : ""} dans l'équipe
                </p>
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Localisation
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville principale
              </label>
              <input
                type="text"
                {...register("locationCity")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.locationCity ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Paris, Lyon, Marseille..."
              />
              {errors.locationCity && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locationCity.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Cette information aide les autres équipes à vous trouver
              </p>
            </div>
          </div>

          {/* Avertissement si réduction du nombre de joueurs */}
          {team.currentPlayers > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Attention
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Si vous réduisez le nombre maximum de joueurs en dessous du
                    nombre actuel ({team.currentPlayers}), cela pourrait
                    affecter la composition de votre équipe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {updating ? "Mise à jour..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;
