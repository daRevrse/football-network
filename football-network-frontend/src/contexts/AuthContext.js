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

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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
          // On évite window.location.reload() pour ne pas perdre l'état,
          // le routeur redirigera vers /login grâce à ProtectedRoute
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
      const message = error.response?.data?.error || "Erreur de connexion";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const signup = useCallback(async (userData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        userData
      );
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setUser(user);
      toast.success("Inscription réussie !");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Erreur d'inscription";
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Déconnexion réussie");
    // Optionnel : rediriger explicitement si besoin
    window.location.href = "/login";
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  // CRITIQUE : useMemo empêche la boucle de rendu infinie
  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      updateUser,
    }),
    [user, loading, login, signup, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
