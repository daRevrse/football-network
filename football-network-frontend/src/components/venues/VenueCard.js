import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, Users, Calendar } from 'lucide-react';

const VenueCard = ({ venue }) => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const getSurfaceLabel = (surface) => {
    const labels = {
      natural_grass: 'Pelouse naturelle',
      synthetic: 'Synthétique',
      hybrid: 'Hybride',
      indoor: 'Intérieur'
    };
    return labels[surface] || surface;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <div
      onClick={() => navigate(`/venues/${venue.id}`)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-green-500 to-green-700">
        {venue.photoUrl ? (
          <img
            src={`${API_BASE_URL}${venue.photoUrl}`}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-16 h-16 text-white opacity-50" />
          </div>
        )}

        {/* Partner Badge */}
        {venue.isPartner && (
          <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
            <Award className="w-4 h-4" />
            Partenaire
          </div>
        )}

        {/* Discount Badge */}
        {venue.isPartner && venue.partnerDiscount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            -{venue.partnerDiscount}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Name & Location */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {venue.name}
        </h3>

        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{venue.city}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {renderStars(venue.rating)}
          </div>
          <span className="text-sm text-gray-600">
            {venue.rating.toFixed(1)} ({venue.totalRatings} avis)
          </span>
        </div>

        {/* Field Info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">Surface</p>
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">
              {getSurfaceLabel(venue.fieldSurface)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">Taille</p>
            <p className="text-sm font-semibold text-gray-900">
              {venue.fieldSize || 'N/A'}
            </p>
          </div>
        </div>

        {/* Facilities */}
        {venue.facilities && Object.keys(venue.facilities).length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Équipements</p>
            <div className="flex flex-wrap gap-1">
              {venue.facilities.parking && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Parking
                </span>
              )}
              {venue.facilities.lockerRooms && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Vestiaires
                </span>
              )}
              {venue.facilities.showers && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Douches
                </span>
              )}
              {venue.facilities.cafeteria && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Cafétéria
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" />
          Voir les disponibilités
        </button>
      </div>
    </div>
  );
};

export default VenueCard;
