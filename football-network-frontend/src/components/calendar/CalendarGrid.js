import React from "react";

const CalendarGrid = ({
  currentDate,
  events,
  viewMode,
  onEventClick,
  onDateClick,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Jours du mois précédent pour compléter la première semaine
    const prevMonthDays = [];
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(new Date(year, month - 1, prevMonth.getDate() - i));
    }

    // Jours du mois courant
    const currentMonthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      currentMonthDays.push(new Date(year, month, day));
    }

    // Jours du mois suivant pour compléter la dernière semaine
    const nextMonthDays = [];
    const totalCells = 42; // 6 semaines × 7 jours
    const remainingCells =
      totalCells - prevMonthDays.length - currentMonthDays.length;
    for (let day = 1; day <= remainingCells; day++) {
      nextMonthDays.push(new Date(year, month + 1, day));
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventColor = (event) => {
    switch (event.type) {
      case "match":
        switch (event.status) {
          case "confirmed":
            return "bg-green-500";
          case "pending":
            return "bg-yellow-500";
          case "cancelled":
            return "bg-red-500";
          case "completed":
            return "bg-gray-500";
          default:
            return "bg-blue-500";
        }
      case "availability":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  const days = getMonthDays();
  const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  return (
    <div className="p-6">
      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center font-medium text-gray-600 text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDay = isToday(date);

          return (
            <div
              key={index}
              onClick={() => onDateClick(date)}
              className={`min-h-[120px] p-2 border border-gray-100 cursor-pointer transition-colors ${
                isCurrentMonthDay ? "hover:bg-gray-50" : "bg-gray-50/50"
              } ${isTodayDay ? "bg-blue-50 border-blue-200" : ""}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isCurrentMonthDay ? "text-gray-900" : "text-gray-400"
                } ${isTodayDay ? "text-blue-600" : ""}`}
              >
                {date.getDate()}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`text-xs text-white px-2 py-1 rounded truncate ${getEventColor(
                      event
                    )} hover:opacity-80 transition-opacity cursor-pointer`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{dayEvents.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
