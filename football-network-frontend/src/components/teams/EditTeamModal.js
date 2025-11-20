import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  X,
  Save,
  Users,
  MapPin,
  Trophy,
  Info,
  AlertTriangle,
  Loader2,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const editTeamSchema = yup.object({
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

  const onSubmit = async (data) => {
    try {
      setUpdating(true);
      await axios.put(`${API_BASE_URL}/teams/${team.id}`, data);
      onTeamUpdated({ ...team, ...data });
      toast.success("Modifications enregistrées");
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  const InputField = ({
    label,
    name,
    type = "text",
    placeholder,
    icon: Icon,
    ...props
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
          } pr-4 py-2.5 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
            errors[name] ? "border-red-500" : "border-gray-200"
          }`}
          {...props}
        />
      </div>
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center text-white">
            <div className="p-2 bg-blue-600 rounded-lg mr-3">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Paramètres de l'équipe</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="editTeamForm"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Section Générale */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2 mb-4 flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-600" /> Général
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InputField
                    label="Nom de l'équipe"
                    name="name"
                    placeholder="Ex: FC Paris"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Section Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2 mb-4 flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-yellow-600" />{" "}
                Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Niveau
                  </label>
                  <select
                    {...register("skillLevel")}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="beginner">Débutant</option>
                    <option value="amateur">Amateur</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                    <option value="semi_pro">Semi-pro</option>
                  </select>
                </div>
                <div>
                  <InputField
                    label="Effectif Max"
                    name="maxPlayers"
                    type="number"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Actuellement : {team.currentPlayers} joueurs
                  </p>
                </div>
                <div className="md:col-span-2">
                  <InputField label="Ville" name="locationCity" icon={MapPin} />
                </div>
              </div>

              {/* Warning Zone */}
              {team.currentPlayers > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start mt-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Attention : réduire le nombre maximum de joueurs en dessous
                    de l'effectif actuel peut bloquer de nouvelles inscriptions.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            form="editTeamForm"
            type="submit"
            disabled={updating}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center"
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {updating ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTeamModal;
