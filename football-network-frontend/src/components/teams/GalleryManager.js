// football-network-frontend/src/components/teams/GalleryManager.js
import React, { useState, useEffect } from "react";
import {
  Upload,
  X,
  Star,
  Trash2,
  Edit3,
  MoreVertical,
  Grid,
  List,
  Folder,
  Image as ImageIcon,
  Calendar,
  User,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const GalleryManager = ({ teamId, isCapta, onUpdate }) => {
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // États pour les modales
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // États pour l'upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadAlbum, setUploadAlbum] = useState("general");
  const [captions, setCaptions] = useState({});

  useEffect(() => {
    loadGallery();
    loadAlbums();
  }, [teamId, selectedAlbum]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedAlbum !== "all") {
        params.append("album", selectedAlbum);
      }
      params.append("limit", "100");

      const response = await axios.get(
        `${API_BASE_URL}/teams/${teamId}/media/gallery?${params}`
      );
      setPhotos(response.data.items || []);
    } catch (error) {
      console.error("Erreur chargement galerie:", error);
      toast.error("Impossible de charger la galerie");
    } finally {
      setLoading(false);
    }
  };

  const loadAlbums = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/teams/${teamId}/media/gallery/albums`
      );
      setAlbums(response.data.albums || []);
    } catch (error) {
      console.error("Erreur chargement albums:", error);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    // Filtrer les images
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      toast.error("Seules les images sont acceptées");
    }

    // Vérifier la taille
    const validFiles = imageFiles.filter(
      (file) => file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== imageFiles.length) {
      toast.error("Certaines images dépassent 5MB");
    }

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("photos", file);
      });
      formData.append("album", uploadAlbum);
      formData.append("captions", JSON.stringify(captions));

      await axios.post(
        `${API_BASE_URL}/teams/${teamId}/media/gallery`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(`${selectedFiles.length} photo(s) ajoutée(s)`);
      setShowUploadModal(false);
      setSelectedFiles([]);
      setCaptions({});
      loadGallery();
      loadAlbums();

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      toast.error(
        error.response?.data?.error || "Impossible d'uploader les photos"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/teams/${teamId}/media/gallery/${photoId}`
      );

      toast.success("Photo supprimée");
      loadGallery();
      loadAlbums();

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Impossible de supprimer la photo");
    }
  };

  const handleSetFeatured = async (photoId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/teams/${teamId}/media/gallery/${photoId}/featured`
      );

      toast.success("Photo mise en avant définie");
      loadGallery();

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur featured:", error);
      toast.error("Impossible de définir la photo en avant");
    }
  };

  const handleUpdateCaption = async (photoId, newCaption) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/teams/${teamId}/media/gallery/${photoId}`,
        { caption: newCaption }
      );

      toast.success("Légende mise à jour");
      loadGallery();
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Impossible de mettre à jour la légende");
    }
  };

  const openPhotoViewer = (photo, index) => {
    setSelectedPhoto(photo);
    setCurrentPhotoIndex(index);
    setShowViewModal(true);
  };

  const navigatePhoto = (direction) => {
    const newIndex =
      direction === "next"
        ? (currentPhotoIndex + 1) % photos.length
        : (currentPhotoIndex - 1 + photos.length) % photos.length;

    setCurrentPhotoIndex(newIndex);
    setSelectedPhoto(photos[newIndex]);
  };

  const renderPhotoGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => openPhotoViewer(photo, index)}
        >
          <img
            src={photo.variants?.medium?.path || photo.file_path}
            alt={photo.caption || "Photo"}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
            <Eye
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              size={32}
            />
          </div>

          {/* Featured Badge */}
          {photo.is_featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1.5 rounded-full">
              <Star size={16} fill="white" />
            </div>
          )}

          {/* Menu */}
          {isCapta && (
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="relative">
                <button className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Caption */}
          {photo.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
              <p className="text-white text-sm line-clamp-2">{photo.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderPhotoList = () => (
    <div className="space-y-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            {/* Thumbnail */}
            <div
              className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
              onClick={() => openPhotoViewer(photo, index)}
            >
              <img
                src={photo.variants?.thumbnail?.path || photo.file_path}
                alt={photo.caption || "Photo"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {photo.caption || "Sans légende"}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Folder size={14} />
                      <span>{photo.album}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>
                        {new Date(photo.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    {photo.uploader_first_name && (
                      <span className="flex items-center space-x-1">
                        <User size={14} />
                        <span>
                          {photo.uploader_first_name} {photo.uploader_last_name}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isCapta && (
                  <div className="flex items-center space-x-2">
                    {!photo.is_featured && (
                      <button
                        onClick={() => handleSetFeatured(photo.id)}
                        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                        title="Mettre en avant"
                      >
                        <Star size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Modifier"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {photo.is_featured && (
                <div className="mt-2">
                  <span className="inline-flex items-center space-x-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                    <Star size={12} fill="currentColor" />
                    <span>Photo en avant</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Galerie de l'équipe
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List size={18} />
            </button>
          </div>

          {/* Upload Button */}
          {isCapta && (
            <label className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer flex items-center space-x-2 font-medium">
              <Upload size={18} />
              <span>Ajouter des photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      {/* Albums Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedAlbum("all")}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              selectedAlbum === "all"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tous ({photos.length})
          </button>
          {albums.map((album) => (
            <button
              key={album.album}
              onClick={() => setSelectedAlbum(album.album)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                selectedAlbum === album.album
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {album.album} ({album.photo_count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Aucune photo dans cet album</p>
          {isCapta && (
            <label className="inline-flex px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer items-center space-x-2 font-medium">
              <Upload size={18} />
              <span>Ajouter des photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      ) : viewMode === "grid" ? (
        renderPhotoGrid()
      ) : (
        renderPhotoList()
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Ajouter {selectedFiles.length} photo
                {selectedFiles.length !== 1 ? "s" : ""}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                  setCaptions({});
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={uploading}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Album Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album
                </label>
                <select
                  value={uploadAlbum}
                  onChange={(e) => setUploadAlbum(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={uploading}
                >
                  <option value="general">Général</option>
                  <option value="matches">Matchs</option>
                  <option value="training">Entraînements</option>
                  <option value="events">Événements</option>
                  <option value="team">Équipe</option>
                </select>
              </div>

              {/* Files Preview */}
              <div className="space-y-3">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                  setCaptions({});
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                disabled={uploading}
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center space-x-2 disabled:bg-gray-400"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Upload...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Uploader</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {showViewModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <button
            onClick={() => setShowViewModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => navigatePhoto("prev")}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <ChevronLeft size={48} />
              </button>
              <button
                onClick={() => navigatePhoto("next")}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <ChevronRight size={48} />
              </button>
            </>
          )}

          {/* Image */}
          <div className="max-w-6xl max-h-[85vh] mx-auto">
            <img
              src={
                selectedPhoto.variants?.large?.path || selectedPhoto.file_path
              }
              alt={selectedPhoto.caption || "Photo"}
              className="max-w-full max-h-[85vh] object-contain"
            />
            {selectedPhoto.caption && (
              <p className="text-white text-center mt-4 text-lg">
                {selectedPhoto.caption}
              </p>
            )}
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Modifier la photo
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <img
                src={
                  selectedPhoto.variants?.medium?.path ||
                  selectedPhoto.file_path
                }
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Légende
                </label>
                <textarea
                  defaultValue={selectedPhoto.caption || ""}
                  onChange={(e) => {
                    setSelectedPhoto({
                      ...selectedPhoto,
                      caption: e.target.value,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Ajoutez une légende..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleUpdateCaption(selectedPhoto.id, selectedPhoto.caption);
                  setShowEditModal(false);
                }}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
