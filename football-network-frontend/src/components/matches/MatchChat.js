import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Users, X, Loader2, Smile } from "lucide-react";
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
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    loadMessages();
    setupSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/matches/${matchId}/messages`
      );
      setMessages(response.data || []);
    } catch (error) {
      console.error("Chat load error", error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    socketRef.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
    });
    socketRef.current.emit("join_match", matchId);

    socketRef.current.on("new_message", (message) => {
      setMessages((prev) => {
        // Eviter doublons si on reçoit notre propre message via socket
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socketRef.current.on("match_users_online", (users) =>
      setOnlineUsers(new Set(users))
    );
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = Date.now();
    const messageContent = newMessage.trim();

    // Optimistic UI
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      sender: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      createdAt: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/matches/${matchId}/messages`,
        { content: messageContent }
      );

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...response.data, sending: false } : msg
        )
      );

      // Emit socket
      socketRef.current.emit("send_message", { ...response.data, matchId });
    } catch (error) {
      toast.error("Echec envoi message");
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageContent);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              Discussion de Match
            </h3>
            <div className="flex items-center text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              {onlineUsers.size} en ligne
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={chatContainerRef}
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-sm">Début de la conversation.</p>
            <p className="text-xs">Soyez fair-play ! ⚽</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?.id === user.id;
            const isConsecutive =
              idx > 0 && messages[idx - 1].sender?.id === msg.sender?.id;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"} ${
                  isConsecutive ? "mt-1" : "mt-4"
                }`}
              >
                {!isMe && !isConsecutive && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-2 flex-shrink-0">
                    {msg.sender?.firstName?.[0]}
                  </div>
                )}
                {!isMe && isConsecutive && <div className="w-8 mr-2" />}

                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? "bg-green-600 text-white rounded-tr-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                  }`}
                >
                  {!isMe && !isConsecutive && (
                    <p className="text-[10px] font-bold opacity-70 mb-1">
                      {msg.sender?.firstName}
                    </p>
                  )}
                  <p>{msg.content}</p>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isMe ? "text-green-100" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt || msg.sentAt).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                    {msg.sending && (
                      <span className="ml-1 opacity-70">...</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm max-h-24 resize-none py-2"
              placeholder="Écrivez un message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:transform-none transform hover:scale-105 transition-all shadow-md"
          >
            <Send className="w-5 h-5 pl-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MatchChat;
