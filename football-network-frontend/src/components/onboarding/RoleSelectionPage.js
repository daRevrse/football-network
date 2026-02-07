import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Shield, Award, MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const ROLES = [
  {
    id: 'player',
    title: 'Je suis joueur',
    description: 'Rejoindre des equipes et participer a des matchs',
    icon: Users,
    color: '#2196F3',
    features: ['Rejoindre des equipes', 'Participer aux matchs', 'Suivre vos statistiques'],
    signupPath: '/signup',
  },
  {
    id: 'manager',
    title: 'Je suis manager',
    description: 'Creer et gerer une ou plusieurs equipes',
    icon: Shield,
    color: '#1B5E20',
    features: ['Creer des equipes', 'Organiser des matchs', 'Gerer les joueurs'],
    signupPath: '/signup',
  },
  {
    id: 'referee',
    title: 'Je suis arbitre',
    description: 'Officier des matchs et rediger des rapports',
    icon: Award,
    color: '#9C27B0',
    features: ['Arbitrer des matchs', 'Fiche de match officielle', 'Gerer vos disponibilites'],
    signupPath: '/signup',
  },
  {
    id: 'venue_owner',
    title: "J'ai un terrain",
    description: 'Proposer votre terrain a la location',
    icon: MapPin,
    color: '#FF5722',
    features: ['Publier votre terrain', 'Gerer les reservations', 'Suivre vos revenus'],
    signupPath: '/signup/venue-owner',
  },
];

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole) {
      const role = ROLES.find(r => r.id === selectedRole);
      navigate(role.signupPath, { state: { userType: selectedRole } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">FN</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Football Network</span>
          </Link>
          <Link
            to="/login"
            className="text-green-600 hover:text-green-700 font-medium flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Quel est votre role ?
          </h1>
          <p className="text-gray-600 text-lg">
            Selectionnez votre profil pour une experience personnalisee
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  relative bg-white rounded-xl p-6 text-left transition-all duration-200
                  ${isSelected
                    ? 'ring-2 shadow-lg'
                    : 'shadow-sm hover:shadow-md border border-gray-200'
                  }
                `}
                style={{
                  ringColor: isSelected ? role.color : undefined,
                  borderColor: isSelected ? role.color : undefined,
                }}
              >
                {/* Checkbox */}
                <div
                  className={`
                    absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center
                    ${isSelected ? 'text-white' : 'border-2 border-gray-300'}
                  `}
                  style={{ backgroundColor: isSelected ? role.color : 'transparent' }}
                >
                  {isSelected && <Check className="w-4 h-4" />}
                </div>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${role.color}15` }}
                >
                  <Icon className="w-7 h-7" style={{ color: role.color }} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {role.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {role.description}
                </p>

                {/* Features (shown when selected) */}
                {isSelected && (
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <Check className="w-4 h-4 mr-2" style={{ color: role.color }} />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`
              flex items-center justify-center px-8 py-3 rounded-lg font-semibold text-lg
              transition-all duration-200 w-full max-w-md
              ${selectedRole
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Continuer
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>

          <p className="mt-6 text-gray-600">
            Deja un compte ?{' '}
            <Link to="/login" className="text-green-600 font-semibold hover:text-green-700">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RoleSelectionPage;
