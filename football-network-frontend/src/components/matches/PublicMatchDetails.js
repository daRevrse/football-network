import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  User,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PublicMatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/matches/${matchId}/public`);
      setMatch(response.data);
    } catch (error) {
      toast.error("Impossible de charger le match");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  if (!match) return null;

  const matchDate = new Date(match.matchDate);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* --- Hero Section (Stadium Atmosphere) --- */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 mb-8">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://www.agn-avocats.fr/wp-content/uploads/2020/02/football-stadium-shiny-lights-view-from-field-PWS5ZD9-scaled.jpg"
            alt="Stadium"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
        </div>

        {/* Navigation Top */}
        <div className="relative z-10 p-6 flex justify-between items-start">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            {/* Badge de statut */}
            {match.status === "pending" && (
              <div className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm font-bold flex items-center backdrop-blur-md">
                <Clock className="w-3 h-3 mr-2" />
                EN ATTENTE
              </div>
            )}
            {match.status === "confirmed" && (
              <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-bold flex items-center backdrop-blur-md">
                <CheckCircle className="w-3 h-3 mr-2" />
                CONFIRMÉ
              </div>
            )}
            {match.status === "in_progress" && (
              <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-sm font-bold flex items-center backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                EN COURS
              </div>
            )}
            {match.status === "completed" && (
              <div className="px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/50 text-gray-300 text-sm font-bold flex items-center backdrop-blur-md">
                <CheckCircle className="w-3 h-3 mr-2" />
                TERMINÉ
              </div>
            )}
            {match.status === "cancelled" && (
              <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-bold flex items-center backdrop-blur-md">
                <XCircle className="w-3 h-3 mr-2" />
                ANNULÉ
              </div>
            )}
          </div>
        </div>

        {/* Scoreboard Center */}
        <div className="relative z-10 flex flex-col items-center justify-center pb-12 px-4">
          <div className="text-white/60 text-sm font-medium uppercase tracking-widest mb-6 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {matchDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            <span className="mx-2">•</span>
            {matchDate.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div className="flex items-center justify-center w-full max-w-4xl gap-8 md:gap-16">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/20 p-4 mb-4 flex items-center justify-center">
                {match.homeTeam?.logoUrl ? (
                  <img
                    src={match.homeTeam.logoUrl}
                    className="w-full h-full object-contain"
                    alt="Home"
                  />
                ) : (
                  <Shield className="w-10 h-10 md:w-14 md:h-14 text-blue-400" />
                )}
              </div>
              <h2 className="text-xl md:text-3xl font-bold text-white leading-tight">
                {match.homeTeam?.name || "Équipe Domicile"}
              </h2>
              <p className="text-blue-300 text-sm mt-1">Domicile</p>
            </div>

            {/* Score / VS */}
            <div className="flex flex-col items-center justify-center">
              {match.status === "completed" ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 md:px-10 md:py-5 border border-white/20">
                  <span className="text-4xl md:text-6xl font-black text-white tracking-tight">
                    {match.score?.home ?? 0} - {match.score?.away ?? 0}
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <span className="text-xl md:text-2xl font-black text-white/50 italic">
                    VS
                  </span>
                </div>
              )}
              <div className="mt-4 text-white/50 text-sm font-medium uppercase tracking-wider bg-black/30 px-3 py-1 rounded-full">
                {match.status === "completed"
                  ? "Terminé"
                  : match.duration + " min"}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center flex-1">
              {match.awayTeam ? (
                <>
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/20 p-4 mb-4 flex items-center justify-center">
                    {match.awayTeam?.logoUrl ? (
                      <img
                        src={match.awayTeam.logoUrl}
                        className="w-full h-full object-contain"
                        alt="Away"
                      />
                    ) : (
                      <Shield className="w-10 h-10 md:w-14 md:h-14 text-red-400" />
                    )}
                  </div>
                  <h2 className="text-xl md:text-3xl font-bold text-white leading-tight">
                    {match.awayTeam.name}
                  </h2>
                  <p className="text-red-300 text-sm mt-1">Extérieur</p>
                </>
              ) : (
                <div className="flex flex-col items-center opacity-60">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white/50" />
                  </div>
                  <p className="text-white/70">En attente d'adversaire</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-indigo-500" /> Lieu du match
            </h3>
            <div className="flex items-start p-4 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">
                  {match.location?.name || "Lieu à définir"}
                </h4>
                <p className="text-gray-600 text-sm mt-1">
                  {match.location?.address || "Adresse non renseignée"}
                </p>
                {match.location?.fieldType && (
                  <span className="inline-block mt-2 text-xs font-medium bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">
                    {match.location.fieldType}
                  </span>
                )}
              </div>
              {match.location?.address && (
                <a
                  href={`https://maps.google.com/?q=${match.location?.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                >
                  <MapPin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Match Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Informations du match
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Type de match</span>
                <span className="font-semibold text-gray-900">
                  {match.matchType || "Amical"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Durée</span>
                <span className="font-semibold text-gray-900">
                  {match.duration || 90} minutes
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Statut</span>
                <span className="font-semibold text-gray-900">
                  {match.status === "pending" && "En attente"}
                  {match.status === "confirmed" && "Confirmé"}
                  {match.status === "in_progress" && "En cours"}
                  {match.status === "completed" && "Terminé"}
                  {match.status === "cancelled" && "Annulé"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Arbitre */}
          {match.referee_name && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Officiels
              </h3>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-blue-100">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {match.referee_name}
                  </p>
                  <p className="text-xs text-gray-500">Arbitre principal</p>
                </div>
              </div>
            </div>
          )}

          {/* Share */}
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <h3 className="text-indigo-900 font-bold mb-2">
              Partager ce match
            </h3>
            <p className="text-indigo-700/80 text-sm mb-4">
              Partagez ce match avec vos amis
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Lien copié !");
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center transition shadow-lg shadow-indigo-200"
            >
              <Share2 className="w-4 h-4 mr-2" /> Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicMatchDetails;
