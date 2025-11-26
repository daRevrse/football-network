import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar, MapPin, Clock, CheckCircle, XCircle,
  AlertCircle, Shield, Eye, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VenueOwnerBookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const venueIdFromUrl = searchParams.get('venue_id');

  useEffect(() => {
    loadBookings();
  }, [filter, venueIdFromUrl]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build query params
      const queryParams = new URLSearchParams();
      if (filter !== 'all') queryParams.append('status', filter);
      if (venueIdFromUrl) queryParams.append('venue_id', venueIdFromUrl);
      const params = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const response = await axios.get(`${API_BASE_URL}/venue-owner/bookings${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter !== 'all') {
      setSearchParams({ status: newFilter });
    } else {
      setSearchParams({});
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'En attente'
      },
      confirmed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Confirmée'
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Annulée'
      },
      completed: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: CheckCircle,
        label: 'Terminée'
      }
    };

    const { bg, text, icon: Icon, label } = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Icon className="w-3.5 h-3.5 mr-1" />
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Summary */}
      <div className="mb-8">
        <p className="text-lg text-gray-700">
          <span className="font-semibold text-green-600">{bookings.length}</span> réservation{bookings.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'Toutes' },
              { value: 'pending', label: 'En attente' },
              { value: 'confirmed', label: 'Confirmées' },
              { value: 'cancelled', label: 'Annulées' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune réservation
          </h3>
          <p className="text-gray-600">
            {filter !== 'all'
              ? `Aucune réservation ${filter === 'pending' ? 'en attente' : filter === 'confirmed' ? 'confirmée' : 'annulée'}.`
              : 'Vos réservations apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const bookingDate = new Date(booking.booking_date);
            const now = new Date();
            const isUpcoming = bookingDate > now;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {booking.venue_name}
                      </h3>
                      {getStatusBadge(booking.status)}
                      {isUpcoming && booking.status === 'confirmed' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          À venir
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{booking.venue_city}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Team Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Équipe</p>
                      <p className="font-semibold text-gray-900">{booking.team_name}</p>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-semibold text-gray-900">
                        {bookingDate.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Horaire</p>
                      <p className="font-semibold text-gray-900">
                        {booking.start_time} ({booking.duration}min)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {booking.payment_amount > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Montant:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {booking.payment_amount.toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Statut paiement:</span>
                      <span className={`text-xs font-semibold ${
                        booking.payment_status === 'paid'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}>
                        {booking.payment_status === 'paid' ? 'Payé' : 'En attente'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  <Link
                    to={`/venue-owner/bookings/${booking.id}`}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Voir Détails</span>
                  </Link>

                  {booking.status === 'pending' && (
                    <Link
                      to={`/venue-owner/bookings/${booking.id}?action=respond`}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Répondre</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default VenueOwnerBookings;
