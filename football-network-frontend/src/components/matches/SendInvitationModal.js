import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  X,
  Send,
  Calendar,
  MapPin,
  MessageSquare,
  Users,
  Search,
  Shield,
  CheckCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Schema de validation
const sendInvitationSchema = yup.object({
  senderTeamId: yup.string().required("Votre équipe est requise"),
  // receiverTeamId est géré hors du register pour supporter la recherche
  proposedDate: yup.string().required("Date requise"),
  proposedTime: yup.string().required("Heure requise"),
  proposedLocationId: yup.string().optional(),
  message: yup.string().max(500, "Maximum 500 caractères").optional(),
});

const SendInvitationModal = ({
  teams, // Liste de mes équipes (où je suis capitaine)
  targetTeam, // (Optionnel) Équipe adverse pré-sélectionnée
  onClose,
  onSuccess, // Callback appelé après succès
}) => {
  const [sending, setSending] = useState(false);

  // États pour la recherche d'adversaire
  const [receiverSearchTerm, setReceiverSearchTerm] = useState("");
  const [foundTeams, setFoundTeams] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState(targetTeam || null);
  const [searchingReceiver, setSearchingReceiver] = useState(false);

  // États pour les lieux
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(sendInvitationSchema),
    defaultValues: {
      senderTeamId: teams.length > 0 ? teams[0].id.toString() : "",
    },
  });

  // Initialisation
  useEffect(() => {
    loadLocations();
  }, []);

  // Recherche d'équipe (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (receiverSearchTerm.length > 2 && !selectedReceiver) {
        searchTeams();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [receiverSearchTerm, selectedReceiver]);

  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      // On récupère les vrais terrains depuis l'API
      const response = await axios.get(`${API_BASE_URL}/venues?limit=100`);
      if (response.data && response.data.venues) {
        setLocations(response.data.venues);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const searchTeams = async () => {
    try {
      setSearchingReceiver(true);
      const response = await axios.get(`${API_BASE_URL}/teams`, {
        params: { search: receiverSearchTerm, limit: 5 },
      });

      // Filtrer pour ne pas afficher mes propres équipes
      const myTeamIds = teams.map((t) => t.id);
      const filtered = (response.data || []).filter(
        (t) => !myTeamIds.includes(t.id)
      );

      setFoundTeams(filtered);
    } catch (error) {
      console.error("Error searching teams:", error);
    } finally {
      setSearchingReceiver(false);
    }
  };

  const handleSelectReceiver = (team) => {
    setSelectedReceiver(team);
    setReceiverSearchTerm(""); // Reset search
    setFoundTeams([]);
  };

  const onSubmit = async (data) => {
    if (!selectedReceiver) {
      return toast.error("Veuillez sélectionner une équipe adverse");
    }

    // Vérification basique pour ne pas s'inviter soi-même
    if (parseInt(data.senderTeamId) === selectedReceiver.id) {
      return toast.error("Vous ne pouvez pas inviter votre propre équipe");
    }

    try {
      setSending(true);

      // Construction de la date ISO
      const proposedDate = new Date(
        `${data.proposedDate}T${data.proposedTime}`
      );

      const payload = {
        senderTeamId: parseInt(data.senderTeamId),
        receiverTeamId: selectedReceiver.id,
        proposedDate: proposedDate.toISOString(),
        proposedLocationId:
          data.proposedLocationId && data.proposedLocationId !== ""
            ? parseInt(data.proposedLocationId)
            : null,
        message: data.message,
      };

      await axios.post(`${API_BASE_URL}/matches/invitations`, payload);

      toast.success("Invitation envoyée avec succès !");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Send invitation error:", error);
      const errorData = error.response?.data;

      if (errorData?.error === "Insufficient players") {
        toast.error(
          `Effectif insuffisant : ${errorData.playersCount}/${errorData.minimumRequired} joueurs requis.`
        );
      } else if (errorData?.error) {
        toast.error(errorData.error);
      } else {
        toast.error("Erreur lors de l'envoi de l'invitation");
      }
    } finally {
      setSending(false);
    }
  };

  // Date minimum : demain
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-900 p-6 flex justify-between items-center shrink-0">
          <div className="text-white">
            <h2 className="text-lg font-bold flex items-center">
              <Send className="w-5 h-5 mr-2 text-blue-400" /> Organiser un match
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Invitez une équipe à vous affronter
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* 1. Équipes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Les Équipes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expéditeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre équipe
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    {...register("senderTeamId")}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destinataire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adversaire
                </label>

                {selectedReceiver ? (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                        {selectedReceiver.name[0]}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-sm text-blue-900 truncate">
                          {selectedReceiver.name}
                        </p>
                        <p className="text-xs text-blue-700">
                          {selectedReceiver.skillLevel || "Amateur"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => !targetTeam && setSelectedReceiver(null)}
                      className={`text-blue-400 hover:text-blue-600 ${
                        targetTeam ? "hidden" : ""
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une équipe..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={receiverSearchTerm}
                      onChange={(e) => setReceiverSearchTerm(e.target.value)}
                    />

                    {/* Liste déroulante de recherche */}
                    {(searchingReceiver || foundTeams.length > 0) && (
                      <div className="absolute z-10 left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
                        {searchingReceiver ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Recherche...
                          </div>
                        ) : (
                          foundTeams.map((team) => (
                            <div
                              key={team.id}
                              onClick={() => handleSelectReceiver(team)}
                              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                            >
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                {team.name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-gray-900">
                                  {team.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {team.locationCity || "Ville inconnue"}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Détails Match */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Détails du match
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    min={minDateStr}
                    {...register("proposedDate")}
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.proposedDate ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                </div>
                {errors.proposedDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.proposedDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure
                </label>
                <input
                  type="time"
                  {...register("proposedTime")}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.proposedTime ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.proposedTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.proposedTime.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu proposé (Optionnel)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <select
                  {...register("proposedLocationId")}
                  disabled={loadingLocations}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="">À définir plus tard</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optionnel)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                {...register("message")}
                rows={3}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Ex: Salut, on cherche un match amical 5v5, vous êtes dispos ?"
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                Visible par le capitaine adverse
              </p>
              <p className="text-xs text-gray-400">{errors.message?.message}</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Envoyer l'invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendInvitationModal;
