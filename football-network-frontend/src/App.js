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
import MatchParticipations from "./components/matches/MatchParticipations";
import MyPendingParticipations from "./components/matches/MyPendingParticipations";
import Feed from "./components/Feed";
import LandingFeed from "./components/LandingFeed";
// Phase 2 - Venues et Referees
import VenueSearch from "./components/venues/VenueSearch";
import VenueDetails from "./components/venues/VenueDetails";
import RefereeSearch from "./components/referees/RefereeSearch";
// Phase 4 - Admin
import AdminDashboard from "./components/admin/AdminDashboard";
// Phase 5 - Venue Owner
import VenueOwnerDashboard from "./components/venue-owner/VenueOwnerDashboard";
import VenueOwnerBookings from "./components/venue-owner/VenueOwnerBookings";
// Protection de routes par rôle
import { ManagerOnlyRoute, SuperadminOnlyRoute, PlayerOrManagerRoute } from "./components/routes/RoleProtectedRoute";
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
                    <ManagerOnlyRoute>
                      <Matches />
                    </ManagerOnlyRoute>
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
                  path="/matches/:matchId/participations"
                  element={
                    <ProtectedRoute>
                      <MatchParticipations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-participations"
                  element={
                    <ProtectedRoute>
                      <MyPendingParticipations />
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

                {/* Phase 2 - Routes Venues et Referees */}
                <Route
                  path="/venues"
                  element={
                    <ProtectedRoute>
                      <VenueSearch />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/venues/:id"
                  element={
                    <ProtectedRoute>
                      <VenueDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/referees"
                  element={
                    <ManagerOnlyRoute>
                      <RefereeSearch />
                    </ManagerOnlyRoute>
                  }
                />

                {/* Phase 4 - Routes Admin (Superadmin uniquement) */}
                <Route
                  path="/admin"
                  element={
                    <SuperadminOnlyRoute>
                      <AdminDashboard />
                    </SuperadminOnlyRoute>
                  }
                />

                {/* Phase 5 - Routes Venue Owner */}
                <Route
                  path="/venue-owner"
                  element={
                    <ProtectedRoute>
                      <VenueOwnerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/venue-owner/bookings"
                  element={
                    <ProtectedRoute>
                      <VenueOwnerBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/venue-owner/bookings/:id"
                  element={
                    <ProtectedRoute>
                      <VenueOwnerBookings />
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
