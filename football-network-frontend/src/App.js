// football-network-frontend/src/App.js - MISE À JOUR
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/layout/Navbar";
import "./index.css";
import Profile from "./components/Profile";
import MyTeams from "./components/teams/MyTeams";
import SearchTeams from "./components/teams/SearchTeams";
import Invitations from "./components/matches/Invitations";
import MatchDetails from "./components/matches/MatchDetails";
import Matches from "./components/matches/Matches";
import Calendar from "./components/calendar/Calendar";
import TeamDetails from "./components/teams/TeamDetails";
// NOUVELLES IMPORTATIONS
import PlayerInvitations from "./components/invitations/PlayerInvitations";
import MatchValidation from "./components/matches/MatchValidation";
import PendingValidations from "./components/matches/PendingValidations";
import Feed from "./components/Feed";
import { UserProfileProvider } from "./contexts/UserContext";

// Composant de protection des routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Composant pour les routes publiques (redirect si connecté)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
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
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
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
                {/* NOUVELLE ROUTE : Invitations de joueurs */}
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
