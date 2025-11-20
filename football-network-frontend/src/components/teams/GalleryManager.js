import React, { useState, useEffect } from "react";
import {
  Upload,
  X,
  Star,
  Trash2,
  MoreVertical,
  Grid,
  List,
  Image as ImageIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const GalleryManager = ({ teamId, isCapta, onUpdate }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // Modales
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadGallery();
  }, [teamId]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/teams/${teamId}/media/gallery`
      );
      setPhotos(response.data.items || []);
    } catch (error) {
      console.error("Erreur galerie");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("photos", file));

      await axios.post(
        `${API_BASE_URL}/teams/${teamId}/media/gallery`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success("Photos ajoutées !");
      setShowUploadModal(false);
      setSelectedFiles([]);
      loadGallery();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/teams/${teamId}/media/gallery/${photoId}`
      );
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success("Photo supprimée");
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition ${
              viewMode === "grid"
                ? "bg-white shadow text-green-600"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition ${
              viewMode === "list"
                ? "bg-white shadow text-green-600"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <List size={18} />
          </button>
        </div>

        {isCapta && (
          <>
            <input
              type="file"
              multiple
              accept="image/*"
              id="gallery-upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  setSelectedFiles(Array.from(e.target.files));
                  setShowUploadModal(true);
                }
              }}
            />
            <label
              htmlFor="gallery-upload"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center font-medium text-sm transition shadow-sm"
            >
              <Upload className="w-4 h-4 mr-2" /> Ajouter
            </label>
          </>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">La galerie est vide.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer border border-gray-200"
            >
              <img
                src={photo.url || photo.file_path}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => {
                    setLightboxIndex(idx);
                    setShowLightbox(true);
                  }}
                  className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition"
                >
                  <Eye size={20} />
                </button>
              </div>

              {/* Admin Actions */}
              {isCapta && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="flex items-center p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition"
            >
              <img
                src={photo.url || photo.file_path}
                alt=""
                className="w-16 h-16 object-cover rounded-lg bg-gray-100"
              />
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Photo #{idx + 1}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
              {isCapta && (
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="text-gray-400 hover:text-red-500 p-2"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal Preview */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Confirmer l'upload</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-3 gap-3">
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden relative group"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-bold flex items-center"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Uploader {selectedFiles.length} photo(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-sm">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white"
          >
            <X size={32} />
          </button>

          <button
            onClick={() =>
              setLightboxIndex((i) => (i - 1 + photos.length) % photos.length)
            }
            className="absolute left-4 text-white/50 hover:text-white p-4"
          >
            <ChevronLeft size={48} />
          </button>

          <img
            src={photos[lightboxIndex]?.url || photos[lightboxIndex]?.file_path}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
          />

          <button
            onClick={() => setLightboxIndex((i) => (i + 1) % photos.length)}
            className="absolute right-4 text-white/50 hover:text-white p-4"
          >
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-6 text-white/50 text-sm font-medium tracking-widest">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
