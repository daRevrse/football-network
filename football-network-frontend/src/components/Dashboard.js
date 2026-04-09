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
        if (!user?.uid) return;
        setLoading(true);

        if (isReferee) {
          if (isMounted) {
            setStats({
              assignedMatches: 0,
              upcomingMatches: 0,
              completedMatches: 0,
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

        if (isMounted) {
          setStats({
            playerInvites: 0,
            matchInvites: 0,
            validations: 0,
            teams: 0,
            pendingParticipations: 0,
            matchesPlayed: 0,
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Bonjour, {user?.firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Organiser un match</span>
          </Link>
        )}
      </div>

      {/* Stats Grid / KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isReferee ? (
          <>
            <StatCard label="Matchs assignés" value={stats.assignedMatches} icon={ShieldCheck} color="blue" />
            <StatCard label="À venir" value={stats.upcomingMatches} icon={Clock} color="amber" />
            <StatCard label="Terminés" value={stats.completedMatches} icon={CheckCircle} color="emerald" />
            <StatCard label="Rapports" value={stats.completedMatches} icon={FileText} color="violet" />
          </>
        ) : (
          <>
            <StatCard label={isManager ? "Mes équipes" : "Équipes"} value={stats.teams} icon={isManager ? Shield : Users} color="blue" />
            <StatCard label="Matchs joués" value={stats.matchesPlayed} icon={Trophy} color="amber" />
            <StatCard label={isManager ? "Demandes joueurs" : "Invitations reçues"} value={stats.playerInvites} icon={UserPlus} color="violet" />
            <StatCard label="Invitations matchs" value={stats.matchInvites} icon={Calendar} color="emerald" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Column - Contextual Actions & Data */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Alert Banner / Actions Requises */}
          {!isReferee && totalPendingActions > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-100 px-5 py-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <h2 className="text-base font-semibold text-gray-900">Actions Requises</h2>
                <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {totalPendingActions}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.validations > 0 && (
                  <PendingActionRow 
                    to="/pending-validations" 
                    icon={CheckCircle} 
                    title={`${stats.validations} match${stats.validations > 1 ? "s" : ""} à valider`} 
                    color="amber" 
                  />
                )}
                {stats.matchInvites > 0 && (
                  <PendingActionRow 
                    to="/invitations" 
                    icon={Calendar} 
                    title={`${stats.matchInvites} invitation${stats.matchInvites > 1 ? "s" : ""} de match`} 
                    color="blue" 
                  />
                )}
                {stats.playerInvites > 0 && (
                  <PendingActionRow 
                    to="/player-invitations" 
                    icon={UserPlus} 
                    title={`${stats.playerInvites} invitation${stats.playerInvites > 1 ? "s" : ""} d'équipe`} 
                    color="purple" 
                  />
                )}
                {stats.pendingParticipations > 0 && (
                  <PendingActionRow 
                    to="/participations" 
                    icon={CheckCircle} 
                    title={`${stats.pendingParticipations} participation${stats.pendingParticipations > 1 ? "s" : ""} à confirmer`} 
                    color="emerald" 
                  />
                )}
              </div>
            </div>
          )}

          {/* Social Quick Launch - Redesigned to be secondary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                <Hash className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Le Terrain Communautaire</h3>
                <p className="text-sm text-gray-500">
                  Découvrez les actualités, partagez des photos et interagissez avec les autres joueurs.
                </p>
              </div>
            </div>
            <Link
              to="/feed"
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Accéder au flux
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Sidebar Column - Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-base font-semibold text-gray-900">Raccourcis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {isReferee && (
              <>
                <ActionCard to="/referee/matches" icon={ShieldCheck} title="Mes matchs" desc="Consultez vos matchs assignés." color="blue" />
                <ActionCard to="/referee/reports" icon={FileText} title="Rapports" desc="Rédigez et consultez vos rapports." color="violet" />
              </>
            )}

            {isManager && (
              <>
                <ActionCard to="/teams" icon={Shield} title="Gérer mes équipes" desc="Effectif et statistiques." color="blue" />
                <ActionCard to="/recruitment" icon={UserPlus} title="Recrutement" desc="Trouvez des joueurs." color="violet" />
                <ActionCard to="/venues" icon={MapPin} title="Réserver un terrain" desc="Terrains de votre région." color="teal" />
                <ActionCard to="/referees" icon={Award} title="Trouver un arbitre" desc="Arbitres disponibles." color="indigo" />
              </>
            )}

            {isPlayer && (
              <>
                <ActionCard to="/teams" icon={Users} title="Mes équipes" desc="Équipes dont vous êtes membre." color="blue" />
                <ActionCard to="/teams/search" icon={Search} title="Recherche équipe" desc="Rejoignez un nouveau club." color="violet" />
                <ActionCard to="/venues" icon={MapPin} title="Découvrir terrains" desc="Terrains disponibles." color="amber" />
              </>
            )}

            <ActionCard to="/calendar" icon={Calendar} title="Mon Calendrier" desc="Événements à venir." color="indigo" />
          </div>
        </div>

      </div>
    </div>
  );
};

// Pending Action Row Component
const PendingActionRow = ({ to, icon: Icon, title, color }) => {
  const colorClasses = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    emerald: "text-emerald-600",
  };

  return (
    <Link to={to} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group cursor-pointer block">
      <div className="flex items-center gap-4">
        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-transform" />
    </Link>
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
    </div>
  );
};

// Action Card Component
const ActionCard = ({ to, icon: Icon, title, desc, color }) => {
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
    <Link
      to={to}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all group flex items-start gap-4"
    >
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm mb-0.5 group-hover:text-emerald-600 transition-colors">{title}</h3>
        <p className="text-xs text-gray-500 truncate">{desc}</p>
      </div>
    </Link>
  );
};

export default Dashboard;
