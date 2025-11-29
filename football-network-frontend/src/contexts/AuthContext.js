import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configuration Axios stable
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/verify`);
          setUser(response.data.user);
        } catch (error) {
          console.error("Auth verify failed", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setUser(user);
      toast.success("Connexion réussie !");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erreur de connexion";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // MODIFIÉ : Signup ne connecte plus automatiquement, mais renvoie un succès pour afficher le message "Vérifiez vos emails"
  const signup = useCallback(async (userData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/signup`, // Attention: vérifiez si votre route est /signup ou /register dans le backend
        userData
      );
      // On ne set PAS le token ici car l'email doit être vérifié d'abord
      toast.success("Inscription réussie ! Vérifiez vos emails.");
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.error || "Erreur d'inscription";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // NOUVEAU : Fonction de vérification d'email
  const verifyEmail = useCallback(async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify-email`, {
        params: { token },
      });
      toast.success("Email vérifié avec succès !");
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.error || "Lien invalide ou expiré";
      return { success: false, error: message };
    }
  }, []);

  // NOUVEAU : Fonction de renvoi d'email
  const resendVerification = useCallback(async (email) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email });
      toast.success("Email de vérification renvoyé !");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Erreur lors de l'envoi";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Déconnexion réussie");
    // window.location.href = "/login"; // Utiliser navigate dans le composant est préférable, mais ceci fonctionne
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      updateUser,
      verifyEmail, // Exporté
      resendVerification, // Exporté
    }),
    [
      user,
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
