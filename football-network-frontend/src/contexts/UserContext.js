import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const UserContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!user) {
      setProfilePictureUrl(null);
      setCoverPhotoUrl(null);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/profile`);

      if (response.data.profilePictureUrl) {
        const fullUrl = `${API_BASE_URL.replace("/api", "")}${
          response.data.profilePictureUrl
        }`;
        setProfilePictureUrl(fullUrl);
      }

      if (response.data.coverPhotoUrl) {
        const fullUrl = `${API_BASE_URL.replace("/api", "")}${
          response.data.coverPhotoUrl
        }`;
        setCoverPhotoUrl(fullUrl);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const refreshProfilePicture = useCallback((newUrl) => {
    setProfilePictureUrl(newUrl);
  }, []);

  const refreshCoverPhoto = useCallback((newUrl) => {
    setCoverPhotoUrl(newUrl);
  }, []);

  const value = {
    profilePictureUrl,
    coverPhotoUrl,
    loading,
    refreshProfilePicture,
    refreshCoverPhoto,
    loadProfileData,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
