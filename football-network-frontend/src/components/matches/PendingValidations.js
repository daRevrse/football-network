// ====================================================================
// football-network-frontend/src/components/matches/PendingValidations.js
// Version améliorée avec meilleur filtrage
// ====================================================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PendingValidations = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingValidations();
  }, []);

  const loadPendingValidations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/matches/pending-validation/list`
      );
      setMatches(response.data.matches);
    } catch (error) {
      console.error("Error loading pending validations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingValidations();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Validations en attente
            </h1>
            <p className="text-gray-600">
              Matchs nécessitant votre validation ou en cours de contestation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </button>
            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">
              {matches.length} {matches.length > 1 ? "matchs" : "match"}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des matchs */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Tout est à jour !
          </h3>
          <p className="text-gray-600">
            Aucun match en attente de validation pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} onRefresh={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, onRefresh }) => {
  const needsYourAction = match.validation.needsYourValidation;
  const isDisputed = match.isDisputed;
  const fullyValidated =
    match.validation.homeCaptainValidated &&
    match.validation.awayCaptainValidated;

  // Ne pas afficher si complètement validé ET non contesté
  if (fullyValidated && !isDisputed) {
    return null;
  }

  return (
    <Link
      to={`/matches/${match.id}/validate`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(match.matchDate).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>

          {isDisputed ? (
            <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Contesté
            </span>
          ) : needsYourAction ? (
            <span className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium animate-pulse">
              <Clock className="w-4 h-4 mr-1" />
              Action requise
            </span>
          ) : (
            <span className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4 mr-1" />
              En attente
            </span>
          )}
        </div>

        {/* Équipes et score */}
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-600 mb-1">Domicile</p>
            <p className="text-lg font-semibold text-gray-900">
              {match.homeTeam.name}
            </p>
          </div>

          <div className="px-8 text-center">
            <div className="text-3xl font-bold text-gray-900">
              {match.score.home ?? "-"} : {match.score.away ?? "-"}
            </div>
            {match.score.home !== null && (
              <p className="text-xs text-gray-500 mt-1">
                {needsYourAction ? "À valider" : "En attente"}
              </p>
            )}
          </div>

          <div className="flex-1 text-center">
            <p className="text-sm text-gray-600 mb-1">Extérieur</p>
            <p className="text-lg font-semibold text-gray-900">
              {match.awayTeam.name}
            </p>
          </div>
        </div>

        {/* Statut de validation */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center">
              {match.validation.homeCaptainValidated ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
              )}
              <span
                className={
                  match.validation.homeCaptainValidated
                    ? "text-green-600 font-medium"
                    : "text-gray-600"
                }
              >
                Capitaine domicile
              </span>
            </div>

            <div className="flex items-center">
              {match.validation.awayCaptainValidated ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
              )}
              <span
                className={
                  match.validation.awayCaptainValidated
                    ? "text-green-600 font-medium"
                    : "text-gray-600"
                }
              >
                Capitaine extérieur
              </span>
            </div>
          </div>
        </div>

        {/* Message d'action */}
        {needsYourAction && !isDisputed && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-blue-900">
              👉 Cliquez pour valider ce match
            </p>
          </div>
        )}

        {isDisputed && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-yellow-900">
              ⚠️ Ce match fait l'objet d'une contestation
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

export default PendingValidations;
