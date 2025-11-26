import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  Calendar,
  MessageSquare,
  Search,
  UserPlus,
  Bell,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  Trophy,
  Shield,
  Settings,
  MapPin,
  Award,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    playerInvites: 0,
    matchInvites: 0,
    validations: 0,
    teams: 0,
  });
  const [loading, setLoading] = useState(true);

  // Vérification du rôle
  const isManager = user?.userType === "manager";
  const isPlayer = user?.userType === "player";
  const isSuperadmin = user?.userType === "superadmin";
  const isVenueOwner = user?.userType === "venue_owner";

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Promise.all pour charger toutes les stats en parallèle
      const [playerInvites, matchInvites, validations, teams] =
        await Promise.allSettled([
          axios
            .get(`${API_BASE_URL}/player-invitations?status=pending`)
            .then(
              (res) => res.data.filter((i) => i.status === "pending").length
            ),
          axios
            .get(`${API_BASE_URL}/matches/invitations/received?status=pending`)
            .then((res) => res.data.length),
          axios
            .get(`${API_BASE_URL}/matches/pending-validation/list`)
            .then((res) => res.data.count || 0),
          axios.get(`${API_BASE_URL}/teams/my`).then((res) => res.data.length),
        ]);

      setStats({
        playerInvites:
          playerInvites.status === "fulfilled" ? playerInvites.value : 0,
        matchInvites:
          matchInvites.status === "fulfilled" ? matchInvites.value : 0,
        validations: validations.status === "fulfilled" ? validations.value : 0,
        teams: teams.status === "fulfilled" ? teams.value : 0,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const ActionCard = ({ to, icon: Icon, title, desc, color, count }) => (
    <Link
      to={to}
      className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col h-full"
    >
      <div
        className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center justify-between">
        {title}
        {count > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            {count}
          </span>
        )}
      </h3>
      <p className="text-sm text-gray-500 mb-4 flex-1">{desc}</p>
      <div className="flex items-center text-sm font-semibold text-gray-400 group-hover:text-gray-900 transition-colors">
        Accéder{" "}
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">
          {loading ? "-" : value}
        </p>
      </div>
    </div>
  );

  // Redirection pour superadmin et venue_owner
  useEffect(() => {
    if (isSuperadmin) {
      navigate('/admin');
    } else if (isVenueOwner) {
      navigate('/venue-owner');
    }
  }, [isSuperadmin, isVenueOwner, navigate]);

  // Si superadmin ou venue_owner, on affiche un loader pendant la redirection
  if (isSuperadmin || isVenueOwner) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isSuperadmin ? 'Redirection vers le panel admin...' : 'Redirection vers votre espace propriétaire...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {isManager ? "Espace Manager" : "Espace Joueur"} - Bonjour{" "}
            {user?.firstName} ! 👋
          </h1>
          <p className="text-gray-300 max-w-2xl">
            {isManager
              ? "Gérez vos équipes, planifiez vos matchs et recrutez de nouveaux talents pour dominer le championnat."
              : "Consultez vos invitations, rejoignez une équipe et participez aux matchs de la communauté."}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isManager ? "Mes Équipes" : "Équipes"}
          value={stats.teams}
          icon={isManager ? Shield : Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Matchs Validés"
          value="12" // Valeur statique pour l'instant
          icon={Trophy}
          color="bg-yellow-500"
        />
        <StatCard
          label={isManager ? "Demandes Joueurs" : "Invitations Reçues"}
          value={stats.playerInvites}
          icon={UserPlus}
          color="bg-purple-500"
        />
        <StatCard
          label="Invitations Matchs"
          value={stats.matchInvites}
          icon={Calendar}
          color="bg-green-500"
        />
      </div>

      {/* Actions Urgentes (Si nécessaire) */}
      {(stats.validations > 0 ||
        stats.playerInvites > 0 ||
        stats.matchInvites > 0) && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
          <h2 className="font-bold text-orange-800 flex items-center mb-4">
            <Bell className="w-5 h-5 mr-2" /> Actions requises
          </h2>
          <div className="flex flex-wrap gap-3">
            {stats.validations > 0 && (
              <Link
                to="/pending-validations"
                className="flex items-center px-4 py-2 bg-white text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition font-medium text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-2 text-orange-500" />{" "}
                {stats.validations} matchs à valider
              </Link>
            )}
            {stats.matchInvites > 0 && (
              <Link
                to="/invitations"
                className="flex items-center px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition font-medium text-sm"
              >
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />{" "}
                {stats.matchInvites} invitations de match
              </Link>
            )}
            {stats.playerInvites > 0 && (
              <Link
                to="/player-invitations"
                className="flex items-center px-4 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition font-medium text-sm"
              >
                <UserPlus className="w-4 h-4 mr-2 text-purple-500" />{" "}
                {stats.playerInvites} invitations d'équipe
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Grid Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Accès Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Actions Manager */}
          {isManager && (
            <>
              <ActionCard
                to="/matches"
                icon={PlusCircle}
                title="Organiser un match"
                desc="Créez un match et invitez une équipe adverse."
                color="bg-green-500"
              />
              <ActionCard
                to="/teams"
                icon={Shield}
                title="Gestion d'Équipes"
                desc="Gérez vos équipes, effectif, logo et statistiques."
                color="bg-blue-600"
              />
              <ActionCard
                to="/teams/search"
                icon={UserPlus}
                title="Recrutement"
                desc="Trouvez des joueurs libres pour renforcer vos équipes."
                color="bg-purple-500"
              />
              <ActionCard
                to="/venues"
                icon={MapPin}
                title="Réserver un Terrain"
                desc="Recherchez et réservez un terrain pour vos matchs."
                color="bg-teal-500"
              />
              <ActionCard
                to="/referees"
                icon={Award}
                title="Trouver un Arbitre"
                desc="Recherchez un arbitre qualifié pour vos matchs."
                color="bg-indigo-600"
              />
            </>
          )}

          {/* Actions Player */}
          {isPlayer && (
            <>
              <ActionCard
                to="/teams"
                icon={Users}
                title="Mes Équipes"
                desc="Consultez les équipes dont vous êtes membre."
                color="bg-blue-600"
              />
              <ActionCard
                to="/teams/search"
                icon={Search}
                title="Trouver une équipe"
                desc="Rejoignez une nouvelle équipe pour jouer."
                color="bg-purple-500"
              />
              <ActionCard
                to="/player-invitations"
                icon={UserPlus}
                title="Invitations d'Équipe"
                desc="Consultez vos invitations à rejoindre des équipes."
                color="bg-green-500"
                count={stats.playerInvites}
              />
              <ActionCard
                to="/venues"
                icon={MapPin}
                title="Terrains"
                desc="Découvrez les terrains disponibles dans votre région."
                color="bg-teal-500"
              />
            </>
          )}

          {/* Actions Communes */}
          <ActionCard
            to="/calendar"
            icon={Calendar}
            title="Calendrier"
            desc="Vos prochains matchs et disponibilités."
            color="bg-indigo-500"
          />

          <ActionCard
            to="/profile"
            icon={Trophy}
            title="Mon Profil"
            desc="Vos informations personnelles et historique."
            color="bg-orange-500"
          />

          <ActionCard
            to="/feed"
            icon={MessageSquare}
            title="Le Terrain"
            desc="Fil d'actualité de la communauté."
            color="bg-pink-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
