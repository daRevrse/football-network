// football-network-frontend/src/components/teams/LogoEditor.js
import React, { useState, useRef, useEffect } from "react";
import { X, Save, RotateCw, ZoomIn, ZoomOut, Move } from "lucide-react";

const LogoEditor = ({ image, onSave, onCancel, loading }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const CANVAS_SIZE = 400; // Taille du canvas carré
  const CROP_SIZE = 400; // Taille du crop final

  useEffect(() => {
    loadImage();
  }, [image]);

  useEffect(() => {
    drawCanvas();
  }, [scale, position, imageSize]);

  const loadImage = () => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;

      // Calculer la taille initiale pour que l'image remplisse le canvas
      const aspectRatio = img.width / img.height;
      let initialWidth, initialHeight;

      if (aspectRatio > 1) {
        initialHeight = CANVAS_SIZE;
        initialWidth = CANVAS_SIZE * aspectRatio;
      } else {
        initialWidth = CANVAS_SIZE;
        initialHeight = CANVAS_SIZE / aspectRatio;
      }

      setImageSize({ width: initialWidth, height: initialHeight });

      // Centrer l'image
      setPosition({
        x: (CANVAS_SIZE - initialWidth) / 2,
        y: (CANVAS_SIZE - initialHeight) / 2,
      });
    };

    img.src = image.preview;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext("2d");

    // Effacer le canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dessiner l'image
    ctx.save();
    ctx.drawImage(
      imageRef.current,
      position.x,
      position.y,
      imageSize.width * scale,
      imageSize.height * scale
    );
    ctx.restore();

    // Dessiner la zone de crop (cercle)
    ctx.save();
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 - 10,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();

    // Assombrir la zone hors du cercle
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 - 10,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({
      x: (CANVAS_SIZE - imageSize.width) / 2,
      y: (CANVAS_SIZE - imageSize.height) / 2,
    });
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Créer un canvas temporaire pour le crop final
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = CROP_SIZE;
    cropCanvas.height = CROP_SIZE;
    const cropCtx = cropCanvas.getContext("2d");

    // Dessiner l'image cropée
    cropCtx.save();
    cropCtx.beginPath();
    cropCtx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    cropCtx.closePath();
    cropCtx.clip();

    cropCtx.drawImage(
      imageRef.current,
      position.x,
      position.y,
      imageSize.width * scale,
      imageSize.height * scale
    );
    cropCtx.restore();

    // Convertir en blob
    cropCanvas.toBlob(
      (blob) => {
        if (blob) {
          // Calculer les données de crop pour le backend
          const cropData = {
            x: -position.x,
            y: -position.y,
            width: imageSize.width * scale,
            height: imageSize.height * scale,
            targetWidth: CROP_SIZE,
            targetHeight: CROP_SIZE,
          };

          onSave(blob, cropData);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Recadrer le logo</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-6">
          <div
            ref={containerRef}
            className="relative mx-auto bg-gray-100 rounded-lg overflow-hidden"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 flex items-center justify-center space-x-2">
              <Move size={16} />
              <span>
                Glissez pour repositionner • Utilisez les boutons pour zoomer
              </span>
            </p>
          </div>

          {/* Contrôles */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <button
              onClick={handleZoomOut}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading || scale <= 0.5}
            >
              <ZoomOut size={20} />
            </button>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Zoom:</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-32"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-900 w-12">
                {Math.round(scale * 100)}%
              </span>
            </div>

            <button
              onClick={handleZoomIn}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading || scale >= 3}
            >
              <ZoomIn size={20} />
            </button>

            <button
              onClick={handleReset}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              <RotateCw size={20} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
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
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoEditor;
