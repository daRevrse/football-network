import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VenueCalendar = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState(id || "");
  const [bookings, setBookings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  // Charger les terrains au démarrage
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/venue-owner/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.venues.length > 0) {
          setVenues(res.data.venues);
          // Si pas d'ID dans URL, utiliser le premier terrain
          if (!id) {
            setSelectedVenueId(res.data.venues[0].id);
          }
        }
      } catch (error) {
        console.error("Erreur chargement terrains", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, [id]);

  // Charger le calendrier quand le terrain ou la date change
  useEffect(() => {
    if (selectedVenueId) {
      fetchCalendarData();
    }
  }, [selectedVenueId, currentDate]);

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem("token");
      // Calculer début et fin de semaine
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Lundi
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

      const response = await axios.get(
        `${API_BASE_URL}/venue-owner/venues/${selectedVenueId}/calendar`,
        {
          params: {
            start_date: startOfWeek.toISOString().split("T")[0],
            end_date: endOfWeek.toISOString().split("T")[0],
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookings(response.data.bookings);
    } catch (error) {
      console.error("Erreur calendrier", error);
    }
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };

  // Génération de la grille (08h - 23h)
  const hours = Array.from({ length: 16 }, (_, i) => i + 8);
  const days = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  const getBookingsForCell = (dayIndex, hour) => {
    // Logique simplifiée : trouver une réservation qui correspond au jour et à l'heure
    // Note: Une implémentation réelle gérerait mieux les chevauchements
    const currentDayDate = new Date(currentDate);
    const dayDiff =
      currentDayDate.getDay() === 0 ? 6 : currentDayDate.getDay() - 1; // Ajuster pour Lundi=0
    const targetDate = new Date(currentDate);
    targetDate.setDate(currentDate.getDate() - dayDiff + dayIndex);
    const dateStr = targetDate.toISOString().split("T")[0];

    return bookings.filter((b) => {
      const bDate = new Date(b.booking_date).toISOString().split("T")[0];
      const bHour = parseInt(b.start_time.split(":")[0]);
      return bDate === dateStr && bHour === hour;
    });
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Contrôles */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm">
          <button onClick={prevWeek} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft />
          </button>
          <span className="font-bold text-lg min-w-[200px] text-center">
            {currentDate.toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}{" "}
            (Semaine {getWeekNumber(currentDate)})
          </span>
          <button onClick={nextWeek} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="p-2 border rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-green-500"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAvailabilityModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            <Settings className="w-4 h-4" /> Config. Horaires
          </button>
        </div>
      </div>

      {/* Grille Calendrier */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-auto flex-1">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="p-4 border-r border-gray-100 bg-gray-50 text-gray-400 font-medium text-center">
              H
            </div>
            {days.map((day, i) => (
              <div
                key={day}
                className={`p-4 border-r border-gray-100 text-center font-bold ${
                  new Date().getDay() === (i + 1) % 7
                    ? "text-green-600 bg-green-50"
                    : "text-gray-700"
                }`}
              >
                {day}
                <div className="text-xs font-normal text-gray-400">
                  {getDateForDay(currentDate, i).getDate()}
                </div>
              </div>
            ))}
          </div>

          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b border-gray-100 h-20"
            >
              <div className="p-2 border-r border-gray-100 bg-gray-50 text-xs text-gray-400 text-center flex items-center justify-center">
                {hour}:00
              </div>
              {days.map((_, dayIndex) => {
                const cellBookings = getBookingsForCell(dayIndex, hour);
                return (
                  <div
                    key={dayIndex}
                    className="border-r border-gray-100 relative p-1 transition hover:bg-gray-50"
                  >
                    {cellBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`
                        absolute inset-x-1 top-1 bottom-1 rounded-md p-2 text-xs font-medium border-l-4 overflow-hidden
                        ${
                          booking.status === "confirmed"
                            ? "bg-green-100 border-green-500 text-green-800"
                            : "bg-yellow-100 border-yellow-500 text-yellow-800"
                        }
                      `}
                      >
                        <div className="font-bold truncate">
                          {booking.team_name}
                        </div>
                        <div>{booking.start_time}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Availability Simplifiée (À implémenter complètement selon besoin) */}
      {showAvailabilityModal && (
        <AvailabilitySettingsModal
          venueId={selectedVenueId}
          onClose={() => setShowAvailabilityModal(false)}
        />
      )}
    </div>
  );
};

// Helper Dates
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
function getDateForDay(current, dayIndex) {
  const d = new Date(current);
  const day = d.getDay() || 7;
  if (day !== dayIndex + 1) d.setHours(-24 * (day - 1 - dayIndex));
  return d;
}

const AvailabilitySettingsModal = ({ venueId, onClose }) => {
  // Implémentation basique pour l'exemple
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96">
        <h3 className="font-bold text-lg mb-4">Configuration des horaires</h3>
        <p className="text-sm text-gray-500 mb-6">
          Cette fonctionnalité permettra de définir les heures d'ouverture par
          jour (Lundi-Dimanche).
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg text-gray-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueCalendar;
