import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Users, AlertCircle } from "lucide-react";
import api from "../../services/api";
import SendInvitationModal from "./SendInvitationModal";
import toast from "react-hot-toast";

const CreateMatch = () => {
  const navigate = useNavigate();
  const [managedTeams, setManagedTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadManagedTeams();
  }, []);

  const loadManagedTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Utilise le nouvel endpoint /api/teams/my
      const response = await api.get("/teams/my");

      // Filter only teams where user is manager or captain
      const teamsWithAdminRole = response.data.filter((team) =>
        ["manager", "captain"].includes(team.role)
      );

      setManagedTeams(teamsWithAdminRole);

      if (teamsWithAdminRole.length === 0) {
        setError(
          "Vous devez être manager d'une équipe pour organiser un match."
        );
      }
    } catch (error) {
      console.error("Error loading teams:", error);
      setError("Erreur lors du chargement de vos équipes");
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success("Match organisé avec succès !");
    navigate("/matches");
  };

  const handleClose = () => {
    navigate("/matches");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-blue-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-current mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/matches")}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition font-medium"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Retour aux matchs
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Impossible d'organiser un match
          </h2>
          <p className="text-gray-500 text-center mb-8">{error}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/matches")}
              className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition"
            >
              Retour aux matchs
            </button>
            <button
              onClick={() => navigate("/teams")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center shadow-sm"
            >
              <Users className="w-5 h-5 mr-2" />
              Voir mes équipes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 max-w-7xl mx-auto">
      <button
        onClick={() => navigate("/matches")}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition font-medium"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Retour aux matchs
      </button>

        {/* Modal d'invitation */}
        <SendInvitationModal
          teams={managedTeams}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
    </div>
  );
};

export default CreateMatch;
