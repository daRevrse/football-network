import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  Trophy,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  AlertTriangle,
  Clock,
  Shield,
  User,
  Info,
  Share2,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import MatchChat from "./MatchChat";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const MatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // info, lineups, chat
  const [showMenu, setShowMenu] = useState(false);
  const [bookingVenue, setBookingVenue] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venues, setVenues] = useState([]);
  const [showRefereeModal, setShowRefereeModal] = useState(false);
  const [referees, setReferees] = useState([]);
  const [loadingReferees, setLoadingReferees] = useState(false);
  const [assigningReferee, setAssigningReferee] = useState(false);

  // Modals state (simplifié pour la démo)
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
      setMatch(response.data);
      console.log("response.data", response.data);
      // Ouvrir le chat par défaut si le match est en cours ou terminé
      if (
        response.data.status === "confirmed" ||
        response.data.status === "completed"
      ) {
        // setShowChat(true);
      }
    } catch (error) {
      toast.error("Impossible de charger le match");
      navigate("/matches");
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---
  const handleStatusChange = async (newStatus, reason = null) => {
    if (!window.confirm(`Confirmer l'action : ${newStatus} ?`)) return;
    try {
      let endpoint = "";
      let body = {};
      if (newStatus === "confirmed") endpoint = "confirm";
      if (newStatus === "cancelled") {
        endpoint = "cancel";
        body = { reason };
      }

      await axios.patch(`${API_BASE_URL}/matches/${matchId}/${endpoint}`, body);
      toast.success("Statut mis à jour");
      loadMatch();
    } catch (error) {
      toast.error("Erreur mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer définitivement ce match ?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/matches/${matchId}`);
      toast.success("Match supprimé");
      navigate("/matches");
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  const handleBookVenue = async (venueId) => {
    try {
      setBookingVenue(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/matches/${matchId}/book-venue`,
        { venueId, durationMinutes: 90 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Réservation créée avec succès !");
      setShowVenueModal(false);
      loadMatch(); // Recharger le match pour afficher la réservation
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(
        error.response?.data?.error || "Erreur lors de la réservation"
      );
    } finally {
      setBookingVenue(false);
    }
  };

  const loadVenues = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/venues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // L'API peut retourner soit un tableau, soit {venues: [...]}
      const venuesData = Array.isArray(response.data)
        ? response.data
        : response.data.venues || response.data.locations || [];
      setVenues(venuesData);
    } catch (error) {
      console.error("Error loading venues:", error);
      setVenues([]);
    }
  };

  const loadReferees = async () => {
    try {
      setLoadingReferees(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/referees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("first", response.data.referees);
      setReferees(response.data.referees || []);
    } catch (error) {
      console.error("Error loading referees:", error);
      toast.error("Impossible de charger la liste des arbitres");
      setReferees([]);
    } finally {
      setLoadingReferees(false);
    }
  };

  const handleAssignReferee = async (refereeId) => {
    try {
      setAssigningReferee(true);
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_BASE_URL}/matches/${matchId}/assign-referee`,
        { refereeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Arbitre assigné avec succès !");
      setShowRefereeModal(false);
      loadMatch(); // Recharger le match
    } catch (error) {
      console.error("Error assigning referee:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'assignation"
      );
    } finally {
      setAssigningReferee(false);
    }
  };

  const handleOpenRefereeModal = () => {
    setShowRefereeModal(true);
    loadReferees();
  };

  const isUserInvolved =
    match?.userTeamId &&
    (match?.homeTeam?.id === match.userTeamId ||
      match?.awayTeam?.id === match.userTeamId);
  const canManage = match?.userRole === "manager";

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  if (!match) return null;

  const matchDate = new Date(match.matchDate);
  const isPast = matchDate < new Date();

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
            onClick={() => navigate("/matches")}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            {match.status === "confirmed" && (
              <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-bold flex items-center backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                CONFIRMÉ
              </div>
            )}
            {canManage && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
                >
                  <Settings className="w-6 h-6" />
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-20 animate-in fade-in zoom-in-95">
                      {match.status === "pending" && (
                        <button
                          onClick={() => handleStatusChange("confirmed")}
                          className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:bg-green-50 flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Confirmer
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/matches/${matchId}/edit`)}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" /> Modifier
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            "cancelled",
                            "Annulé par le capitaine"
                          )
                        }
                        className="w-full px-4 py-2.5 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Annuler
                      </button>
                      <div className="border-t my-1"></div>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                      </button>
                    </div>
                  </>
                )}
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
                {match.homeTeam.logoUrl ? (
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
                {match.homeTeam.name}
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
                    {match.awayTeam.logoUrl ? (
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
          {/* Tabs Navigation */}
          <div className="flex items-center space-x-4 border-b border-gray-200 pb-1 mb-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${
                activeTab === "info"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Informations
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${
                activeTab === "chat"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Discussion d'avant-match
            </button>
          </div>

          {activeTab === "info" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Location Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-indigo-500" /> Détails
                    du terrain
                  </span>
                  {canManage && match.status !== "cancelled" && (
                    <>
                      {match.venue_booking_id ? (
                        <div className="flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm font-semibold text-green-700">
                            Terrain réservé
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            loadVenues();
                            // Pré-sélectionner le terrain du match s'il existe
                            if (match.location?.id) {
                              setSelectedVenue(match.location.id);
                            }
                            setShowVenueModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition flex items-center"
                        >
                          <MapPin className="w-4 h-4 mr-1.5" />
                          {match.location?.id
                            ? "Confirmer le terrain"
                            : "Réserver un terrain"}
                        </button>
                      )}
                    </>
                  )}
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
                  <a
                    href={`https://maps.google.com/?q=${match.location?.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <MapPin className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Notes */}
              {match.notes && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-gray-400" /> Notes du
                    capitaine
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {match.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="h-[500px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {isUserInvolved ? (
                <MatchChat matchId={matchId} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                  <p>Vous devez participer au match pour accéder au chat.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Arbitre */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Officiels
              </h3>
              {canManage && !match.referee_id && (
                <button
                  onClick={handleOpenRefereeModal}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Assigner
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    match.refereeId ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <User
                    className={`w-5 h-5 ${
                      match.refereeId ? "text-blue-600" : "text-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {match.referee_name ||
                      match.refereeId ||
                      "Arbitre à désigner"}
                  </p>
                  <p className="text-xs text-gray-500">Arbitre principal</p>
                </div>
              </div>
              {canManage && match.refereeId && (
                <button
                  onClick={handleOpenRefereeModal}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Changer
                </button>
              )}
            </div>
          </div>

          {/* Share / Actions */}
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <h3 className="text-indigo-900 font-bold mb-2">
              Invitez vos supporters
            </h3>
            <p className="text-indigo-700/80 text-sm mb-4">
              Partagez le lien du match pour que vos amis puissent suivre le
              score.
            </p>
            <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center transition shadow-lg shadow-indigo-200">
              <Share2 className="w-4 h-4 mr-2" /> Partager le match
            </button>
          </div>

          {/* Quick Actions for Captains */}
          {canManage && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pl-2">
                Zone Capitaine
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/matches/${matchId}/participations`)}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Voir
                  les confirmations
                </button>
                <button
                  onClick={() => navigate(`/matches/${matchId}/validate`)}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium flex items-center"
                >
                  <Trophy className="w-4 h-4 mr-2 text-yellow-500" /> Saisir le
                  score
                </button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-500" /> Gérer la
                  compo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de sélection de terrain */}
      {showVenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-indigo-600" />
                    Réserver un terrain
                  </h2>
                  {match.location?.id && (
                    <p className="text-sm text-gray-600 mt-1">
                      Terrain suggéré pour ce match : {match.location?.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowVenueModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {venues.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun terrain disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {venues?.map((venue) => {
                    const isMatchVenue = venue.id === match.location?.id;
                    const isSelected = selectedVenue === venue.id;
                    return (
                      <div
                        key={venue.id}
                        className={`border rounded-xl p-4 hover:shadow-md transition cursor-pointer ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50"
                            : isMatchVenue
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                        onClick={() => setSelectedVenue(venue.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">
                                {venue.name}
                              </h3>
                              {isMatchVenue && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Suggéré
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {venue.city} - {venue.address}
                            </p>
                            {venue.fieldType && (
                              <span className="inline-block mt-2 text-xs bg-gray-100 px-2 py-1 rounded font-medium text-gray-700">
                                {venue.fieldType}
                              </span>
                            )}
                          </div>
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedVenue(venue.id)}
                            className="mt-1 w-5 h-5 text-indigo-600"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowVenueModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => selectedVenue && handleBookVenue(selectedVenue)}
                disabled={!selectedVenue || bookingVenue}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {bookingVenue ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Réservation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer la réservation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'assignation d'arbitre */}
      {showRefereeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Assigner un arbitre
                </h2>
                <button
                  onClick={() => setShowRefereeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Sélectionnez un arbitre qualifié pour officier ce match
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingReferees ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : referees?.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun arbitre disponible</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {referees.map((referee) => (
                    <div
                      key={referee.id}
                      className={`border-2 rounded-xl p-4 hover:border-blue-500 transition-all cursor-pointer ${
                        match.referee_id === referee.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => handleAssignReferee(referee.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {referee.firstName} {referee.lastName}
                            </h3>
                            <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                              {referee.license.level && (
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                  {referee.license.level === "international"
                                    ? "International"
                                    : referee.license.level === "national"
                                    ? "National"
                                    : referee.license.level === "regional"
                                    ? "Régional"
                                    : "Stagiaire"}
                                </span>
                              )}
                              {referee.experienceYears && (
                                <span className="text-xs">
                                  {referee.experienceYears} ans d'expérience
                                </span>
                              )}
                              {referee.location.city && (
                                <span className="flex items-center text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {referee.location.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {match.referee_id === referee.id && (
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowRefereeModal(false)}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetails;
