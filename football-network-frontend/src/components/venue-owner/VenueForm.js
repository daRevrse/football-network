import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MapPin, ArrowLeft, Loader2, Building2, Phone, ChevronDown } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VenueForm = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fieldType: "indoor",
      fieldSurface: "synthetic",
      fieldSize: "5v5",
    },
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
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
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/venue-owner")}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Retour au tableau de bord</span>
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Ajouter un terrain</h1>
        <p className="text-gray-500 mt-1">Renseignez les informations de votre nouveau terrain.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-medium text-gray-900 mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom du terrain *
              </label>
              <input
                {...register("name", { required: "Le nom est requis" })}
                className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${
                  errors.name ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="Ex: Urban Soccer Center"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("address", { required: "L'adresse est requise" })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${
                    errors.address ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="123 rue du Stade"
                />
              </div>
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ville *
                </label>
                <input
                  {...register("city", { required: "La ville est requise" })}
                  className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${
                    errors.city ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Paris"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Téléphone du manager
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register("managerPhone")}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Field Specs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-medium text-gray-900 mb-4">Caractéristiques du terrain</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type
              </label>
              <div className="relative">
                <select
                  {...register("fieldType")}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="indoor">Indoor (Intérieur)</option>
                  <option value="outdoor">Outdoor (Extérieur)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Surface
              </label>
              <div className="relative">
                <select
                  {...register("fieldSurface")}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="synthetic">Synthétique</option>
                  <option value="natural_grass">Gazon naturel</option>
                  <option value="hybrid">Hybride</option>
                  <option value="indoor">Parquet / Résine</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Format
              </label>
              <div className="relative">
                <select
                  {...register("fieldSize")}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="5v5">5 vs 5</option>
                  <option value="7v7">7 vs 7</option>
                  <option value="11v11">11 vs 11</option>
                  <option value="futsal">Futsal</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/venue-owner")}
            className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Création...</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>Créer le terrain</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenueForm;
