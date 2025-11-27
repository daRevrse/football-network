import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserProfileProvider } from "./contexts/UserContext";

// Layouts
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/admin/AdminLayout";
import VenueOwnerLayout from "./components/layout/VenueOwnerLayout";

// Composants Standards
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import Dashboard from "./components/Dashboard";
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
import PendingParticipations from "./components/participations/PendingParticipations";
import Feed from "./components/Feed";
import LandingFeed from "./components/LandingFeed";
import VenueSearch from "./components/venues/VenueSearch";
import VenueDetails from "./components/venues/VenueDetails";
import RefereeSearch from "./components/referees/RefereeSearch";
import RefereeProfile from "./components/referees/RefereeProfile";

// Composants Admin & Venue Owner
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminProfile from "./components/admin/AdminProfile";
import VenueOwnerDashboard from "./components/venue-owner/VenueOwnerDashboard";
import VenueOwnerBookings from "./components/venue-owner/VenueOwnerBookings";
import VenueOwnerProfile from "./components/venue-owner/VenueOwnerProfile";
import VenueForm from "./components/venue-owner/VenueForm";
import VenueBookingDetails from "./components/venue-owner/VenueBookingDetails";
import VenueCalendar from "./components/venue-owner/VenueCalendar";
import VenueStats from "./components/venue-owner/VenueStats";
import BookingManagement from "./components/venue-owner/BookingManagement";

// Protection
import {
  ManagerOnlyRoute,
  SuperadminOnlyRoute,
} from "./components/routes/RoleProtectedRoute";

// --- NOUVEAU COMPOSANT : Gestion intelligente de la racine "/" ---
const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Si pas connecté, on montre la Landing Page
  if (!user) {
    return <LandingFeed />;
  }

  // Si connecté, redirection selon le rôle
  switch (user.userType) {
    case "superadmin":
      return <Navigate to="/admin" replace />;
    case "venue_owner":
      return <Navigate to="/venue-owner" replace />;
    default:
      // Joueurs, Managers, Arbitres vont au dashboard standard
      return <Navigate to="/dashboard" replace />;
  }
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (user) {
    if (user.userType === "superadmin") return <Navigate to="/admin" />;
    if (user.userType === "venue_owner") return <Navigate to="/venue-owner" />;
    return <Navigate to="/dashboard" />;
  }
  return children;
};

// ProfileRouter - Shows appropriate profile based on user type
const ProfileRouter = () => {
  const { user } = useAuth();

  // Referee users get RefereeProfile
  if (user?.userType === "referee") {
    return <RefereeProfile />;
  }

  // Players and Managers get the standard Profile
  return <Profile />;
};

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <Router>
          <div className="font-sans text-gray-900">
            <Routes>
              {/* === ZONE ADMIN (Layout dédié) === */}
              <Route
                path="/admin"
                element={
                  <SuperadminOnlyRoute>
                    <AdminLayout>
                      <Outlet />
                    </AdminLayout>
                  </SuperadminOnlyRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="profile" element={<AdminProfile />} />
              </Route>

              {/* === ZONE VENUE OWNER (Layout dédié) === */}
              <Route
                path="/venue-owner"
                element={
                  <ProtectedRoute>
                    <VenueOwnerLayout>
                      <Outlet />
                    </VenueOwnerLayout>
                  </ProtectedRoute>
                }
              >
                <Route index element={<VenueOwnerDashboard />} />
                <Route path="bookings" element={<BookingManagement />} />
                <Route path="bookings-legacy" element={<VenueOwnerBookings />} />
                <Route
                  path="venues/:id/bookings"
                  element={<VenueBookingDetails />}
                />
                <Route path="venues/new" element={<VenueForm />} />
                <Route path="venues/:id/calendar" element={<VenueCalendar />} />
                <Route path="stats" element={<VenueStats />} />
                <Route path="profile" element={<VenueOwnerProfile />} />
              </Route>

              {/* === ZONE STANDARD (MainLayout avec Navbar) === */}
              <Route
                element={
                  <MainLayout>
                    <Outlet />
                  </MainLayout>
                }
              >
                {/* La route racine utilise maintenant RootRoute pour diriger l'utilisateur */}
                <Route path="/" element={<RootRoute />} />

                {/* Routes Publiques */}
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

                {/* Routes Protégées Standard (Joueurs/Managers) */}
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
                      <ProfileRouter />
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
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  }
                />

                {/* Équipes */}
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

                {/* Matchs */}
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
                  path="/matches/:matchId"
                  element={
                    <ProtectedRoute>
                      <MatchDetails />
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
                  path="/participations"
                  element={
                    <ProtectedRoute>
                      <PendingParticipations />
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

                {/* Manager Only */}
                <Route
                  path="/matches"
                  element={
                    <ManagerOnlyRoute>
                      <Matches />
                    </ManagerOnlyRoute>
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

                {/* Recherche Terrains (Vue Joueur) */}
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
              </Route>

              {/* Route 404 - Redirige vers la racine qui triera ensuite */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </UserProfileProvider>
    </AuthProvider>
  );
}

export default App;
