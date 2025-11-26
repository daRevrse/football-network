import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Calendar, Clock, Euro, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VenueBookingModal = ({ venue, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [bookingData, setBookingData] = useState({
    teamId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    gameType: '11v11',
    matchId: null,
    notes: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchUserTeams();
  }, []);

  useEffect(() => {
    if (bookingData.bookingDate && bookingData.gameType) {
      fetchAvailability();
    }
  }, [bookingData.bookingDate, bookingData.gameType]);

  const fetchUserTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/teams/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data.teams || []);
      if (response.data.teams && response.data.teams.length > 0) {
        setBookingData(prev => ({ ...prev, teamId: response.data.teams[0].id }));
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const duration = calculateDuration();
      const params = new URLSearchParams({
        date: bookingData.bookingDate,
        duration: duration,
        game_type: bookingData.gameType
      });

      const response = await axios.get(
        `${API_BASE_URL}/venues/${venue.id}/availability?${params.toString()}`
      );
      setAvailability(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 90;
    const [startHour, startMin] = bookingData.startTime.split(':').map(Number);
    const [endHour, endMin] = bookingData.endTime.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/venues/${venue.id}/book`,
        bookingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setTimeout(() => {
        onSuccess(response.data.booking);
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const isSlotBooked = (time) => {
    if (!availability || !availability.bookedSlots) return false;
    return availability.bookedSlots.some(slot => {
      const slotStart = slot.startTime.substring(0, 5);
      const slotEnd = slot.endTime.substring(0, 5);
      return time >= slotStart && time < slotEnd;
    });
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Réservation confirmée !
          </h3>
          <p className="text-gray-600 mb-4">
            Votre réservation a été enregistrée avec succès.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Réserver le terrain</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Team & Date */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Équipe
              </label>
              <select
                value={bookingData.teamId}
                onChange={(e) => setBookingData({ ...bookingData, teamId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionnez une équipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date de réservation
              </label>
              <input
                type="date"
                value={bookingData.bookingDate}
                onChange={(e) => setBookingData({ ...bookingData, bookingDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de jeu
              </label>
              <select
                value={bookingData.gameType}
                onChange={(e) => setBookingData({ ...bookingData, gameType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="11v11">11 vs 11</option>
                <option value="7v7">7 vs 7</option>
                <option value="5v5">5 vs 5</option>
                <option value="futsal">Futsal</option>
                <option value="training">Entraînement</option>
                <option value="tournament">Tournoi</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Heure de début
                </label>
                <input
                  type="time"
                  value={bookingData.startTime}
                  onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Heure de fin
                </label>
                <input
                  type="time"
                  value={bookingData.endTime}
                  onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Informations complémentaires..."
              />
            </div>

            {/* Pricing Info */}
            {availability && availability.pricing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Prix de base:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {availability.pricing.price} {availability.pricing.currency}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {availability.pricing.gameType} - {availability.pricing.duration} min - {availability.pricing.dayType}
                </div>
                {venue.isPartner && venue.partnerDiscount > 0 && (
                  <div className="mt-2 text-sm text-green-600 font-semibold">
                    Réduction partenaire: -{venue.partnerDiscount}%
                  </div>
                )}
              </div>
            )}

            {/* Booked Slots Warning */}
            {availability && availability.bookedSlots && availability.bookedSlots.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Créneaux déjà réservés:
                </p>
                <div className="space-y-1">
                  {availability.bookedSlots.map((slot, index) => (
                    <p key={index} className="text-sm text-yellow-700">
                      {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Réservation...
                </>
              ) : (
                <>
                  <Euro className="w-5 h-5" />
                  Confirmer la réservation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VenueBookingModal;
