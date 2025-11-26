import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VenueStats = () => {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/venue-owner/stats?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(res.data.stats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Données factices pour le graphique si pas de données historiques backend
  const chartData = [
    { name: "Sem 1", revenus: 400, bookings: 4 },
    { name: "Sem 2", revenus: 300, bookings: 3 },
    { name: "Sem 3", revenus: 600, bookings: 6 },
    { name: "Sem 4", revenus: 800, bookings: 8 },
  ];

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Analyses & Performances
        </h1>
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                period === p
                  ? "bg-green-100 text-green-700"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {p === "week" ? "Semaine" : p === "month" ? "Mois" : "Année"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-green-600 text-sm font-bold flex items-center">
              +12% <TrendingUp className="w-3 h-3 ml-1" />
            </span>
          </div>
          <p className="text-gray-500 text-sm">Chiffre d'affaires</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {stats?.total_revenue || 0}€
          </h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Taux d'occupation</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {stats?.total_bookings > 0
              ? Math.round(
                  (stats.confirmed_bookings / stats.total_bookings) * 100
                )
              : 0}
            %
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.confirmed_bookings} confirmés sur {stats?.total_bookings}{" "}
            demandes
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Durée Moyenne</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {Math.round(stats?.avg_duration || 0)} min
          </h3>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-96">
        <h3 className="font-bold text-gray-900 mb-6">Évolution des revenus</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Legend />
            <Bar
              dataKey="revenus"
              fill="#4F46E5"
              radius={[4, 4, 0, 0]}
              name="Revenus (€)"
            />
            <Bar
              dataKey="bookings"
              fill="#E5E7EB"
              radius={[4, 4, 0, 0]}
              name="Réservations"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VenueStats;
