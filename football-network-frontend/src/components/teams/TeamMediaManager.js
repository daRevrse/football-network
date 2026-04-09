import React, { useState, useEffect } from "react";
import { Image, Upload, Grid, Crop } from "lucide-react";
import toast from "react-hot-toast";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "../../config/firebase";
import LogoEditor from "./LogoEditor";
import BannerEditor from "./BannerEditor";
import GalleryManager from "./GalleryManager";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TeamMediaManager = ({ team, isCapta, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("logo");
  const [loading, setLoading] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Image requise");

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage({ file, preview: ev.target.result });
      type === "logo" ? setShowLogoEditor(true) : setShowBannerEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (file, endpoint) => {
    try {
      setLoading(true);

      const fileExt = file.name ? file.name.split('.').pop() : 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      const folder = endpoint === 'logo' ? `teams/${team.id}/logos` : `teams/${team.id}/banners`;
      
      const storageRef = ref(storage, `${folder}/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Mettre à jour la table teams (Firestore)
      const updateData = endpoint === 'logo' ? { logoUrl: url } : { bannerUrl: url };
      
      try {
        const teamDocRef = doc(db, 'teams', team.id);
        await updateDoc(teamDocRef, updateData);
      } catch (dbError) {
        console.error(dbError);
        throw new Error("Erreur mise à jour équipe");
      }

      toast.success("Mise à jour réussie");
      setShowLogoEditor(false);
      setShowBannerEditor(false);
      onUpdate();
    } catch (error) {
      toast.error(error.message || "Erreur upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 px-6 flex space-x-6">
        {["logo", "banner", "gallery"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-1 border-b-2 font-medium text-sm capitalize flex items-center ${
              activeTab === tab
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "gallery" ? (
              <Grid className="w-4 h-4 mr-2" />
            ) : (
              <Image className="w-4 h-4 mr-2" />
            )}
            {tab === "banner" ? "Bannière" : tab}
          </button>
        ))}
      </div>

      <div className="p-8 min-h-[300px]">
        {activeTab === "logo" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-40 h-40 rounded-full border-4 border-gray-100 overflow-hidden shadow-sm mb-6 relative group">
              {team.logoUrl ? (
                <img
                  src={team.logoUrl.startsWith('http') ? team.logoUrl : `${API_BASE_URL.replace("/api", "")}${team.logoUrl}`}
                  className="w-full h-full object-cover"
                  alt="Logo"
                />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                  <Image className="w-12 h-12" />
                </div>
              )}
            </div>
            {isCapta && (
              <label className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium cursor-pointer hover:bg-green-700 transition shadow-sm">
                Changer le logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "logo")}
                />
              </label>
            )}
          </div>
        )}

        {activeTab === "banner" && (
          <div className="space-y-6">
            <div className="h-48 w-full bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200">
              {team.bannerUrl ? (
                <img
                  src={team.bannerUrl.startsWith('http') ? team.bannerUrl : `${API_BASE_URL.replace("/api", "")}${team.bannerUrl}`}
                  className="w-full h-full object-cover"
                  alt="Banner"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  Aucune bannière
                </div>
              )}
            </div>
            {isCapta && (
              <div className="text-center">
                <label className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium cursor-pointer hover:bg-green-700 transition shadow-sm inline-block">
                  Changer la bannière
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "banner")}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {activeTab === "gallery" && (
          <GalleryManager
            teamId={team.id}
            isCapta={isCapta}
            onUpdate={onUpdate}
          />
        )}
      </div>

      {showLogoEditor && selectedImage && (
        <LogoEditor
          image={selectedImage}
          onSave={(blob, data) => {
            // Passer directement le blob (file) à handleSave
            const file = new File([blob], 'logo.png', { type: 'image/png' });
            handleSave(file, "logo");
          }}
          onCancel={() => setShowLogoEditor(false)}
          loading={loading}
        />
      )}

      {showBannerEditor && selectedImage && (
        <BannerEditor
          image={selectedImage}
          onSave={(file) => {
            handleSave(file, "banner");
          }}
          onCancel={() => setShowBannerEditor(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default TeamMediaManager;
