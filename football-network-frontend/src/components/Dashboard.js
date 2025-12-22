import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  Calendar,
  UserPlus,
  Bell,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  Trophy,
  Shield,
  MapPin,
  Award,
  MessageSquare,
  Search,
  ShieldUser,
  FileText,
  Clock,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // MODIFIÉ : Ajout de matchesPlayed dans l'état initial
  const [stats, setStats] = useState({
    playerInvites: 0,
    matchInvites: 0,
    validations: 0,
    teams: 0,
    pendingParticipations: 0,
    matchesPlayed: 0, // Nouveau champ
    // Stats arbitre
    assignedMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
  });

  const [loading, setLoading] = useState(true);

  // Vérification du rôle
  const isManager = user?.userType === "manager";
  const isPlayer = user?.userType === "player";
  const isReferee = user?.userType === "referee";
  const isSuperadmin = user?.userType === "superadmin";
  const isVenueOwner = user?.userType === "venue_owner";

  useEffect(() => {
    if (user?.userType === "superadmin") {
      navigate("/admin", { replace: true });
    } else if (user?.userType === "venue_owner") {
      navigate("/venue-owner", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Stats différentes selon le rôle
        if (isReferee) {
          // Chargement des stats arbitre
          const [refereeMatches] = await Promise.allSettled([
            axios.get(`${API_BASE_URL}/referee/matches/my-matches`),
          ]);

          if (isMounted && refereeMatches.status === "fulfilled") {
            const matches = refereeMatches.value.data.matches || [];
            const now = new Date();

            setStats({
              assignedMatches: matches.length,
              upcomingMatches: matches.filter(
                (m) => m.status === "confirmed" && new Date(m.match_date) > now
              ).length,
              completedMatches: matches.filter((m) => m.status === "completed")
                .length,
              playerInvites: 0,
              matchInvites: 0,
              validations: 0,
              teams: 0,
              pendingParticipations: 0,
              matchesPlayed: 0,
            });
          }
          return;
        }

        // MODIFIÉ : Ajout de l'appel à /users/stats pour joueurs/managers
        const [
          playerInvites,
          matchInvites,
          validations,
          teams,
          pendingParticipations,
          userGlobalStats, // Récupération des stats globales (victoires, matchs joués)
        ] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/player-invitations?status=pending`),
          axios.get(
            `${API_BASE_URL}/matches/invitations/received?status=pending`
          ),
          axios.get(`${API_BASE_URL}/matches/pending-validation/list`),
          axios.get(`${API_BASE_URL}/teams/my`),
          axios.get(`${API_BASE_URL}/participations/my-pending`),
          axios.get(`${API_BASE_URL}/users/stats`), // Appel existant dans users.js backend
        ]);

        if (isMounted) {
          // Helper pour extraire la valeur ou 0 en cas d'erreur
          const getValue = (result, path = null) => {
            if (result.status !== "fulfilled") return 0;
            if (!path) return result.value.data;
            // Pour gérer les tableaux (ex: .length) ou les objets
            return Array.isArray(result.value.data)
              ? result.value.data.length
              : result.value.data[path] || result.value.data;
          };

          // Extraction spécifique selon la structure de retour de chaque API
          const playerInvitesCount =
            playerInvites.status === "fulfilled"
              ? playerInvites.value.data.filter((i) => i.status === "pending")
                  .length
              : 0;

          const matchInvitesCount =
            matchInvites.status === "fulfilled"
              ? matchInvites.value.data.length
              : 0;

          const validationsCount =
            validations.status === "fulfilled"
              ? validations.value.data.count || 0
              : 0;

          const teamsCount =
            teams.status === "fulfilled" ? teams.value.data.length : 0;

          const pendingPartCount =
            pendingParticipations.status === "fulfilled"
              ? pendingParticipations.value.data.participations?.length || 0
              : 0;

          const matchesPlayedCount =
            userGlobalStats.status === "fulfilled"
              ? userGlobalStats.value.data.matchesCount || 0
              : 0;

          setStats({
            playerInvites: playerInvitesCount,
            matchInvites: matchInvitesCount,
            validations: validationsCount,
            teams: teamsCount,
            pendingParticipations: pendingPartCount,
            matchesPlayed: matchesPlayedCount,
          });
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (user) {
      loadDashboardStats();
    }

    return () => {
      isMounted = false;
    };
  }, [user, isReferee]);

  // ... (Garder ActionCard et StatCard inchangés) ...
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

  // ... (Garder le bloc de redirection loading inchangé) ...
  if (isSuperadmin || isVenueOwner) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isSuperadmin
              ? "Redirection vers le panel admin..."
              : "Redirection vers votre espace propriétaire..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 mt-5">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {isReferee
              ? "Espace Arbitre"
              : isManager
              ? "Espace Manager"
              : "Espace Joueur"}{" "}
            - Bonjour {user?.firstName} ! 👋
          </h1>
          <p className="text-gray-300 max-w-2xl">
            {isReferee
              ? "Gérez vos matchs assignés, rapportez les incidents et validez les scores officiellement."
              : isManager
              ? "Gérez vos équipes, planifiez vos matchs et recrutez de nouveaux talents pour dominer le championnat."
              : "Consultez vos invitations, rejoignez une équipe et participez aux matchs de la communauté."}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isReferee ? (
          <>
            <StatCard
              label="Matchs Assignés"
              value={stats.assignedMatches}
              icon={ShieldUser}
              color="bg-blue-500"
            />
            <StatCard
              label="Matchs À Venir"
              value={stats.upcomingMatches}
              icon={Clock}
              color="bg-orange-500"
            />
            <StatCard
              label="Matchs Terminés"
              value={stats.completedMatches}
              icon={CheckCircle}
              color="bg-green-500"
            />
            <StatCard
              label="Rapports Créés"
              value={stats.completedMatches}
              icon={FileText}
              color="bg-purple-500"
            />
          </>
        ) : (
          <>
            <StatCard
              label={isManager ? "Mes Équipes" : "Équipes"}
              value={stats.teams}
              icon={isManager ? Shield : Users}
              color="bg-blue-500"
            />
            {/* MODIFIÉ : Utilisation de la vraie valeur stats.matchesPlayed */}
            <StatCard
              label="Matchs Joués"
              value={stats.matchesPlayed}
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
          </>
        )}
      </div>

      {/* Actions Urgentes */}
      {!isReferee &&
        (stats.validations > 0 ||
          stats.playerInvites > 0 ||
          stats.matchInvites > 0 ||
          stats.pendingParticipations > 0) && (
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
              {stats.pendingParticipations > 0 && (
                <Link
                  to="/participations"
                  className="flex items-center px-4 py-2 bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition font-medium text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />{" "}
                  {stats.pendingParticipations} participations à confirmer
                </Link>
              )}
            </div>
          </div>
        )}

      {/* Main Grid Actions (Reste inchangé) */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Accès Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Actions Arbitre */}
          {isReferee && <></>}

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
                to="/recruitment"
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
                to="/participations"
                icon={CheckCircle}
                title="Mes Participations"
                desc="Confirmez votre présence aux prochains matchs."
                color="bg-emerald-600"
                count={stats.pendingParticipations}
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
