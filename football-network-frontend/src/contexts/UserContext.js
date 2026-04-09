import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
// Removed direct Firestore imports


const UserContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserProfile must be used within UserProfileProvider");
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

    setProfilePictureUrl(user.profile_picture_id || user.photoURL || null);
    setCoverPhotoUrl(user.cover_photo_id || null);
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);


  const refreshProfilePicture = useCallback(
    (newUrl) => setProfilePictureUrl(newUrl),
    []
  );
  const refreshCoverPhoto = useCallback(
    (newUrl) => setCoverPhotoUrl(newUrl),
    []
  );

  const value = useMemo(
    () => ({
      profilePictureUrl,
      coverPhotoUrl,
      loading,
      refreshProfilePicture,
      refreshCoverPhoto,
      loadProfileData,
    }),
    [
      profilePictureUrl,
      coverPhotoUrl,
      loading,
      refreshProfilePicture,
      refreshCoverPhoto,
      loadProfileData,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
