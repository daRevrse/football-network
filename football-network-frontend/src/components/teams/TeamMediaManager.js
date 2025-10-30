// football-network-frontend/src/components/teams/TeamMediaManager.js
import React, { useState, useEffect } from "react";
import {
  Image,
  Upload,
  X,
  Crop,
  Save,
  Trash2,
  Eye,
  Star,
  Grid,
  Folder,
  MoreVertical,
  Move,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import LogoEditor from "./LogoEditor";
import BannerEditor from "./BannerEditor";
import GalleryManager from "./GalleryManager";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TeamMediaManager = ({ team, isCapta, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("logo"); // logo, banner, gallery
  const [loading, setLoading] = useState(false);
  const [teamData, setTeamData] = useState(team);

  // États pour les modales
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    setTeamData(team);
  }, [team]);

  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage({
        file,
        preview: e.target.result,
      });

      if (type === "logo") {
        setShowLogoEditor(true);
      } else if (type === "banner") {
        setShowBannerEditor(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoSave = async (croppedBlob, cropData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("logo", croppedBlob, "logo.jpg");

      if (cropData) {
        formData.append("cropData", JSON.stringify(cropData));
      }

      const response = await axios.post(
        `${API_BASE_URL}/teams/${teamData.id}/media/logo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Logo mis à jour avec succès");
      setShowLogoEditor(false);
      setSelectedImage(null);

      if (onUpdate) {
        onUpdate();
      }

      // Recharger les données de l'équipe
      const teamResponse = await axios.get(
        `${API_BASE_URL}/teams/${teamData.id}`
      );
      setTeamData(teamResponse.data);
    } catch (error) {
      console.error("Erreur upload logo:", error);
      toast.error(
        error.response?.data?.error || "Impossible de mettre à jour le logo"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBannerSave = async (file, position = "center") => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("banner", file);
      formData.append("position", position);

      await axios.post(
        `${API_BASE_URL}/teams/${teamData.id}/media/banner`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Bannière mise à jour avec succès");
      setShowBannerEditor(false);
      setSelectedImage(null);

      if (onUpdate) {
        onUpdate();
      }

      // Recharger les données de l'équipe
      const teamResponse = await axios.get(
        `${API_BASE_URL}/teams/${teamData.id}`
      );
      setTeamData(teamResponse.data);
    } catch (error) {
      console.error("Erreur upload bannière:", error);
      toast.error(
        error.response?.data?.error || "Impossible de mettre à jour la bannière"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBannerPositionChange = async (position) => {
    try {
      setLoading(true);

      await axios.patch(
        `${API_BASE_URL}/teams/${teamData.id}/media/banner/position`,
        {
          position,
        }
      );

      toast.success("Position mise à jour");

      if (onUpdate) {
        onUpdate();
      }

      // Recharger les données
      const teamResponse = await axios.get(
        `${API_BASE_URL}/teams/${teamData.id}`
      );
      setTeamData(teamResponse.data);
    } catch (error) {
      console.error("Erreur position bannière:", error);
      toast.error(
        error.response?.data?.error || "Impossible de changer la position"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecropLogo = () => {
    if (!teamData.logo_id) return;

    // Charger le logo actuel pour recadrage
    setSelectedImage({
      preview: `${API_BASE_URL}/uploads/teams/${teamData.logo_id}`,
      isRecrop: true,
    });
    setShowLogoEditor(true);
  };

  const renderTabBar = () => (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex space-x-8 px-6">
        <button
          onClick={() => setActiveTab("logo")}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "logo"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Image size={18} />
            <span>Logo</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("banner")}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "banner"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Image size={18} />
            <span>Bannière</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("gallery")}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "gallery"
              ? "border-green-500 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Grid size={18} />
            <span>Galerie</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderLogoTab = () => (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Logo de l'équipe</h3>

      {teamData.logo_id ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-100 mb-6">
              <img
                src={`${API_BASE_URL}/uploads/teams/${teamData.logo_id}`}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>

            {isCapta && (
              <div className="flex space-x-3">
                <label className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer flex items-center space-x-2 font-medium">
                  <Upload size={18} />
                  <span>Changer le logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "logo")}
                    className="hidden"
                    disabled={loading}
                  />
                </label>

                <button
                  onClick={handleRecropLogo}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 font-medium"
                  disabled={loading}
                >
                  <Crop size={18} />
                  <span>Recadrer</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Image size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-6">Aucun logo pour cette équipe</p>

            {isCapta && (
              <label className="inline-flex px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer items-center space-x-2 font-medium">
                <Upload size={18} />
                <span>Ajouter un logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "logo")}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderBannerTab = () => (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Bannière de l'équipe
      </h3>

      {teamData.banner_id ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative">
            <img
              src={`${API_BASE_URL}/uploads/teams/${teamData.banner_id}`}
              alt="Bannière"
              className="w-full h-64 object-cover"
              style={{
                objectPosition: teamData.banner_position || "center",
              }}
            />
          </div>

          {isCapta && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Position de la bannière
                </span>
                <div className="flex space-x-2">
                  {["top", "center", "bottom"].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => handleBannerPositionChange(pos)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        teamData.banner_position === pos
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {pos === "top"
                        ? "Haut"
                        : pos === "center"
                        ? "Centre"
                        : "Bas"}
                    </button>
                  ))}
                </div>
              </div>

              <label className="inline-flex w-full justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer items-center space-x-2 font-medium">
                <Upload size={18} />
                <span>Changer la bannière</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "banner")}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Image size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-6">
              Aucune bannière pour cette équipe
            </p>

            {isCapta && (
              <label className="inline-flex px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer items-center space-x-2 font-medium">
                <Upload size={18} />
                <span>Ajouter une bannière</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "banner")}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderGalleryTab = () => (
    <GalleryManager
      teamId={teamData.id}
      isCapta={isCapta}
      onUpdate={onUpdate}
    />
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {renderTabBar()}

      <div className="max-w-5xl mx-auto">
        {activeTab === "logo" && renderLogoTab()}
        {activeTab === "banner" && renderBannerTab()}
        {activeTab === "gallery" && renderGalleryTab()}
      </div>

      {/* Modale Logo Editor */}
      {showLogoEditor && selectedImage && (
        <LogoEditor
          image={selectedImage}
          onSave={handleLogoSave}
          onCancel={() => {
            setShowLogoEditor(false);
            setSelectedImage(null);
          }}
          loading={loading}
        />
      )}

      {/* Modale Banner Editor */}
      {showBannerEditor && selectedImage && (
        <BannerEditor
          image={selectedImage}
          onSave={handleBannerSave}
          onCancel={() => {
            setShowBannerEditor(false);
            setSelectedImage(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

export default TeamMediaManager;
