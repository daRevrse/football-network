// football-network-frontend/src/hooks/useNotifications.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import io from "socket.io-client";
import toast from "react-hot-toast";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const useNotifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connecter au socket
  const connect = useCallback(() => {
    if (!user || !token) return;

    if (socketRef.current?.connected) return;

    console.log("🔌 Connecting to notification socket...");

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });

    const socket = socketRef.current;

    // Authentification automatique
    socket.on("connect", () => {
      console.log("✅ Socket connected, authenticating...");
      setIsConnected(true);
      socket.emit("authenticate", token);
    });

    // Confirmation d'authentification
    socket.on("authenticated", (data) => {
      console.log("✅ Socket authenticated for user:", data.userId);
      // Rejoindre les rooms pertinentes si nécessaire
    });

    // Erreur d'authentification
    socket.on("auth_error", (error) => {
      console.error("❌ Socket authentication error:", error);
      toast.error("Erreur de connexion aux notifications");
      setIsConnected(false);
    });

    // Réception des notifications
    socket.on("notification", (notification) => {
      console.log("📨 New notification received:", notification);

      // Ajouter aux notifications
      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Garder les 50 dernières
      setUnreadCount((prev) => prev + 1);

      // Afficher un toast
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            onClick={() => {
              handleNotificationClick(notification);
              toast.dismiss(t.id);
            }}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                ✕
              </button>
            </div>
          </div>
        ),
        {
          duration: 5000,
          position: "top-right",
        }
      );

      // Son de notification (optionnel)
      playNotificationSound(notification.type);
    });

    // Mise à jour des invitations
    socket.on("invitations_updated", () => {
      console.log("🔄 Invitations updated, triggering refresh");
      // Déclencher un event personnalisé pour que les composants se rafraîchissent
      window.dispatchEvent(new CustomEvent("invitations_updated"));
    });

    // Gestion des déconnexions
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);

      // Tentative de reconnexion automatique
      if (reason === "io server disconnect") {
        // Reconnexion manuelle nécessaire
        scheduleReconnect();
      }
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setIsConnected(false);
      scheduleReconnect();
    });

    // Ping périodique pour maintenir la connexion
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping");
      }
    }, 30000);

    socket.on("pong", () => {
      // Connection is alive
    });

    // Cleanup function pour l'interval
    socket.cleanup = () => {
      clearInterval(pingInterval);
    };
  }, [user, token]);

  // Programmer une reconnexion
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("🔄 Attempting to reconnect socket...");
      connect();
    }, 5000);
  }, [connect]);

  // Déconnecter le socket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.cleanup?.();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    console.log("📱 Notification clicked:", notification);

    // Marquer comme lue
    markAsRead(notification.id);

    // Navigation basée sur le type
    switch (notification.type) {
      case "player_invitation":
        window.location.href = "/player-invitations";
        break;
      case "match_invitation":
        window.location.href = "/invitations";
        break;
      case "team_join":
        window.location.href = `/teams/${notification.data.teamId}`;
        break;
      default:
        // Notification générale, pas d'action spécifique
        break;
    }
  };

  // Marquer une notification comme lue
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Envoyer au serveur
    if (socketRef.current?.connected) {
      socketRef.current.emit("mark_notification_read", notificationId);
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);

    // Envoyer au serveur
    if (socketRef.current?.connected) {
      unreadIds.forEach((id) => {
        socketRef.current.emit("mark_notification_read", id);
      });
    }
  }, [notifications]);

  // Effets
  useEffect(() => {
    if (user && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, token, connect, disconnect]);

  // Nettoyage au unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    connect,
    disconnect,
  };
};

// Fonctions utilitaires
const getNotificationIcon = (type) => {
  switch (type) {
    case "player_invitation":
      return <span className="text-purple-500">👥</span>;
    case "player_invitation_response":
      return <span className="text-green-500">✅</span>;
    case "match_invitation":
      return <span className="text-blue-500">⚽</span>;
    case "match_invitation_response":
      return <span className="text-yellow-500">🏆</span>;
    case "team_join":
      return <span className="text-green-500">🎉</span>;
    case "team_leave":
      return <span className="text-red-500">👋</span>;
    default:
      return <span className="text-gray-500">🔔</span>;
  }
};

const playNotificationSound = (type) => {
  // Son de notification simple (optionnel)
  try {
    const audio = new Audio("/sounds/notification.mp3"); // Ajouter ce fichier dans public/sounds/
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignorer les erreurs de lecture audio (autoplay policy)
    });
  } catch (error) {
    // Ignorer les erreurs
  }
};
