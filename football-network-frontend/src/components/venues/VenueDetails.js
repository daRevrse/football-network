import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Phone, Mail, Award, Calendar, Clock, Euro, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import VenueBookingModal from './VenueBookingModal';

const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showBookingModal, setShowBookingModal] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchVenueDetails();
  }, [id]);

  const fetchVenueDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/venues/${id}`);
      setVenue(response.data.venue);
    } catch (error) {
      console.error('Error fetching venue details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSurfaceLabel = (surface) => {
    const labels = {
      natural_grass: 'Pelouse naturelle',
      synthetic: 'Synthétique',
      hybrid: 'Hybride',
      indoor: 'Intérieur'
    };
    return labels[surface] || surface;
  };

  const getGameTypeLabel = (type) => {
    const labels = {
      '5v5': '5 vs 5',
      '7v7': '7 vs 7',
      '11v11': '11 vs 11',
      'futsal': 'Futsal',
      'training': 'Entraînement',
      'tournament': 'Tournoi'
    };
    return labels[type] || type;
  };

  const getDayTypeLabel = (type) => {
    const labels = {
      weekday: 'Semaine',
      weekend: 'Week-end',
      holiday: 'Férié'
    };
    return labels[type] || type;
  };

  const getTimeSlotLabel = (slot) => {
    const labels = {
      morning: 'Matin (6h-12h)',
      afternoon: 'Après-midi (12h-18h)',
      evening: 'Soirée (18h-22h)',
      night: 'Nuit (22h-6h)'
    };
    return labels[slot] || slot;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400 opacity-50" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Terrain non trouvé</h2>
          <button onClick={() => navigate('/venues')} className="text-blue-600 hover:underline">
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-96 bg-gradient-to-br from-green-500 to-green-700">
        {venue.bannerUrl ? (
          <img
            src={`${API_BASE_URL}${venue.bannerUrl}`}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-32 h-32 text-white opacity-50" />
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/venues')}
          className="absolute top-4 left-4 bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {/* Partner Badge */}
        {venue.isPartner && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            Terrain Partenaire
            {venue.partnerDiscount > 0 && (
              <span className="ml-2 bg-red-500 px-2 py-1 rounded text-sm font-bold">
                -{venue.partnerDiscount}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          {/* Title & Rating */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{venue.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                {renderStars(venue.rating)}
                <span className="text-lg font-semibold text-gray-900">
                  {venue.rating.toFixed(1)}
                </span>
                <span className="text-gray-600">
                  ({venue.totalRatings} avis)
                </span>
              </div>
            </div>
            <div className="flex items-center text-gray-600 text-lg">
              <MapPin className="w-5 h-5 mr-2" />
              {venue.address}, {venue.city}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-8">
              {['info', 'pricing', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-2 font-semibold transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'info' && 'Informations'}
                  {tab === 'pricing' && 'Tarifs'}
                  {tab === 'reviews' && 'Avis'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Field Info */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Caractéristiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Surface</span>
                    <span className="font-semibold">{getSurfaceLabel(venue.fieldSurface)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Taille</span>
                    <span className="font-semibold">{venue.fieldSize}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Capacité spectateurs</span>
                    <span className="font-semibold">{venue.capacity || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Type</span>
                    <span className="font-semibold capitalize">{venue.ownerType}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact</h3>
                <div className="space-y-3">
                  {venue.manager.name && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span>{venue.manager.name}</span>
                    </div>
                  )}
                  {venue.manager.phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <a href={`tel:${venue.manager.phone}`} className="hover:text-blue-600">
                        {venue.manager.phone}
                      </a>
                    </div>
                  )}
                  {venue.manager.email && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <a href={`mailto:${venue.manager.email}`} className="hover:text-blue-600">
                        {venue.manager.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Facilities */}
                {venue.facilities && Object.keys(venue.facilities).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Équipements</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(venue.facilities).map(([key, value]) => {
                        if (!value) return null;
                        const labels = {
                          parking: 'Parking',
                          lockerRooms: 'Vestiaires',
                          showers: 'Douches',
                          cafeteria: 'Cafétéria',
                          lighting: 'Éclairage',
                          wifi: 'WiFi',
                          firstAid: 'Premiers secours',
                          equipment_storage: 'Rangement matériel'
                        };
                        return (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{labels[key] || key}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Grille tarifaire</h3>
              {venue.pricing && venue.pricing.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jour</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créneau</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {venue.pricing.map((price, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getGameTypeLabel(price.gameType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {price.duration} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {getDayTypeLabel(price.dayType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {price.timeSlot ? getTimeSlotLabel(price.timeSlot) : 'Tous'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">
                                {price.price}€
                              </span>
                              {venue.isPartner && venue.partnerDiscount > 0 && (
                                <span className="text-sm text-green-600 font-semibold">
                                  (-{venue.partnerDiscount}% partenaire)
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">Aucun tarif disponible. Contactez le gestionnaire.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Avis récents</h3>
              {venue.recentReviews && venue.recentReviews.length > 0 ? (
                <div className="space-y-6">
                  {venue.recentReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {review.user.firstName[0]}{review.user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.user.firstName} {review.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                      {review.isVerified && (
                        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Avis vérifié
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Aucun avis pour le moment.</p>
              )}
            </div>
          )}
        </div>

        {/* Booking CTA */}
        {user && user.userType === 'manager' && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Réserver ce terrain
                </h3>
                <p className="text-gray-600">
                  Choisissez votre créneau et validez votre réservation
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Réserver maintenant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <VenueBookingModal
          venue={venue}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            // Optionally navigate to bookings page
          }}
        />
      )}
    </div>
  );
};

export default VenueDetails;
