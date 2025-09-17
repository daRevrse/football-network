import React, { useState, useEffect } from "react";
import { Send, Inbox, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import InvitationTabs from "./InvitationTabs";
import ReceivedInvitations from "./ReceivedInvitations";
import SentInvitations from "./SentInvitations";
import SendInvitationModal from "./SendInvitationModal";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Invitations = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("received");
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [myTeams, setMyTeams] = useState([]);

  // Statistiques pour les badges
  const [stats, setStats] = useState({
    pendingReceived: 0,
    pendingSent: 0,
    totalReceived: 0,
    totalSent: 0,
  });

  useEffect(() => {
    loadInvitations();
    loadMyTeams();
  }, []);

  useEffect(() => {
    updateStats();
  }, [receivedInvitations, sentInvitations]);

  const loadMyTeams = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teams/my`);
      // Filtrer seulement les équipes où l'utilisateur est capitaine
      const captainTeams = response.data.filter(
        (team) => team.role === "captain"
      );
      setMyTeams(captainTeams);
    } catch (error) {
      console.error("Error loading teams:", error);
    }
  };

  const loadInvitations = async () => {
    try {
      setLoading(true);

      const [receivedResponse, sentResponse] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/matches/invitations/received?status=pending`
        ),
        axios.get(`${API_BASE_URL}/matches/invitations/sent`),
      ]);

      setReceivedInvitations(receivedResponse.data);
      setSentInvitations(sentResponse.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des invitations");
      console.error("Load invitations error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const pendingReceived = receivedInvitations.filter(
      (inv) => inv.status === "pending"
    ).length;
    const pendingSent = sentInvitations.filter(
      (inv) => inv.status === "pending"
    ).length;

    setStats({
      pendingReceived,
      pendingSent,
      totalReceived: receivedInvitations.length,
      totalSent: sentInvitations.length,
    });
  };

  const handleRespondToInvitation = async (
    invitationId,
    response,
    responseMessage
  ) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/matches/invitations/${invitationId}/respond`,
        {
          response,
          responseMessage,
        }
      );

      toast.success(
        `Invitation ${response === "accepted" ? "acceptée" : "refusée"} !`
      );
      await loadInvitations(); // Recharger les invitations
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de la réponse");
      console.error("Respond invitation error:", error);
    }
  };

  const handleSendInvitation = async (invitationData) => {
    try {
      await axios.post(`${API_BASE_URL}/matches/invitations`, invitationData);
      toast.success("Invitation envoyée avec succès !");
      setShowSendModal(false);
      await loadInvitations(); // Recharger les invitations
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de l'envoi");
      throw error; // Re-throw pour que le modal puisse gérer l'erreur
    }
  };

  const tabs = [
    {
      id: "received",
      label: "Reçues",
      icon: Inbox,
      count: stats.pendingReceived,
      color: "blue",
    },
    {
      id: "sent",
      label: "Envoyées",
      icon: Send,
      count: stats.pendingSent,
      color: "green",
    },
  ];

  if (
    loading &&
    receivedInvitations.length === 0 &&
    sentInvitations.length === 0
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invitations de Match
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos invitations et organisez vos matchs
          </p>
        </div>

        {myTeams.length > 0 && (
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Envoyer une invitation
          </button>
        )}
      </div>

      {/* Message si pas d'équipe capitaine */}
      {myTeams.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Aucune équipe de capitaine
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Vous devez être capitaine d'une équipe pour envoyer des
                invitations de match.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Inbox className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.pendingReceived}
              </div>
              <div className="text-blue-700 text-sm">En attente (reçues)</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Send className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">
                {stats.pendingSent}
              </div>
              <div className="text-green-700 text-sm">
                En attente (envoyées)
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {
                  sentInvitations.filter((inv) => inv.status === "accepted")
                    .length
                }
              </div>
              <div className="text-purple-700 text-sm">Acceptées</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-900">
                {
                  sentInvitations.filter((inv) => inv.status === "declined")
                    .length
                }
              </div>
              <div className="text-red-700 text-sm">Refusées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <InvitationTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Contenu des onglets */}
      <div className="mt-6">
        {activeTab === "received" && (
          <ReceivedInvitations
            invitations={receivedInvitations}
            onRespond={handleRespondToInvitation}
            loading={loading}
          />
        )}

        {activeTab === "sent" && (
          <SentInvitations invitations={sentInvitations} loading={loading} />
        )}
      </div>

      {/* Modal d'envoi d'invitation */}
      {showSendModal && (
        <SendInvitationModal
          teams={myTeams}
          onClose={() => setShowSendModal(false)}
          onSend={handleSendInvitation}
        />
      )}
    </div>
  );
};

export default Invitations;
