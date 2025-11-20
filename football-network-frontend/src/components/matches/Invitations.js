import React, { useState, useEffect } from "react";
import { Inbox, Send, Check, X, RefreshCw, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import SendInvitationModal from "./SendInvitationModal"; // On garde la modale externe car complexe

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Invitations = () => {
  const [activeTab, setActiveTab] = useState("received");
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [myTeams, setMyTeams] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les équipes pour le bouton "Envoyer"
      if (myTeams.length === 0) {
        const teamsRes = await axios.get(`${API_BASE_URL}/teams/my`);
        setMyTeams(teamsRes.data.filter((t) => t.role === "captain"));
      }

      // Charger les invitations selon l'onglet
      const endpoint =
        activeTab === "received" ? "received?status=pending" : "sent";
      const res = await axios.get(
        `${API_BASE_URL}/matches/invitations/${endpoint}`
      );
      setInvitations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, response) => {
    try {
      await axios.patch(`${API_BASE_URL}/matches/invitations/${id}/respond`, {
        response,
      });
      toast.success(
        response === "accepted" ? "Invitation acceptée" : "Invitation refusée"
      );
      loadData();
    } catch (e) {
      toast.error("Erreur action");
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Centre des Défis</h1>
        {myTeams.length > 0 && (
          <button
            onClick={() => setShowSendModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 transition text-sm"
          >
            + Lancer un défi
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("received")}
            className={`flex-1 py-4 text-sm font-bold text-center transition ${
              activeTab === "received"
                ? "text-green-600 bg-green-50 border-b-2 border-green-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Inbox className="w-4 h-4 inline mr-2" /> Reçues
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-4 text-sm font-bold text-center transition ${
              activeTab === "sent"
                ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" /> Envoyées
          </button>
        </div>

        {/* List */}
        <div className="p-6 min-h-[300px]">
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Aucune invitation {activeTab === "received" ? "reçue" : "envoyée"}
              .
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition"
                >
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-bold text-gray-900">
                        {activeTab === "received"
                          ? inv.senderTeam?.name
                          : inv.receiverTeam?.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        • {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Propose un match le{" "}
                      <strong>
                        {new Date(inv.proposedDate).toLocaleDateString()}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === "received" ? (
                      <>
                        <button
                          onClick={() => handleRespond(inv.id, "declined")}
                          className="px-3 py-2 bg-white border border-gray-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => handleRespond(inv.id, "accepted")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-sm"
                        >
                          Accepter
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          inv.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : inv.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSendModal && (
        <SendInvitationModal
          teams={myTeams}
          onClose={() => setShowSendModal(false)}
          onSend={loadData}
        />
      )}
    </div>
  );
};

export default Invitations;
