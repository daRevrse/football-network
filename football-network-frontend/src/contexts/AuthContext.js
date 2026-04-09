import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { auth, db } from "../config/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase Auth User + Firestore Profile
  const [session, setSession] = useState(null); // Just the raw Firebase User object
  const [loading, setLoading] = useState(true);

  // On ne configure plus Axios ici, c'est fait dans src/services/api.js
  // Mais on peut conserver un intercepteur de réponse spécifique pour la déconnexion immédiate
  useEffect(() => {
    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          await signOut(auth);
          setUser(null);
          setSession(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // Synchronisation de l'état d'authentification avec le profil Firestore
  useEffect(() => {
    let mounted = true;

    async function fetchProfile(firebaseUser) {
      if (!firebaseUser) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Appeler le backend pour récupérer ou créer le profil (synchronisation RBAC)
        const response = await api.get('/users/profile');
        if (mounted) {
          setUser({
            ...response.data.user,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            email_verified: firebaseUser.emailVerified,
          });
        }
      } catch (err) {
        console.error("Error fetching user profile from backend:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (mounted) {
        setSession(firebaseUser);
        setLoading(true);
        fetchProfile(firebaseUser);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Connexion réussie !");
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      let message = "Erreur de connexion";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Email ou mot de passe incorrect";
      }
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const signup = useCallback(async (userData) => {
    try {
      // 1. Inscription via Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      // 2. Création immédiate du profil dans Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, {
        email: userData.email,
        first_name: userData.firstName || userData.first_name || '',
        last_name: userData.lastName || userData.last_name || '',
        user_type: userData.userType || userData.user_type || 'player',
        is_active: true,
        created_at: new Date().toISOString()
      });

      toast.success("Inscription réussie !");
      return { success: true, message: "Inscription réussie", user: firebaseUser };
    } catch (error) {
      console.error("Signup error:", error);
      let message = "Erreur d'inscription";
      if (error.code === 'auth/email-already-in-use') {
        message = "Cet email est déjà utilisé.";
      }
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const verifyEmail = useCallback(async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success("Email de vérification envoyé avec succès !");
        return { success: true, message: "Sent" };
      }
    } catch (error) {
       toast.error("Erreur à l'envoi de la vérification");
       return { success: false, error: error.message };
    }
  }, []);

  const resendVerification = verifyEmail;

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSession(null);
      toast.success("Déconnexion réussie");
    } catch (error) {
      toast.error("Erreur à la déconnexion");
    }
  }, []);

  const updateUser = useCallback(async (userData) => {
    // Optimistic update pour l'interface
    setUser((prev) => ({ ...prev, ...userData }));
    
    // Met à jour Firestore si un utilisateur est authentifié
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, userData);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      login,
      signup,
      logout,
      updateUser,
      verifyEmail,
      resendVerification,
    }),
    [
      user,
      session,
      loading,
      login,
      signup,
      logout,
      updateUser,
      verifyEmail,
      resendVerification,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
