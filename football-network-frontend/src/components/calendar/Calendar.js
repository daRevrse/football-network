import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import CalendarGrid from "./CalendarGrid";
import EventModal from "./EventModal";
import AvailabilityModal from "./AvailabilityModal";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [matches, setMatches] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [viewMode, setViewMode] = useState("month"); // month, week

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);

      // Charger les matchs pour le mois courant
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const matchesResponse = await axios.get(`${API_BASE_URL}/matches`, {
        params: {
          limit: 100, // Pour avoir tous les matchs du mois
        },
      });

      // Filtrer les matchs du mois courant
      const monthMatches = matchesResponse.data.filter((match) => {
        const matchDate = new Date(match.matchDate);
        return matchDate >= startOfMonth && matchDate <= endOfMonth;
      });

      setMatches(monthMatches);

      // TODO: Charger les disponibilités des équipes
      // const availabilitiesResponse = await axios.get(`${API_BASE_URL}/teams/availability`);
      // setAvailabilities(availabilitiesResponse.data);
    } catch (error) {
      console.error("Error loading calendar data:", error);
      toast.error("Erreur lors du chargement du calendrier");
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
    });
  };

  const getCalendarEvents = () => {
    return matches.map((match) => ({
      id: match.id,
      title: `${match.homeTeam.name} vs ${match.awayTeam?.name || "TBD"}`,
      date: new Date(match.matchDate),
      type: "match",
      status: match.status,
      location: match.location,
      data: match,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-gray-600 mt-1">
            Visualisez vos matchs et gérez vos disponibilités
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Clock className="w-5 h-5 mr-2" />
            Disponibilités
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Contrôles du calendrier */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {formatMonthYear(currentDate)}
            </h2>

            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === "month"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === "week"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Semaine
            </button>
          </div>
        </div>

        {/* Calendrier */}
        <CalendarGrid
          currentDate={currentDate}
          events={getCalendarEvents()}
          viewMode={viewMode}
          onEventClick={handleEventClick}
          onDateClick={(date) => {
            // TODO: Implémenter création d'événement rapide
            console.log("Date clicked:", date);
          }}
        />
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Légende</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Matchs confirmés</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Matchs en attente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Disponibilités</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Matchs annulés</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEventModal && selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {showAvailabilityModal && (
        <AvailabilityModal
          onClose={() => setShowAvailabilityModal(false)}
          onSave={(availability) => {
            // TODO: Sauvegarder la disponibilité
            console.log("Save availability:", availability);
            toast.success("Disponibilité enregistrée");
            setShowAvailabilityModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
