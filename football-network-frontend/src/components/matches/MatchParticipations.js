import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, HelpCircle, Clock, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MatchParticipations = () => {
  const { matchId } = useParams();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadParticipations();
  }, [matchId]);

  const loadParticipations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/participations/match/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMatch(response.data.match);
      setParticipations(response.data.participations);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error loading participations:', error);
      toast.error('Erreur lors du chargement des confirmations');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/participations/match/${matchId}/validate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Validation du match effectuée');
      loadParticipations();
    } catch (error) {
      console.error('Error validating match:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const homeTeamParticipations = participations.filter(p => p.team_id === match.homeTeamId);
  const awayTeamParticipations = participations.filter(p => p.team_id === match.awayTeamId);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'maybe':
        return <HelpCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      confirmed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      maybe: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      confirmed: 'Confirmé',
      declined: 'Absent',
      maybe: 'Peut-être',
      pending: 'En attente'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${classes[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getValidationStatus = () => {
    if (summary.isValid) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-green-900">Match Validé</h3>
            <p className="text-sm text-green-700">
              Les deux équipes ont suffisamment de joueurs confirmés (minimum 6 par équipe).
            </p>
          </div>
        </div>
      );
    } else if (summary.homeConfirmed >= 4 && summary.awayConfirmed >= 4) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900">Attention</h3>
            <p className="text-sm text-yellow-700">
              Pas encore assez de confirmations. Il faut au moins 6 joueurs par équipe.
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-900">Critique</h3>
            <p className="text-sm text-red-700">
              Nombre insuffisant de confirmations. Contactez les joueurs pour confirmer leur présence.
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Confirmations de Participation
        </h1>
        <p className="text-gray-600">
          Match du {new Date(match.matchDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Status de validation */}
      <div className="mb-8">
        {getValidationStatus()}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Équipe Domicile</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-1">
              {summary.homeConfirmed}
              <span className="text-lg text-gray-500">/{summary.homeTotal}</span>
            </p>
            <p className="text-sm text-gray-600">Joueurs confirmés</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className={`text-center font-semibold ${
              summary.homeConfirmed >= 6 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.homeConfirmed >= 6 ? '✓ Validé' : `Manque ${6 - summary.homeConfirmed}`}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Équipe Extérieure</h3>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900 mb-1">
              {summary.awayConfirmed}
              <span className="text-lg text-gray-500">/{summary.awayTotal}</span>
            </p>
            <p className="text-sm text-gray-600">Joueurs confirmés</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className={`text-center font-semibold ${
              summary.awayConfirmed >= 6 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.awayConfirmed >= 6 ? '✓ Validé' : `Manque ${6 - summary.awayConfirmed}`}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Actions</h3>
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            <button
              onClick={handleValidate}
              disabled={updating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {updating ? 'Validation...' : 'Revalider le match'}
            </button>
            <button
              onClick={loadParticipations}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* Lists de participations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Équipe Domicile */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Équipe Domicile ({homeTeamParticipations[0]?.team_name})
          </h2>
          <div className="space-y-3">
            {homeTeamParticipations.map((participation) => (
              <div
                key={participation.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(participation.status)}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {participation.first_name} {participation.last_name}
                    </p>
                    {participation.preferred_position && (
                      <p className="text-xs text-gray-500">{participation.preferred_position}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(participation.status)}
              </div>
            ))}
          </div>
        </div>

        {/* Équipe Extérieure */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Équipe Extérieure ({awayTeamParticipations[0]?.team_name})
          </h2>
          <div className="space-y-3">
            {awayTeamParticipations.map((participation) => (
              <div
                key={participation.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(participation.status)}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {participation.first_name} {participation.last_name}
                    </p>
                    {participation.preferred_position && (
                      <p className="text-xs text-gray-500">{participation.preferred_position}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(participation.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchParticipations;
