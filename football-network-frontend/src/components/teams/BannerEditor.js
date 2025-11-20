import React, { useState } from "react";
import { X, Save, ArrowUp, ArrowDown, Loader2, Layout } from "lucide-react";

const BannerEditor = ({ image, onSave, onCancel, loading }) => {
  const [position, setPosition] = useState("center"); // 'top', 'center', 'bottom'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Ajuster la bannière</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Preview Area */}
          <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden mb-6 border-2 border-dashed border-gray-300">
            <img
              src={image.preview}
              alt="Preview"
              className="w-full h-full object-cover transition-all duration-300"
              style={{ objectPosition: position }}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                Zone visible
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {[
              { id: "top", label: "Haut", icon: ArrowUp },
              { id: "center", label: "Centre", icon: Layout },
              { id: "bottom", label: "Bas", icon: ArrowDown },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPosition(opt.id)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all w-24 ${
                  position === opt.id
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <opt.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(image.file, position)}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center shadow-lg shadow-green-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerEditor;
