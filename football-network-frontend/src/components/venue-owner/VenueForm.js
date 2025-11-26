import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MapPin, Upload, Save, Info } from "lucide-react";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VenueForm = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Préparer le payload selon les attentes du backend
      const payload = {
        name: data.name,
        address: data.address,
        city: data.city,
        field_type: data.field_type,
        surface: data.surface,
        capacity: data.capacity ? parseInt(data.capacity) : undefined,
        pricePerHour: data.pricePerHour ? parseFloat(data.pricePerHour) : undefined,
      };

      await axios.post(`${API_BASE_URL}/venue-owner/venues`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Terrain ajouté avec succès !");
      navigate("/venue-owner");
    } catch (error) {
      console.error(error);
      toast.error(
        "Erreur lors de la création (Vérifiez que vous avez les droits)"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Ajouter un nouveau terrain
        </h1>
        <p className="text-gray-500">
          Remplissez les informations pour rendre votre terrain visible.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="p-6 space-y-6">
          {/* Info de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du complexe / terrain
              </label>
              <input
                {...register("name", { required: "Le nom est requis" })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ex: Five Sport Arena"
              />
              {errors.name && (
                <span className="text-red-500 text-xs">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse complète
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  {...register("address", {
                    required: "L'adresse est requise",
                  })}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="123 rue du Stade..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <input
                {...register("city", { required: "La ville est requise" })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

          </div>

          <div className="border-t border-gray-100 my-6"></div>

          {/* Caractéristiques Techniques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de terrain
              </label>
              <select
                {...register("field_type")}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="indoor">Indoor (Intérieur)</option>
                <option value="outdoor">Outdoor (Extérieur)</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surface
              </label>
              <select
                {...register("surface")}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="synthetic">Synthétique</option>
                <option value="natural_grass">Herbe naturelle</option>
                <option value="parquet">Parquet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacité (Joueurs)
              </label>
              <input
                type="number"
                {...register("capacity")}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ex: 22"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix par Heure (€)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("pricePerHour")}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ex: 50.00"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 flex justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/venue-owner")}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
          >
            {loading ? (
              "Création..."
            ) : (
              <>
                <Save className="w-4 h-4" /> Créer le terrain
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenueForm;
