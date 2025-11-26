import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MapPin, Save, ArrowLeft } from "lucide-react";

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

      // Envoi des données vers la nouvelle route venue-owner
      await axios.post(`${API_BASE_URL}/venue-owner/venues`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Terrain créé avec succès !");
      navigate("/venue-owner");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création du terrain");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/venue-owner")}
        className="flex items-center text-gray-500 mb-4 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Retour
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Ajouter un nouveau terrain
        </h1>
        <p className="text-gray-500">Remplissez les informations ci-dessous.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du terrain
              </label>
              <input
                {...register("name", { required: "Le nom est requis" })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Ex: Urban Soccer Center"
              />
              {errors.name && (
                <span className="text-red-500 text-xs">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone Manager
              </label>
              <input
                {...register("managerPhone")}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                {...register("fieldType")}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="indoor">Indoor (Intérieur)</option>
                <option value="outdoor">Outdoor (Extérieur)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surface
              </label>
              <select
                {...register("fieldSurface")}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="synthetic">Synthétique</option>
                <option value="natural_grass">Herbe naturelle</option>
                <option value="parquet">Parquet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                {...register("fieldSize")}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="5v5">5 vs 5</option>
                <option value="7v7">7 vs 7</option>
                <option value="11v11">11 vs 11</option>
              </select>
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
            <Save className="w-4 h-4" />{" "}
            {loading ? "Création..." : "Créer le terrain"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenueForm;
