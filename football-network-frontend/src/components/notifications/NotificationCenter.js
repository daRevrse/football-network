// football-network-frontend/src/components/notifications/NotificationCenter.js
import React, { useState } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Users,
  UserPlus,
  MessageSquare,
  Calendar,
  Trophy,
  Clock,
  Trash2,
} from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";

const NotificationCenter = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } =
    useNotifications();
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'invitations'

  const getNotificationIcon = (type) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case "player_invitation":
        return <UserPlus className={`${iconClass} text-purple-500`} />;
      case "player_invitation_response":
        return <Check className={`${iconClass} text-green-500`} />;
      case "match_invitation":
        return <Calendar className={`${iconClass} text-blue-500`} />;
      case "match_invitation_response":
        return <Trophy className={`${iconClass} text-yellow-500`} />;
      case "team_join":
        return <Users className={`${iconClass} text-green-500`} />;
      case "team_leave":
        return <Users className={`${iconClass} text-red-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigation basée sur le type
    switch (notification.type) {
      case "player_invitation":
        window.location.href = "/player-invitations";
        break;
      case "match_invitation":
        window.location.href = "/invitations";
        break;
      case "team_join":
      case "team_leave":
        if (notification.data?.teamId) {
          window.location.href = `/teams/${notification.data.teamId}`;
        }
        break;
      default:
        break;
    }

    onClose();
  };

  const filteredNotifications = notifications.filter((notification) => {
    switch (filter) {
      case "unread":
        return !notification.read;
      case "invitations":
        return ["player_invitation", "match_invitation"].includes(
          notification.type
        );
      default:
        return true;
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-gray-700" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h2>
                  <div className="flex items-center space-x-2 text-sm">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-gray-600">
                      {isConnected ? "Connecté" : "Déconnecté"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Tout lu"}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Tout marquer lu</span>
                </button>
              )}
            </div>

            {/* Filtres */}
            <div className="mt-4">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: "all", label: "Tout" },
                  { id: "unread", label: "Non lues" },
                  { id: "invitations", label: "Invitations" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      filter === tab.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Bell className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Aucune notification</p>
                <p className="text-sm">
                  {filter === "unread"
                    ? "Toutes les notifications sont lues"
                    : filter === "invitations"
                    ? "Aucune invitation en attente"
                    : "Vous êtes à jour !"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                      !notification.read
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    {/* Badge non lu */}
                    {!notification.read && (
                      <div className="absolute top-4 right-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              {notification.message}
                            </p>

                            {/* Données additionnelles selon le type */}
                            {notification.data?.responseMessage && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs italic">
                                "{notification.data.responseMessage}"
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 ml-4">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{getTimeAgo(notification.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Tags selon le type */}
                        <div className="mt-2 flex items-center space-x-2">
                          {notification.type === "player_invitation" && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                              Invitation équipe
                            </span>
                          )}
                          {notification.type === "match_invitation" && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                              Invitation match
                            </span>
                          )}
                          {notification.type.includes("_response") && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              Réponse
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <div className="text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Voir l'historique complet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
