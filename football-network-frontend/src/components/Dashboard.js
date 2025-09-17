import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Bienvenue, {user?.firstName} !
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Mes Équipes
            </h3>
            <p className="text-green-600">
              Gérez vos équipes et trouvez des adversaires
            </p>
            <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Voir mes équipes
            </button>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Prochains Matchs
            </h3>
            <p className="text-blue-600">
              Consultez votre calendrier de matchs
            </p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Voir le calendrier
            </button>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Invitations
            </h3>
            <p className="text-yellow-600">Gérez vos invitations de match</p>
            <button className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
              Voir les invitations
            </button>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Vos informations
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-medium">Position:</span>{" "}
              {user?.position || "Non définie"}
            </div>
            <div>
              <span className="font-medium">Niveau:</span>{" "}
              {user?.skillLevel || "Non défini"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
