import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Users, AlertCircle } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import SendInvitationModal from "./SendInvitationModal";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CreateMatch = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
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

      const response = await axios.get(`${API_BASE_URL}/teams/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter only teams where user is manager or captain
      const teamsWithAdminRole = response.data.filter((team) =>
        ["manager", "captain"].includes(team.role)
      );

      setManagedTeams(teamsWithAdminRole);

      if (teamsWithAdminRole.length === 0) {
        setError(
          "Vous devez être capitaine ou manager d'une équipe pour organiser un match."
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/matches")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour aux matchs
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Impossible d'organiser un match
            </h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate("/matches")}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
              >
                Retour aux matchs
              </button>
              <button
                onClick={() => navigate("/teams")}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
              >
                <Users className="w-5 h-5 inline mr-2" />
                Voir mes équipes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/matches")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
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
    </div>
  );
};

export default CreateMatch;
