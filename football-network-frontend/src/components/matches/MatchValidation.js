import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  MessageSquare,
  ArrowLeft,
  Trophy,
  AlertOctagon,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const MatchValidation = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Score input
  const [scores, setScores] = useState({ home: "", away: "" });

  // Dispute state
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  useEffect(() => {
    loadStatus();
  }, [matchId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/matches/${matchId}/validation-status`
      );
      setData(res.data);
      if (res.data.match.homeScore !== null) {
        setScores({
          home: res.data.match.homeScore,
          away: res.data.match.awayScore,
        });
      }
    } catch (error) {
      toast.error("Erreur chargement");
      navigate("/matches");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (scores.home === "" || scores.away === "")
      return toast.error("Scores requis");

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/matches/${matchId}/validate-score`, {
        homeScore: parseInt(scores.home),
        awayScore: parseInt(scores.away),
      });
      toast.success("Score soumis !");
      loadStatus();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("Conflit de score détecté !");
        setShowDispute(true);
      } else {
        toast.error("Erreur soumission");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (disputeReason.length < 10)
      return toast.error("Expliquez la raison (min 10 cars)");
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/matches/${matchId}/dispute`, {
        reason: disputeReason,
      });
      toast.success("Contestation ouverte");
      loadStatus();
      setShowDispute(false);
    } catch (e) {
      toast.error("Erreur contestation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center h-screen items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  if (!data) return null;

  const { match, validation, userRole } = data;

  // Vérifier que le match est terminé
  if (match.status !== "completed") {
    return (
      <div className="max-w-3xl mx-auto pb-12 pt-6 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour au match
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-800 mb-2">
            Match non terminé
          </h2>
          <p className="text-yellow-700">
            La validation du score ne peut se faire qu'après la fin du match.
          </p>
          <p className="text-yellow-600 text-sm mt-2">
            Statut actuel: <span className="font-semibold">{match.status}</span>
          </p>
        </div>
      </div>
    );
  }

  const hasValidated =
    (userRole === "home_captain" && validation.homeCaptainValidated) ||
    (userRole === "away_captain" && validation.awayCaptainValidated);

  return (
    <div className="max-w-3xl mx-auto pb-12 pt-6 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Retour au match
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
        <div className="bg-gray-900 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Feuille de Match</h1>
          <p className="text-gray-400 text-sm">Validation du score final</p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {match.homeTeamName}
              </h2>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                DOMICILE
              </span>
            </div>

            <div className="px-6">
              <div className="text-4xl font-black text-gray-800 tracking-widest">
                VS
              </div>
            </div>

            <div className="text-center flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {match.awayTeamName}
              </h2>
              <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">
                EXTÉRIEUR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {validation.fullyValidated ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-8 animate-in zoom-in duration-300">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Score Validé !
          </h2>
          <p className="text-green-700">
            Le match est clos et les statistiques ont été mises à jour.
          </p>
          <div className="mt-4 text-3xl font-black text-green-900">
            {match.homeScore} - {match.awayScore}
          </div>
        </div>
      ) : validation.isDisputed ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <AlertOctagon className="w-8 h-8 text-yellow-600 mr-4 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-800">
                Litige en cours
              </h3>
              <p className="text-yellow-700 mt-1">
                Les scores soumis ne correspondent pas. Un administrateur va
                examiner le dossier.
              </p>
            </div>
          </div>
        </div>
      ) : hasValidated ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mb-8">
          <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-blue-900">
            En attente de l'adversaire
          </h3>
          <p className="text-blue-700">
            Vous avez validé le score. En attente de la confirmation adverse.
          </p>
          <div className="mt-4 inline-block bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm">
            <span className="font-mono font-bold text-blue-900">
              {scores.home} - {scores.away}
            </span>
          </div>
        </div>
      ) : (
        /* Input Form */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Saisir le
            résultat
          </h3>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="text-center">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                {match.homeTeamName}
              </label>
              <input
                type="number"
                min="0"
                className="w-20 h-20 text-center text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={scores.home}
                onChange={(e) => setScores({ ...scores, home: e.target.value })}
              />
            </div>
            <span className="text-2xl font-bold text-gray-300">-</span>
            <div className="text-center">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                {match.awayTeamName}
              </label>
              <input
                type="number"
                min="0"
                className="w-20 h-20 text-center text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                value={scores.away}
                onChange={(e) => setScores({ ...scores, away: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-black transition shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {submitting ? "Validation..." : "Valider ce score"}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            En validant, vous certifiez l'exactitude de ce résultat. Toute
            fausse déclaration pourra être sanctionnée.
          </p>
        </div>
      )}

      {/* Dispute Modal Area */}
      {showDispute && (
        <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-6 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-red-900 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> Signaler un problème
          </h3>
          <textarea
            className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            rows={3}
            placeholder="Expliquez pourquoi le score est incorrect..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          ></textarea>
          <div className="mt-3 flex justify-end gap-3">
            <button
              onClick={() => setShowDispute(false)}
              className="px-4 py-2 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition"
            >
              Annuler
            </button>
            <button
              onClick={handleDispute}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition shadow-sm"
            >
              Envoyer la contestation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchValidation;
