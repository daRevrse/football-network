import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Users, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import io from "socket.io-client";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const MatchChat = ({ matchId, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMatchInfo();
    loadMessages();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMatchInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
      setMatchInfo(response.data);
    } catch (error) {
      console.error("Error loading match info:", error);
      toast.error("Erreur lors du chargement du match");
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    socketRef.current = io(SOCKET_URL);

    // Rejoindre la room du match
    socketRef.current.emit("join_match", matchId);

    // Écouter les nouveaux messages des autres utilisateurs
    socketRef.current.on("new_message", (message) => {
      // Ne pas ajouter le message s'il vient de nous (pour éviter les doublons)
      if (message.sender?.id !== user.id && message.sender_id !== user.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Écouter les utilisateurs en ligne
    socketRef.current.on("match_users_online", (users) => {
      setOnlineUsers(new Set(users));
    });

    // Gestion des erreurs
    socketRef.current.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Erreur de connexion au chat");
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();

    // Ajouter immédiatement le message localement (optimistic update)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      sentAt: new Date().toISOString(),
      sending: true, // Flag pour indiquer qu'il est en cours d'envoi
    };

    try {
      setSending(true);
      const messageContent = newMessage.trim();

      // Ajouter immédiatement le message localement (optimistic update)
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        sentAt: new Date().toISOString(),
        sending: true, // Flag pour indiquer qu'il est en cours d'envoi
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      // Envoyer au serveur
      const response = await axios.post(
        `${API_BASE_URL}/matches/${matchId}/messages`,
        {
          content: messageContent,
        }
      );

      // Mettre à jour le message temporaire avec l'ID réel
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? { ...msg, id: response.data.messageId, sending: false }
            : msg
        )
      );

      // Émettre le message via Socket.io pour les autres utilisateurs seulement
      socketRef.current.emit("send_message", {
        matchId,
        messageId: response.data.messageId,
        content: messageContent,
        sender: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        sentAt: tempMessage.sentAt,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");

      // Supprimer le message temporaire en cas d'erreur
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      setNewMessage(messageContent); // Remettre le texte dans l'input
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isMyMessage = (message) => {
    return message.sender?.id === user.id || message.sender_id === user.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-green-50">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Chat du match</h3>
            {matchInfo && (
              <p className="text-sm text-gray-600">
                {matchInfo.homeTeam.name} vs{" "}
                {matchInfo.awayTeam?.name || "À définir"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onlineUsers.size > 0 && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{onlineUsers.size} en ligne</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Soyez le premier à écrire !</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isMine = isMyMessage(message);
              const showAvatar =
                index === 0 || !isMyMessage(messages[index - 1]) !== isMine;

              return (
                <div
                  key={message.id || index}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex space-x-2 max-w-xs lg:max-w-md ${
                      isMine ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    {showAvatar && (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isMine
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {(message.sender?.firstName ||
                          message.first_name ||
                          "U")[0].toUpperCase()}
                      </div>
                    )}

                    <div
                      className={`${
                        !showAvatar ? (isMine ? "mr-10" : "ml-10") : ""
                      }`}
                    >
                      {showAvatar && (
                        <div
                          className={`text-xs text-gray-500 mb-1 ${
                            isMine ? "text-right" : "text-left"
                          }`}
                        >
                          {message.sender?.firstName || message.first_name}{" "}
                          {message.sender?.lastName || message.last_name}
                        </div>
                      )}

                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isMine
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        } ${message.sending ? "opacity-70" : ""}`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p
                            className={`text-xs ${
                              isMine ? "text-green-100" : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.sentAt || message.sent_at)}
                          </p>
                          {message.sending && (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            maxLength={1000}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {newMessage.length}/1000 caractères
        </p>
      </form>
    </div>
  );
};

export default MatchChat;
