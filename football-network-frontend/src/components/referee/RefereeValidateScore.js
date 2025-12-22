import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Trophy,
  AlertOctagon,
  Shield,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const RefereeValidateScore = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Score input
  const [scores, setScores] = useState({ home: "", away: "" });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/matches/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMatch(response.data);

      // Pré-remplir avec le score existant si disponible
      if (response.data.score?.home !== null) {
        setScores({
          home: response.data.score.home,
          away: response.data.score.away,
        });
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du match");
      navigate("/referee/matches");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (scores.home === "" || scores.away === "") {
      return toast.error("Veuillez saisir les deux scores");
    }

    if (!window.confirm("Confirmer la validation du score en tant qu'arbitre ?")) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/referee/matches/${matchId}/validate-score`,
        {
          homeScore: parseInt(scores.home),
          awayScore: parseInt(scores.away),
          notes: notes || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.consensus?.hasConsensus) {
        toast.success("Score validé avec consensus ! Match finalisé.");
      } else if (response.data.consensus?.hasDispute) {
        toast.error("Attention : Désaccord sur les scores. Match marqué comme disputé.");
      } else {
        toast.success("Score validé ! En attente de validation des managers.");
      }

      navigate("/referee/matches");
    } catch (error) {
      console.error("Validation error:", error);
      toast.error(
        error.response?.data?.error || "Erreur lors de la validation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center h-screen items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!match) return null;

  // Vérifier que le match est terminé
  if (match.status !== "completed") {
    return (
      <div className="max-w-3xl mx-auto pb-12 pt-6 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
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

  // Vérifier si déjà validé par l'arbitre
  if (match.isRefereeVerified) {
    return (
      <div className="max-w-3xl mx-auto pb-12 pt-6 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </button>
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Déjà validé
          </h2>
          <p className="text-green-700">
            Vous avez déjà validé le score de ce match.
          </p>
          <div className="mt-4 text-3xl font-black text-green-900">
            {match.score?.home} - {match.score?.away}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 pt-6 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
        <div className="bg-purple-600 p-6 text-white text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold">Validation Arbitre</h1>
          </div>
          <p className="text-purple-200 text-sm">Certification officielle du score</p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {match.homeTeam?.name}
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
                {match.awayTeam?.name || "À définir"}
              </h2>
              <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">
                EXTÉRIEUR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900 mb-1">
              Validation avec système de consensus
            </h3>
            <p className="text-sm text-blue-700">
              Votre validation sera combinée avec celles des managers.
              Un consensus de 2 validations identiques sur 3 est requis pour finaliser le match.
            </p>
          </div>
        </div>
      </div>

      {/* Score existant si présent */}
      {match.score?.home !== null && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Score actuel déclaré :</p>
          <div className="text-2xl font-bold text-gray-900">
            {match.score.home} - {match.score.away}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Certifier le
          résultat final
        </h3>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              {match.homeTeam?.name}
            </label>
            <input
              type="number"
              min="0"
              className="w-20 h-20 text-center text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              value={scores.home}
              onChange={(e) => setScores({ ...scores, home: e.target.value })}
            />
          </div>
          <span className="text-2xl font-bold text-gray-300">-</span>
          <div className="text-center">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              {match.awayTeam?.name || "Extérieur"}
            </label>
            <input
              type="number"
              min="0"
              className="w-20 h-20 text-center text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              value={scores.away}
              onChange={(e) => setScores({ ...scores, away: e.target.value })}
            />
          </div>
        </div>

        {/* Notes optionnelles */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Notes de validation (optionnel)
          </label>
          <textarea
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm resize-none"
            rows={3}
            placeholder="Remarques sur le déroulement du match, incidents particuliers..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
          ></textarea>
          <p className="text-xs text-gray-400 mt-1">
            {notes.length}/1000 caractères
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Validation en cours...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Certifier ce score
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          En validant, vous certifiez officiellement l'exactitude de ce résultat
          en tant qu'arbitre. Cette action est définitive.
        </p>
      </div>
    </div>
  );
};

export default RefereeValidateScore;
