import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  X,
  Users,
  MapPin,
  Trophy,
  Info,
  CheckCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const createTeamSchema = yup.object({
  name: yup
    .string()
    .min(3, "3 caractères min.")
    .max(150)
    .required("Nom requis"),
  description: yup.string().max(1000).optional(),
  skillLevel: yup.string().required("Niveau requis"),
  maxPlayers: yup.number().min(5).max(50).required("Max requis"),
  locationCity: yup.string().max(100).optional(),
});

const CreateTeamModal = ({ onClose, onTeamCreated }) => {
  const [creating, setCreating] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createTeamSchema),
    defaultValues: { skillLevel: "amateur", maxPlayers: 15 },
  });

  const onSubmit = async (data) => {
    try {
      setCreating(true);
      const response = await axios.post(`${API_BASE_URL}/teams`, data);

      // Construction optimiste de l'objet team
      const newTeam = {
        id: response.data.teamId,
        ...data,
        currentPlayers: 0, // Pas de joueurs au départ (le manager n'est pas compté)
        role: "manager", // Le créateur est le manager, pas le capitaine
        stats: { matchesPlayed: 0, matchesWon: 0, averageRating: 0 },
        createdAt: new Date().toISOString(),
      };

      onTeamCreated(newTeam);
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur création");
    } finally {
      setCreating(false);
    }
  };

  const InputField = ({
    label,
    name,
    type = "text",
    placeholder,
    icon: Icon,
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        )}
        <input
          type={type}
          {...register(name)}
          placeholder={placeholder}
          className={`w-full ${
            Icon ? "pl-10" : "pl-4"
          } pr-4 py-2.5 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
            errors[name] ? "border-red-500" : "border-gray-200"
          }`}
        />
      </div>
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center text-white">
            <div className="p-2 bg-green-600 rounded-lg mr-3">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Fonder un club</h2>
              <p className="text-xs text-gray-400">
                Créez votre équipe et partez à la conquête du championnat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="createTeamForm"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Section Identité */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2 mb-4 flex items-center">
                <Info className="w-4 h-4 mr-2 text-green-600" /> Identité
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InputField
                    label="Nom de l'équipe *"
                    name="name"
                    placeholder="Ex: FC Real Madrid"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    placeholder="Notre devise, notre histoire..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Section Sportive */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2 mb-4 flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-yellow-600" /> Sportif
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Niveau *
                  </label>
                  <select
                    {...register("skillLevel")}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="beginner">Débutant</option>
                    <option value="amateur">Amateur</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
                <InputField
                  label="Effectif Max *"
                  name="maxPlayers"
                  type="number"
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Ville Principale"
                    name="locationCity"
                    icon={MapPin}
                    placeholder="Paris"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            form="createTeamForm"
            type="submit"
            disabled={creating}
            className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-600/20 disabled:opacity-50 flex items-center"
          >
            {creating ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {creating ? "Création..." : "Lancer l'équipe"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;
