import React, { useState } from "react";
import { X, Clock, Plus, Trash2 } from "lucide-react";

const AvailabilityModal = ({ onClose, onSave }) => {
  const [availabilities, setAvailabilities] = useState([
    { id: 1, dayOfWeek: 6, startTime: "14:00", endTime: "18:00" }, // Samedi par défaut
  ]);

  const daysOfWeek = [
    { value: 0, label: "Dimanche" },
    { value: 1, label: "Lundi" },
    { value: 2, label: "Mardi" },
    { value: 3, label: "Mercredi" },
    { value: 4, label: "Jeudi" },
    { value: 5, label: "Vendredi" },
    { value: 6, label: "Samedi" },
  ];

  const addAvailability = () => {
    const newId = Math.max(...availabilities.map((a) => a.id), 0) + 1;
    setAvailabilities([
      ...availabilities,
      { id: newId, dayOfWeek: 6, startTime: "14:00", endTime: "18:00" },
    ]);
  };

  const removeAvailability = (id) => {
    setAvailabilities(availabilities.filter((a) => a.id !== id));
  };

  const updateAvailability = (id, field, value) => {
    setAvailabilities(
      availabilities.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSave = () => {
    onSave(availabilities);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Mes disponibilités
            </h2>
            <p className="text-gray-600 mt-1">
              Indiquez quand vous êtes disponibles pour jouer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="space-y-4">
            {availabilities.map((availability) => (
              <div
                key={availability.id}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jour
                    </label>
                    <select
                      value={availability.dayOfWeek}
                      onChange={(e) =>
                        updateAvailability(
                          availability.id,
                          "dayOfWeek",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de début
                    </label>
                    <input
                      type="time"
                      value={availability.startTime}
                      onChange={(e) =>
                        updateAvailability(
                          availability.id,
                          "startTime",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure de fin
                    </label>
                    <input
                      type="time"
                      value={availability.endTime}
                      onChange={(e) =>
                        updateAvailability(
                          availability.id,
                          "endTime",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={() => removeAvailability(availability.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={availabilities.length === 1}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addAvailability}
            className="mt-4 flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un créneau
          </button>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Clock className="w-4 h-4 mr-2" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;
