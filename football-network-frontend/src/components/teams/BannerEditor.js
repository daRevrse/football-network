// football-network-frontend/src/components/teams/BannerEditor.js
import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Save,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from "lucide-react";

const BannerEditor = ({ image, onSave, onCancel, loading }) => {
  const [position, setPosition] = useState("center");
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageRef = useRef(null);
  const previewRef = useRef(null);

  const BANNER_WIDTH = 1200;
  const BANNER_HEIGHT = 400;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = image.preview;
  }, [image]);

  const positions = [
    {
      value: "top",
      label: "Haut",
      icon: AlignVerticalJustifyStart,
      description: "Affiche le haut de l'image",
    },
    {
      value: "center",
      label: "Centre",
      icon: AlignVerticalJustifyCenter,
      description: "Centre l'image verticalement",
    },
    {
      value: "bottom",
      label: "Bas",
      icon: AlignVerticalJustifyEnd,
      description: "Affiche le bas de l'image",
    },
  ];

  const handleSave = () => {
    if (image.file) {
      onSave(image.file, position);
    }
  };

  const getObjectPosition = () => {
    switch (position) {
      case "top":
        return "top";
      case "bottom":
        return "bottom";
      case "center":
      default:
        return "center";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Positionner la bannière
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Choisissez comment positionner votre bannière
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Preview */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Prévisualisation
            </h4>
            <div
              ref={previewRef}
              className="relative mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-lg"
              style={{
                width: "100%",
                maxWidth: BANNER_WIDTH,
                height: 300,
              }}
            >
              {imageLoaded && (
                <img
                  src={image.preview}
                  alt="Preview"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{
                    objectPosition: getObjectPosition(),
                  }}
                />
              )}

              {/* Overlay avec dimensions */}
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-xs font-medium">
                {BANNER_WIDTH} × {BANNER_HEIGHT}
              </div>
            </div>
          </div>

          {/* Position Controls */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">
              Position verticale
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {positions.map((pos) => {
                const Icon = pos.icon;
                return (
                  <button
                    key={pos.value}
                    onClick={() => setPosition(pos.value)}
                    disabled={loading}
                    className={`relative p-6 rounded-lg border-2 transition-all ${
                      position === pos.value
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div
                        className={`p-3 rounded-full ${
                          position === pos.value
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon size={24} />
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-semibold ${
                            position === pos.value
                              ? "text-green-700"
                              : "text-gray-900"
                          }`}
                        >
                          {pos.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {pos.description}
                        </div>
                      </div>
                    </div>

                    {/* Checkmark */}
                    {position === pos.value && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                i
              </div>
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-medium mb-1">
                  Conseils pour une belle bannière :
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>
                    Utilisez une image de haute qualité (minimum 1200 × 400
                    pixels)
                  </li>
                  <li>Évitez le texte important près des bords</li>
                  <li>Choisissez une position qui met en valeur votre image</li>
                  <li>Les couleurs vives attirent l'attention</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">16:9</div>
              <div className="text-xs text-gray-600 mt-1">
                Format recommandé
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">5MB</div>
              <div className="text-xs text-gray-600 mt-1">Taille maximale</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">JPG</div>
              <div className="text-xs text-gray-600 mt-1">Format accepté</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Position sélectionnée :{" "}
            <span className="font-semibold text-gray-900">
              {positions.find((p) => p.value === position)?.label}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Enregistrer la bannière</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerEditor;
