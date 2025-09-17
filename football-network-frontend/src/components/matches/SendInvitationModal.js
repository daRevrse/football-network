import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { X, Send, Calendar, MapPin, MessageSquare, Users } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const sendInvitationSchema = yup.object({
  senderTeamId: yup.string().required("Équipe expéditrice requise"),
  receiverTeamId: yup.string().required("Équipe destinataire requise"),
  proposedDate: yup.string().required("Date requise"),
  proposedTime: yup.string().required("Heure requise"),
  proposedLocationId: yup.string().optional(),
  message: yup.string().max(500, "Maximum 500 caractères").optional(),
});

const SendInvitationModal = ({ teams, onClose, onSend }) => {
  const [sending, setSending] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(sendInvitationSchema),
  });

  const selectedSenderTeam = watch("senderTeamId");

  useEffect(() => {
    if (teams.length > 0) {
      setValue("senderTeamId", teams[0].id.toString());
    }
    loadLocations();
  }, [teams, setValue]);

  useEffect(() => {
    if (selectedSenderTeam) {
      searchAvailableTeams();
    }
  }, [selectedSenderTeam]);

  const loadLocations = async () => {
    try {
      // Pour cette démo, on peut créer quelques lieux fictifs
      // Dans la vraie app, ça viendrait de l'API
      setLocations([
        { id: 1, name: "Stade Municipal", address: "15 Rue du Sport, Paris" },
        {
          id: 2,
          name: "Terrain Synthétique",
          address: "25 Avenue des Sports, Lyon",
        },
        {
          id: 3,
          name: "Complex Sportif",
          address: "10 Boulevard du Football, Marseille",
        },
      ]);
    } catch (error) {
      console.error("Error loading locations:", error);
      // Assurer qu'on a toujours un array même en cas d'erreur
      setLocations([]);
    }
  };

  const searchAvailableTeams = async () => {
    try {
      setLoadingTeams(true);
      const response = await axios.get(`${API_BASE_URL}/teams`);

      // Vérifier que response.data existe et est un array
      const teamsData = response.data || [];

      // Exclure les équipes de l'utilisateur
      const myTeamIds = teams.map((team) => team.id);
      const filtered = teamsData.filter((team) => !myTeamIds.includes(team.id));

      setAvailableTeams(filtered);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast.error("Erreur lors du chargement des équipes");
      // Assurer qu'on a toujours un array même en cas d'erreur
      setAvailableTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSending(true);

      // Combiner date et heure
      const proposedDate = new Date(
        `${data.proposedDate}T${data.proposedTime}`
      );

      // Nettoyer et valider les données
      const locationId = data.proposedLocationId?.trim();
      const messageText = data.message?.trim();

      const invitationData = {
        senderTeamId: parseInt(data.senderTeamId),
        receiverTeamId: parseInt(data.receiverTeamId),
        proposedDate: proposedDate.toISOString(),
        proposedLocationId:
          locationId && locationId !== "" && locationId !== "null"
            ? parseInt(locationId)
            : null,
        message: messageText && messageText !== "" ? messageText : null,
      };

      console.log("Sending invitation data:", invitationData); // Debug
      await onSend(invitationData);
    } catch (error) {
      console.error("Send invitation error:", error);
      // Afficher l'erreur pour déboguer
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      }
    } finally {
      setSending(false);
    }
  };

  // Date minimum : demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Envoyer une invitation
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
          {/* Sélection des équipes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Équipes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre équipe *
                </label>
                <select
                  {...register("senderTeamId")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.senderTeamId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {errors.senderTeamId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.senderTeamId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipe à inviter *
                </label>
                <select
                  {...register("receiverTeamId")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.receiverTeamId ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loadingTeams}
                >
                  <option value="">Sélectionner une équipe</option>
                  {availableTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.skillLevel})
                    </option>
                  ))}
                </select>
                {errors.receiverTeamId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.receiverTeamId.message}
                  </p>
                )}
                {loadingTeams && (
                  <p className="text-gray-500 text-sm mt-1">
                    Chargement des équipes...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Date et heure */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Date et heure
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date du match *
                </label>
                <input
                  type="date"
                  {...register("proposedDate")}
                  min={minDate}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.proposedDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.proposedDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.proposedDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure du match *
                </label>
                <input
                  type="time"
                  {...register("proposedTime")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.proposedTime ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.proposedTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.proposedTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Lieu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Lieu (optionnel)
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terrain proposé
              </label>
              <select
                {...register("proposedLocationId")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Lieu à définir</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.address}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Le lieu peut être discuté et modifié ultérieurement
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Message
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message d'accompagnement (optionnel)
              </label>
              <textarea
                {...register("message")}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                  errors.message ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Salut ! Nous cherchons un match amical pour ce weekend. Êtes-vous disponibles ?"
                maxLength={500}
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.message.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum 500 caractères
              </p>
            </div>
          </div>

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
              disabled={sending || loadingTeams}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Envoi..." : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendInvitationModal;
