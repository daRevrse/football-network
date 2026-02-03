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
  Search,
  ShieldCheck,
  FileText,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  Hash
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    playerInvites: 0,
    matchInvites: 0,
    validations: 0,
    teams: 0,
    pendingParticipations: 0,
    matchesPlayed: 0,
    assignedMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
  });

  const [loading, setLoading] = useState(true);

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

        if (isReferee) {
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
              completedMatches: matches.filter((m) => m.status === "completed").length,
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

        const [
          playerInvites,
          matchInvites,
          validations,
          teams,
          pendingParticipations,
          userGlobalStats,
        ] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/player-invitations?status=pending`),
          axios.get(`${API_BASE_URL}/matches/invitations/received?status=pending`),
          axios.get(`${API_BASE_URL}/matches/pending-validation/list`),
          axios.get(`${API_BASE_URL}/teams/my`),
          axios.get(`${API_BASE_URL}/participations/my-pending`),
          axios.get(`${API_BASE_URL}/users/stats`),
        ]);

        if (isMounted) {
          setStats({
            playerInvites: playerInvites.status === "fulfilled"
              ? playerInvites.value.data.filter((i) => i.status === "pending").length
              : 0,
            matchInvites: matchInvites.status === "fulfilled"
              ? matchInvites.value.data.length
              : 0,
            validations: validations.status === "fulfilled"
              ? validations.value.data.count || 0
              : 0,
            teams: teams.status === "fulfilled"
              ? teams.value.data.length
              : 0,
            pendingParticipations: pendingParticipations.status === "fulfilled"
              ? pendingParticipations.value.data.participations?.length || 0
              : 0,
            matchesPlayed: userGlobalStats.status === "fulfilled"
              ? userGlobalStats.value.data.matchesCount || 0
              : 0,
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

  if (isSuperadmin || isVenueOwner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {isSuperadmin
              ? "Redirection vers le panel admin..."
              : "Redirection vers votre espace..."}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const totalPendingActions = stats.validations + stats.playerInvites + stats.matchInvites + stats.pendingParticipations;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Bonjour, {user?.firstName}
          </h1>
          <p className="text-gray-500 mt-1">
            {isReferee
              ? "Consultez vos matchs assignés et vos rapports."
              : isManager
              ? "Gérez vos équipes et organisez vos matchs."
              : "Voici un aperçu de votre activité."}
          </p>
        </div>
        {isManager && (
          <Link
            to="/matches/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Créer un match</span>
          </Link>
        )}
      </div>

      {/* Alert Banner - Pending Actions */}
      {!isReferee && totalPendingActions > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900">
                  {totalPendingActions} action{totalPendingActions > 1 ? "s" : ""} en attente
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Vous avez des éléments qui requièrent votre attention.
                </p>
              </div>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {stats.validations > 0 && (
              <Link
                to="/pending-validations"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                {stats.validations} match{stats.validations > 1 ? "s" : ""} à valider
              </Link>
            )}
            {stats.matchInvites > 0 && (
              <Link
                to="/invitations"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
              >
                <Calendar className="w-4 h-4" />
                {stats.matchInvites} invitation{stats.matchInvites > 1 ? "s" : ""} de match
              </Link>
            )}
            {stats.playerInvites > 0 && (
              <Link
                to="/player-invitations"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                {stats.playerInvites} invitation{stats.playerInvites > 1 ? "s" : ""} d'équipe
              </Link>
            )}
            {stats.pendingParticipations > 0 && (
              <Link
                to="/participations"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                {stats.pendingParticipations} participation{stats.pendingParticipations > 1 ? "s" : ""} à confirmer
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isReferee ? (
          <>
            <StatCard
              label="Matchs assignés"
              value={stats.assignedMatches}
              icon={ShieldCheck}
              color="blue"
            />
            <StatCard
              label="À venir"
              value={stats.upcomingMatches}
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="Terminés"
              value={stats.completedMatches}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              label="Rapports"
              value={stats.completedMatches}
              icon={FileText}
              color="violet"
            />
          </>
        ) : (
          <>
            <StatCard
              label={isManager ? "Mes équipes" : "Équipes"}
              value={stats.teams}
              icon={isManager ? Shield : Users}
              color="blue"
            />
            <StatCard
              label="Matchs joués"
              value={stats.matchesPlayed}
              icon={Trophy}
              color="amber"
            />
            <StatCard
              label={isManager ? "Demandes joueurs" : "Invitations reçues"}
              value={stats.playerInvites}
              icon={UserPlus}
              color="violet"
            />
            <StatCard
              label="Invitations matchs"
              value={stats.matchInvites}
              icon={Calendar}
              color="emerald"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Accès rapide</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Referee Actions */}
          {isReferee && (
            <>
              <ActionCard
                to="/referee/matches"
                icon={ShieldCheck}
                title="Mes matchs"
                desc="Consultez vos matchs assignés et à venir."
                color="blue"
              />
              <ActionCard
                to="/referee/reports"
                icon={FileText}
                title="Rapports"
                desc="Rédigez et consultez vos rapports de match."
                color="violet"
              />
              <ActionCard
                to="/calendar"
                icon={Calendar}
                title="Calendrier"
                desc="Visualisez votre planning de matchs."
                color="emerald"
              />
            </>
          )}

          {/* Manager Actions */}
          {isManager && (
            <>
              <ActionCard
                to="/matches"
                icon={PlusCircle}
                title="Organiser un match"
                desc="Créez un match et invitez une équipe adverse."
                color="emerald"
              />
              <ActionCard
                to="/teams"
                icon={Shield}
                title="Mes équipes"
                desc="Gérez vos équipes, effectif et statistiques."
                color="blue"
              />
              <ActionCard
                to="/recruitment"
                icon={UserPlus}
                title="Recrutement"
                desc="Trouvez des joueurs pour renforcer vos équipes."
                color="violet"
              />
              <ActionCard
                to="/venues"
                icon={MapPin}
                title="Réserver un terrain"
                desc="Recherchez et réservez un terrain."
                color="teal"
              />
              <ActionCard
                to="/referees"
                icon={Award}
                title="Trouver un arbitre"
                desc="Recherchez un arbitre pour vos matchs."
                color="indigo"
              />
            </>
          )}

          {/* Player Actions */}
          {isPlayer && (
            <>
              <ActionCard
                to="/teams"
                icon={Users}
                title="Mes équipes"
                desc="Consultez les équipes dont vous êtes membre."
                color="blue"
              />
              <ActionCard
                to="/teams/search"
                icon={Search}
                title="Trouver une équipe"
                desc="Rejoignez une nouvelle équipe pour jouer."
                color="violet"
              />
              <ActionCard
                to="/player-invitations"
                icon={UserPlus}
                title="Invitations d'équipe"
                desc="Consultez vos invitations à rejoindre des équipes."
                color="emerald"
                badge={stats.playerInvites}
              />
              <ActionCard
                to="/participations"
                icon={CheckCircle}
                title="Mes participations"
                desc="Confirmez votre présence aux prochains matchs."
                color="teal"
                badge={stats.pendingParticipations}
              />
              <ActionCard
                to="/venues"
                icon={MapPin}
                title="Terrains"
                desc="Découvrez les terrains disponibles."
                color="amber"
              />
            </>
          )}

          {/* Common Actions */}
          <ActionCard
            to="/calendar"
            icon={Calendar}
            title="Calendrier"
            desc="Vos prochains matchs et disponibilités."
            color="indigo"
          />
          <ActionCard
            to="/feed"
            icon={Hash}
            title="Le Terrain"
            desc="Fil d'actualité de la communauté."
            color="pink"
          />
          <ActionCard
            to="/profile"
            icon={Trophy}
            title="Mon profil"
            desc="Vos informations et statistiques."
            color="amber"
          />
        </div>
      </div>

      {/* Quick Links Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/calendar"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Voir le calendrier</h3>
              <p className="text-sm text-gray-500 mt-1">
                Consultez tous vos événements à venir
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/feed"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Actualités</h3>
              <p className="text-sm text-gray-500 mt-1">
                Découvrez les dernières publications
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    indigo: "bg-indigo-50 text-indigo-600",
    pink: "bg-pink-50 text-pink-600",
    teal: "bg-teal-50 text-teal-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
};

// Action Card Component
const ActionCard = ({ to, icon: Icon, title, desc, color, badge }) => {
  const colorClasses = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    violet: "bg-violet-600",
    indigo: "bg-indigo-600",
    pink: "bg-pink-500",
    teal: "bg-teal-600",
  };

  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{desc}</p>
      <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-emerald-600 transition-colors">
        <span>Accéder</span>
        <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </Link>
  );
};

export default Dashboard;
