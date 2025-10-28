// ====================================================================
// football-network-frontend/src/components/matches/MatchValidation.js
// Composant pour valider les scores de matchs
// ====================================================================

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  MessageSquare,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const MatchValidation = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [validationData, setValidationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // États pour la saisie/validation du score
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  // États pour la contestation
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [proposedHomeScore, setProposedHomeScore] = useState("");
  const [proposedAwayScore, setProposedAwayScore] = useState("");

  useEffect(() => {
    loadValidationStatus();
  }, [matchId]);

  const loadValidationStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/matches/${matchId}/validation-status`
      );

      setValidationData(response.data);

      // Pré-remplir les scores si déjà saisis
      if (response.data.match.homeScore !== null) {
        setHomeScore(response.data.match.homeScore.toString());
        setAwayScore(response.data.match.awayScore.toString());
      }
    } catch (error) {
      console.error("Error loading validation status:", error);
      alert("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScore = async () => {
    if (!homeScore || !awayScore) {
      alert("Veuillez saisir les deux scores");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_BASE_URL}/matches/${matchId}/validate-score`,
        {
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
        }
      );
      alert(response.data.message);
      await loadValidationStatus();
    } catch (error) {
      if (error.response?.status === 409) {
        // Scores ne correspondent pas
        const data = error.response.data;
        const message = `Les scores ne correspondent pas!\n\nScore existant: ${data.existingScore.home} - ${data.existingScore.away}\nVotre score: ${data.yourScore.home} - ${data.yourScore.away}\n\nVoulez-vous ouvrir une contestation?`;

        if (window.confirm(message)) {
          setShowDisputeModal(true);
          setProposedHomeScore(homeScore);
          setProposedAwayScore(awayScore);
        }
      } else {
        alert(error.response?.data?.error || "Erreur lors de la soumission");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!disputeReason.trim() || disputeReason.length < 10) {
      alert("Veuillez fournir une raison détaillée (minimum 10 caractères)");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API_BASE_URL}/matches/${matchId}/dispute`, {
        reason: disputeReason,
        proposedHomeScore: proposedHomeScore
          ? parseInt(proposedHomeScore)
          : null,
        proposedAwayScore: proposedAwayScore
          ? parseInt(proposedAwayScore)
          : null,
      });

      alert("Contestation ouverte avec succès");
      setShowDisputeModal(false);
      await loadValidationStatus();
    } catch (error) {
      alert(
        error.response?.data?.error ||
          "Erreur lors de l'ouverture de la contestation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!validationData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700">
            Impossible de charger les données du match
          </p>
        </div>
      </div>
    );
  }

  const { match, validation, validations, disputes, userRole } = validationData;

  // CORRECTION : Vérifier si l'utilisateur actuel a déjà validé
  const userHasValidated =
    (userRole === "home_captain" && validation.homeCaptainValidated) ||
    (userRole === "away_captain" && validation.awayCaptainValidated);

  // Peut valider SI : a un rôle ET n'a PAS déjà validé ET match pas complètement validé
  const canValidate =
    userRole && !userHasValidated && !validation.fullyValidated;

  // A besoin de valider SI : peut valider ET n'a pas déjà validé
  const needsYourValidation = canValidate;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Validation du Match
          </h1>
          {validation.isRefereeVerified && (
            <span className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              <Shield className="w-4 h-4 mr-1" />
              Certifié Arbitre
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-sm text-gray-600 mb-1">Équipe Domicile</p>
            <p className="text-lg font-semibold text-gray-900">
              {match.homeTeamName}
            </p>
          </div>

          <div className="text-center px-8">
            <div className="text-3xl font-bold text-gray-900">
              {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
            </div>
          </div>

          <div className="text-center flex-1">
            <p className="text-sm text-gray-600 mb-1">Équipe Extérieur</p>
            <p className="text-lg font-semibold text-gray-900">
              {match.awayTeamName}
            </p>
          </div>
        </div>
      </div>

      {/* Statut de validation */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-600" />
          Statut de Validation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Validation Domicile */}
          <div
            className={`p-4 rounded-lg border-2 ${
              validation.homeCaptainValidated
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                Capitaine Domicile
              </span>
              {validation.homeCaptainValidated ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Clock className="w-6 h-6 text-gray-400" />
              )}
            </div>
            {validation.homeCaptainValidatedAt && (
              <p className="text-xs text-gray-600 mt-1">
                Validé le{" "}
                {new Date(validation.homeCaptainValidatedAt).toLocaleDateString(
                  "fr-FR"
                )}
              </p>
            )}
          </div>

          {/* Validation Extérieur */}
          <div
            className={`p-4 rounded-lg border-2 ${
              validation.awayCaptainValidated
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                Capitaine Extérieur
              </span>
              {validation.awayCaptainValidated ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Clock className="w-6 h-6 text-gray-400" />
              )}
            </div>
            {validation.awayCaptainValidatedAt && (
              <p className="text-xs text-gray-600 mt-1">
                Validé le{" "}
                {new Date(validation.awayCaptainValidatedAt).toLocaleDateString(
                  "fr-FR"
                )}
              </p>
            )}
          </div>
        </div>

        {/* Message de statut global */}
        {validation.fullyValidated ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="font-semibold text-green-900">Match validé !</p>
                <p className="text-sm text-green-700">
                  Les deux capitaines ont confirmé le score.
                </p>
              </div>
            </div>
          </div>
        ) : validation.isDisputed ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <p className="font-semibold text-yellow-900">Match contesté</p>
                <p className="text-sm text-yellow-700">
                  Une contestation est en cours de résolution.
                </p>
              </div>
            </div>
          </div>
        ) : needsYourValidation ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <p className="font-semibold text-blue-900">
                  Votre validation est requise
                </p>
                <p className="text-sm text-blue-700">
                  Veuillez confirmer ou saisir le score du match.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-gray-600 mr-3" />
              <div>
                <p className="font-semibold text-gray-900">
                  En attente de l'autre équipe
                </p>
                <p className="text-sm text-gray-700">
                  Vous avez validé. En attente de la validation de l'adversaire.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire de saisie/validation du score */}
      {userHasValidated && !validation.fullyValidated ? (
        // L'utilisateur a déjà validé, en attente de l'autre
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Vous avez validé ce score
            </h3>
            <p className="text-blue-700 mb-4">
              En attente de la validation de l'équipe adverse
            </p>
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {match.homeScore} - {match.awayScore}
            </div>
            <p className="text-sm text-blue-600">Score que vous avez validé</p>
          </div>
        </div>
      ) : canValidate && !validation.isDisputed ? (
        // L'utilisateur peut encore valider
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {match.homeScore === null ? "Saisir le score" : "Valider le score"}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score {match.homeTeamName}
              </label>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score {match.awayTeamName}
              </label>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmitScore}
              disabled={submitting || !homeScore || !awayScore}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {submitting
                ? "Envoi..."
                : match.homeScore === null
                ? "Soumettre le score"
                : "Confirmer le score"}
            </button>

            {match.homeScore !== null && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-6 py-3 border-2 border-yellow-500 text-yellow-700 rounded-lg hover:bg-yellow-50 font-medium transition-colors"
              >
                Contester
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Contestations actives */}
      {disputes && disputes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            Contestations
          </h2>

          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {dispute.openedBy} (
                    {dispute.role === "home_captain" ? "Domicile" : "Extérieur"}
                    )
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(dispute.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  {dispute.status === "open" ? "En cours" : dispute.status}
                </span>
              </div>

              <p className="text-gray-700 mb-2">{dispute.reason}</p>

              {dispute.proposedHomeScore !== null && (
                <p className="text-sm text-gray-600">
                  Score proposé: {dispute.proposedHomeScore} -{" "}
                  {dispute.proposedAwayScore}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Historique des validations */}
      {validations && validations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">
            Historique des validations
          </h2>

          <div className="space-y-3">
            {validations.map((val) => (
              <div
                key={val.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {val.validatorName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {val.role === "home_captain"
                      ? "Capitaine Domicile"
                      : val.role === "away_captain"
                      ? "Capitaine Extérieur"
                      : "Arbitre"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {val.homeScore} - {val.awayScore}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(val.validatedAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de contestation */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-yellow-600" />
                Ouvrir une contestation
              </h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la contestation *
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Expliquez pourquoi vous contestez ce score (minimum 10 caractères)..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {disputeReason.length} / 10 caractères minimum
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score {match.homeTeamName} proposé
                </label>
                <input
                  type="number"
                  min="0"
                  value={proposedHomeScore}
                  onChange={(e) => setProposedHomeScore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Optionnel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score {match.awayTeamName} proposé
                </label>
                <input
                  type="number"
                  min="0"
                  value={proposedAwayScore}
                  onChange={(e) => setProposedAwayScore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Optionnel"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleOpenDispute}
                disabled={submitting || disputeReason.length < 10}
                className="flex-1 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? "Envoi..." : "Soumettre la contestation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchValidation;
