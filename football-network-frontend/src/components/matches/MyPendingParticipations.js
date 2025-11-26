import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, HelpCircle, MapPin, Calendar, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MyPendingParticipations = () => {
  const [loading, setLoading] = useState(true);
  const [participations, setParticipations] = useState([]);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    loadPendingParticipations();
  }, []);

  const loadPendingParticipations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/participations/my-pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setParticipations(response.data.participations);
    } catch (error) {
      console.error('Error loading participations:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (participationId, status, note = null) => {
    try {
      setUpdating(prev => ({ ...prev, [participationId]: true }));
      const token = localStorage.getItem('token');

      await axios.put(
        `${API_BASE_URL}/participations/${participationId}`,
        { status, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const statusText = {
        confirmed: 'confirmée',
        declined: 'déclinée',
        maybe: 'mise en peut-être'
      };

      toast.success(`Participation ${statusText[status]}`);
      loadPendingParticipations();
    } catch (error) {
      console.error('Error updating participation:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(prev => ({ ...prev, [participationId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (participations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune confirmation en attente
        </h3>
        <p className="text-gray-600">
          Vous n'avez pas de match nécessitant votre confirmation pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Matchs à Confirmer
        </h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
          {participations.length} {participations.length > 1 ? 'matchs' : 'match'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {participations.map((participation) => {
          const isUpdating = updating[participation.id];
          const matchDate = new Date(participation.match_date);
          const daysUntilMatch = Math.ceil((matchDate - new Date()) / (1000 * 60 * 60 * 24));

          return (
            <div
              key={participation.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Header du match */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-gray-600" />
                      </div>
                      <span className="font-bold text-gray-900">
                        {participation.home_team_name}
                      </span>
                    </div>
                    <span className="text-gray-400 font-bold">VS</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-gray-600" />
                      </div>
                      <span className="font-bold text-gray-900">
                        {participation.away_team_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {matchDate.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {participation.location_city && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{participation.location_city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {daysUntilMatch <= 2 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                    Urgent
                  </span>
                )}
              </div>

              {/* Message d'urgence */}
              {daysUntilMatch <= 2 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Confirmation urgente requise !</strong> Le match a lieu dans {daysUntilMatch} jour{daysUntilMatch > 1 ? 's' : ''}.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleResponse(participation.id, 'confirmed')}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors font-semibold"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Je confirme</span>
                </button>

                <button
                  onClick={() => handleResponse(participation.id, 'maybe')}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 transition-colors font-semibold"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Peut-être</span>
                </button>

                <button
                  onClick={() => handleResponse(participation.id, 'declined')}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors font-semibold"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Je décline</span>
                </button>
              </div>

              {/* Lien vers détails */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to={`/matches/${participation.match_id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir les détails du match →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyPendingParticipations;
