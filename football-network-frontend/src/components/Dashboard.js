// ====================================================================
// Mise à jour du Dashboard pour afficher les validations en attente
// football-network-frontend/src/components/Dashboard.js
// ====================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Users,
  Calendar,
  MessageSquare,
  Search,
  Trophy,
  CalendarIcon,
  UserPlus,
  Bell,
  CheckCircle, // NOUVEAU
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingPlayerInvitations: 0,
    pendingMatchInvitations: 0,
    pendingValidations: 0, // NOUVEAU
    teamsCount: 0,
    matchesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Charger les invitations de joueurs
      const playerInvitationsResponse = await axios.get(
        `${API_BASE_URL}/player-invitations?status=pending&limit=50`
      );

      const pendingPlayerInvitations = playerInvitationsResponse.data.filter(
        (inv) => inv.status === "pending"
      ).length;

      // Charger les invitations de matchs
      let matchInvitationsCount = 0;
      try {
        const matchInvitationsResponse = await axios.get(
          `${API_BASE_URL}/matches/invitations/received?status=pending&limit=1`
        );
        matchInvitationsCount = matchInvitationsResponse.data.length;
      } catch (error) {
        console.log("No match invitations");
      }

      // NOUVEAU : Charger les validations en attente
      let pendingValidationsCount = 0;
      try {
        const validationsResponse = await axios.get(
          `${API_BASE_URL}/matches/pending-validation/list`
        );
        pendingValidationsCount = validationsResponse.data.count || 0;
      } catch (error) {
        console.log("Error loading pending validations:", error);
      }

      // Charger les équipes
      const teamsResponse = await axios.get(`${API_BASE_URL}/teams/my`);

      setStats({
        pendingPlayerInvitations: pendingPlayerInvitations,
        pendingMatchInvitations: matchInvitationsCount,
        pendingValidations: pendingValidationsCount, // NOUVEAU
        teamsCount: teamsResponse.data.length,
        matchesCount: 0,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue, {user?.firstName} !
        </h1>
        <p className="text-gray-600 mb-6">
          Gérez vos équipes, organisez des matchs et restez connecté avec la
          communauté football.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/profile"
            className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <User className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-blue-800">
                Mon Profil
              </h3>
            </div>
            <p className="text-blue-600">
              Gérez vos informations personnelles et préférences
            </p>
          </Link>

          <Link
            to="/teams"
            className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <Users className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-green-800">
                Mes Équipes
              </h3>
            </div>
            <p className="text-green-600">Créez et gérez vos équipes</p>
          </Link>

          <Link
            to="/teams/search"
            className="bg-orange-50 p-6 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <Search className="w-8 h-8 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-orange-800">
                Rechercher
              </h3>
            </div>
            <p className="text-orange-600">Trouvez des équipes à rejoindre</p>
          </Link>

          <Link
            to="/player-invitations"
            className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors relative"
          >
            <div className="flex items-center mb-3">
              <UserPlus className="w-8 h-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-purple-800">
                Invitations Équipes
              </h3>
              {stats.pendingPlayerInvitations > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingPlayerInvitations}
                </span>
              )}
            </div>
            <p className="text-purple-600">Gérez vos invitations d'équipes</p>
          </Link>

          <Link
            to="/invitations"
            className="bg-yellow-50 p-6 rounded-lg hover:bg-yellow-100 transition-colors relative"
          >
            <div className="flex items-center mb-3">
              <MessageSquare className="w-8 h-8 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-yellow-800">
                Invitations Matchs
              </h3>
              {stats.pendingMatchInvitations > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingMatchInvitations}
                </span>
              )}
            </div>
            <p className="text-yellow-600">
              Organisez vos matchs et répondez aux invitations
            </p>
          </Link>

          {/* NOUVEAU : Lien vers les validations en attente */}
          <Link
            to="/pending-validations"
            className="bg-pink-50 p-6 rounded-lg hover:bg-pink-100 transition-colors relative"
          >
            <div className="flex items-center mb-3">
              <CheckCircle className="w-8 h-8 text-pink-600 mr-3" />
              <h3 className="text-lg font-semibold text-pink-800">
                Validations Matchs
              </h3>
              {stats.pendingValidations > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  {stats.pendingValidations}
                </span>
              )}
            </div>
            <p className="text-pink-600">
              Validez les scores de vos matchs terminés
            </p>
          </Link>

          <Link
            to="/calendar"
            className="bg-indigo-50 p-6 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <CalendarIcon className="w-8 h-8 text-indigo-600 mr-3" />
              <h3 className="text-lg font-semibold text-indigo-800">
                Calendrier
              </h3>
            </div>
            <p className="text-indigo-600">
              Visualisez vos matchs et disponibilités
            </p>
          </Link>
        </div>
      </div>

      {/* Section statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Équipes</h3>
          <div className="text-3xl font-bold text-green-600">
            {loading ? "-" : stats.teamsCount}
          </div>
          <p className="text-gray-600 text-sm">équipes rejointes</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            Invitations Équipes
            {stats.pendingPlayerInvitations > 0 && (
              <Bell className="w-4 h-4 ml-2 text-red-500" />
            )}
          </h3>
          <div className="text-3xl font-bold text-purple-600">
            {loading ? "-" : stats.pendingPlayerInvitations}
          </div>
          <p className="text-gray-600 text-sm">en attente</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            Invitations Matchs
            {stats.pendingMatchInvitations > 0 && (
              <Bell className="w-4 h-4 ml-2 text-red-500" />
            )}
          </h3>
          <div className="text-3xl font-bold text-yellow-600">
            {loading ? "-" : stats.pendingMatchInvitations}
          </div>
          <p className="text-gray-600 text-sm">en attente</p>
        </div>

        {/* NOUVEAU : Statistique des validations */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            Validations Matchs
            {stats.pendingValidations > 0 && (
              <Bell className="w-4 h-4 ml-2 text-red-500 animate-pulse" />
            )}
          </h3>
          <div className="text-3xl font-bold text-pink-600">
            {loading ? "-" : stats.pendingValidations}
          </div>
          <p className="text-gray-600 text-sm">à valider</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
