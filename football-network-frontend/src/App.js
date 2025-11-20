// football-network-frontend/src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserProfileProvider } from "./contexts/UserContext";

// Importations des composants
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/layout/Navbar";
import Profile from "./components/Profile";
import MyTeams from "./components/teams/MyTeams";
import SearchTeams from "./components/teams/SearchTeams";
import Invitations from "./components/matches/Invitations";
import MatchDetails from "./components/matches/MatchDetails";
import Matches from "./components/matches/Matches";
import Calendar from "./components/calendar/Calendar";
import TeamDetails from "./components/teams/TeamDetails";
import PlayerInvitations from "./components/invitations/PlayerInvitations";
import MatchValidation from "./components/matches/MatchValidation";
import PendingValidations from "./components/matches/PendingValidations";
import Feed from "./components/Feed";
import LandingFeed from "./components/LandingFeed";
import "./index.css";

// Composant de protection des routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Composant pour les routes publiques
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <Router>
          {/* Utilisation de flex-col pour pousser le footer (si ajouté plus tard) vers le bas */}
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <Navbar />

            {/* SUPPRESSION de "container mx-auto px-4 py-8". 
               Maintenant le main prend toute la largeur par défaut.
               Chaque page (Dashboard, Feed, etc.) gère ses propres marges.
            */}
            <main className="flex-1 w-full relative">
              <Routes>
                <Route path="/" element={<LandingFeed />} />

                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <Signup />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPassword />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <PublicRoute>
                      <ResetPassword />
                    </PublicRoute>
                  }
                />

                {/* Routes Protégées */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/feed"
                  element={
                    <ProtectedRoute>
                      <Feed />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teams"
                  element={
                    <ProtectedRoute>
                      <MyTeams />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teams/:teamId"
                  element={
                    <ProtectedRoute>
                      <TeamDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teams/search"
                  element={
                    <ProtectedRoute>
                      <SearchTeams />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invitations"
                  element={
                    <ProtectedRoute>
                      <Invitations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/player-invitations"
                  element={
                    <ProtectedRoute>
                      <PlayerInvitations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/matches"
                  element={
                    <ProtectedRoute>
                      <Matches />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/matches/:matchId"
                  element={
                    <ProtectedRoute>
                      <MatchDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/matches/:matchId/validate"
                  element={
                    <ProtectedRoute>
                      <MatchValidation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pending-validations"
                  element={
                    <ProtectedRoute>
                      <PendingValidations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </Router>
      </UserProfileProvider>
    </AuthProvider>
  );
}

export default App;
