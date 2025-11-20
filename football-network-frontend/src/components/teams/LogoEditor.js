import React, { useState, useRef, useEffect } from "react";
import { X, Save, ZoomIn, ZoomOut, RotateCw, Loader2 } from "lucide-react";

const LogoEditor = ({ image, onSave, onCancel, loading }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());

  useEffect(() => {
    imgRef.current.src = image.preview;
    imgRef.current.onload = draw;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, rotation]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 300; // Canvas size

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Background for transparency
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw Image centered
    const img = imgRef.current;
    if (img.width) {
      const ratio = Math.max(size / img.width, size / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
    ctx.restore();

    // Overlay Circle Mask
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Border ring
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#22c55e"; // Green-500
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const handleSave = () => {
    canvasRef.current.toBlob(
      (blob) => {
        onSave(blob);
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Ajuster le logo</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="rounded-full shadow-inner bg-gray-100 cursor-move mb-6"
          />

          <div className="flex items-center space-x-4 w-full justify-center">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <ZoomOut size={20} />
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-32 accent-green-600"
            />
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.1))}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <ZoomIn size={20} />
            </button>
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <button
              onClick={() => setRotation((r) => r + 90)}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <RotateCw size={20} />
            </button>
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
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center shadow-lg shadow-green-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoEditor;
