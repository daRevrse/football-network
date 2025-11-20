import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  RefreshCw,
  UserX,
  User,
  Check,
  X,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TeamInvitations = ({ teamId, teamName }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");

  useEffect(() => {
    if (teamId) loadInvitations();
  }, [teamId, filterStatus]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/teams/${teamId}/invitations?status=${filterStatus}&limit=50`
      );
      setInvitations(response.data);
    } catch (error) {
      toast.error("Erreur chargement invitations");
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/teams/${teamId}/invitations/${invitationId}`
      );
      toast.success("Invitation annulée");
      loadInvitations();
    } catch (error) {
      toast.error("Erreur annulation");
    }
  };

  const filterTabs = [
    { id: "pending", label: "En attente", icon: Clock },
    { id: "accepted", label: "Acceptées", icon: CheckCircle },
    { id: "declined", label: "Refusées", icon: XCircle },
    { id: "all", label: "Toutes", icon: MessageCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 px-6 flex space-x-6 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                filterStatus === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
            </button>
          ))}
          <button
            onClick={loadInvitations}
            className="ml-auto text-gray-400 hover:text-green-600 py-4"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* List */}
        <div className="p-6">
          {invitations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <UserX className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Aucune invitation {filterStatus !== "all" && filterStatus}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                      {inv.player.firstName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {inv.player.firstName} {inv.player.lastName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {inv.player.email} •{" "}
                        {new Date(inv.sentAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        inv.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : inv.status === "declined"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {inv.status}
                    </span>

                    {inv.status === "pending" && (
                      <button
                        onClick={() => cancelInvitation(inv.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamInvitations;
