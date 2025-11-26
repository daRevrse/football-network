import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, Calendar, Clock } from 'lucide-react';

const RefereeCard = ({ referee }) => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const getLicenseLevelBadge = (level) => {
    const badges = {
      trainee: { label: 'Stagiaire', color: 'bg-gray-100 text-gray-700' },
      regional: { label: 'Régional', color: 'bg-blue-100 text-blue-700' },
      national: { label: 'National', color: 'bg-purple-100 text-purple-700' },
      international: { label: 'International', color: 'bg-yellow-100 text-yellow-700' }
    };
    return badges[level] || badges.regional;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    return stars;
  };

  const badge = getLicenseLevelBadge(referee.license.level);

  return (
    <div
      onClick={() => navigate(`/referees/${referee.id}`)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
    >
      {/* Header avec photo */}
      <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-900">
        {referee.photoUrl ? (
          <img
            src={`${API_BASE_URL}${referee.photoUrl}`}
            alt={`${referee.firstName} ${referee.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Award className="w-20 h-20 text-white opacity-50" />
          </div>
        )}

        {/* Badge niveau */}
        <div className={`absolute top-3 right-3 ${badge.color} px-3 py-1 rounded-full text-sm font-semibold shadow-lg`}>
          {badge.label}
        </div>

        {/* Badge disponibilité */}
        {referee.isAvailable && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            Disponible
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Nom */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {referee.firstName} {referee.lastName}
        </h3>

        {/* Licence */}
        {referee.license.number && (
          <p className="text-sm text-gray-600 mb-3">
            Licence: {referee.license.number}
          </p>
        )}

        {/* Location */}
        {referee.location.city && (
          <div className="flex items-center text-gray-600 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{referee.location.city}</span>
            {referee.location.maxTravelDistance && (
              <span className="ml-2 text-gray-500">
                (Rayon: {referee.location.maxTravelDistance}km)
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {renderStars(referee.rating)}
          </div>
          <span className="text-sm text-gray-600">
            {referee.rating.toFixed(1)} ({referee.totalRatings} avis)
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">Expérience</p>
            <p className="text-sm font-semibold text-gray-900">
              {referee.experienceYears} ans
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500 mb-1">Matchs</p>
            <p className="text-sm font-semibold text-gray-900">
              {referee.totalMatches}
            </p>
          </div>
        </div>

        {/* Specializations */}
        {referee.specializations && referee.specializations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Spécialisations</p>
            <div className="flex flex-wrap gap-1">
              {referee.specializations.slice(0, 4).map((spec, index) => (
                <span
                  key={index}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                >
                  {spec}
                </span>
              ))}
              {referee.specializations.length > 4 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{referee.specializations.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Hourly Rate */}
        {referee.hourlyRate && (
          <div className="mb-4 text-center py-2 bg-green-50 rounded-lg">
            <p className="text-lg font-bold text-green-700">
              {referee.hourlyRate}€ <span className="text-sm font-normal">/heure</span>
            </p>
          </div>
        )}

        {/* Action Button */}
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" />
          Voir le profil
        </button>
      </div>
    </div>
  );
};

export default RefereeCard;
