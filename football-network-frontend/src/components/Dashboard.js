import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Users,
  Calendar,
  MessageSquare,
  Search,
  Trophy,
  CalendarIcon,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue, {user?.first_name} !
        </h1>
        <p className="text-gray-600 mb-6">
          Gérez vos équipes, organisez des matchs et restez connecté avec la
          communauté football.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/profile"
            className="bg-blue-50 p-6 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <User className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-blue-800">
                Mon Profil
              </h3>
            </div>
            <p className="text-blue-600">
              Gérez vos informations personnelles et préférences
            </p>
          </Link>

          <Link
            to="/teams"
            className="bg-green-50 p-6 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <Users className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-green-800">
                Mes Équipes
              </h3>
            </div>
            <p className="text-green-600">Créez et gérez vos équipes</p>
          </Link>

          <Link
            to="/teams/search"
            className="bg-orange-50 p-6 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <Search className="w-8 h-8 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-orange-800">
                Rechercher
              </h3>
            </div>
            <p className="text-orange-600">Trouvez des équipes à rejoindre</p>
          </Link>

          <Link
            to="/matches"
            className="bg-yellow-50 p-6 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <Calendar className="w-8 h-8 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-yellow-800">
                Mes Matchs
              </h3>
            </div>
            <p className="text-yellow-600">
              Consultez vos matchs à venir et passés
            </p>
          </Link>

          <Link
            to="/invitations"
            className="bg-purple-50 p-6 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <MessageSquare className="w-8 h-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-purple-800">
                Invitations
              </h3>
            </div>
            <p className="text-purple-600">Gérez vos invitations de match</p>
          </Link>

          <Link
            to="/calendar"
            className="bg-indigo-50 p-6 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <div className="flex items-center mb-3">
              <CalendarIcon className="w-8 h-8 text-indigo-600 mr-3" />
              <h3 className="text-lg font-semibold text-indigo-800">
                Calendrier
              </h3>
            </div>
            <p className="text-indigo-600">
              Visualisez vos matchs et disponibilités
            </p>
          </Link>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <Trophy className="w-8 h-8 text-gray-400 mr-3" />
              <h3 className="text-lg font-semibold text-gray-600">Tournois</h3>
            </div>
            <p className="text-gray-500">Bientôt disponible</p>
          </div>
        </div>
      </div>

      {/* Section statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Équipes</h3>
          <div className="text-3xl font-bold text-green-600">-</div>
          <p className="text-gray-600 text-sm">équipes rejointes</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Matchs</h3>
          <div className="text-3xl font-bold text-blue-600">-</div>
          <p className="text-gray-600 text-sm">matchs joués</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Invitations</h3>
          <div className="text-3xl font-bold text-yellow-600">-</div>
          <p className="text-gray-600 text-sm">en attente</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
