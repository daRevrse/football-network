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
import { DollarSign, TrendingUp, Users, Clock } from "lucide-react";

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

  const chartData = [
    { name: "S1", revenus: stats?.totalRevenue * 0.2 || 0 },
    { name: "S2", revenus: stats?.totalRevenue * 0.3 || 0 },
    { name: "S3", revenus: stats?.totalRevenue * 0.1 || 0 },
    { name: "S4", revenus: stats?.totalRevenue * 0.4 || 0 },
  ];

  if (loading)
    return (
      <div className="p-8 text-center">Chargement des statistiques...</div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analyses</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Chiffre d'affaires</p>
          {/* Utilisation camelCase */}
          <h3 className="text-3xl font-bold text-gray-900">
            {stats?.totalRevenue?.toFixed(2) || 0}€
          </h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Réservations confirmées</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {stats?.confirmedBookings || 0}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Sur {stats?.totalBookings} demandes
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Durée Moyenne</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {Math.round(stats?.avgDuration || 0)} min
          </h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
        <h3 className="font-bold text-gray-900 mb-6">
          Aperçu des revenus (Simulation)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar
              dataKey="revenus"
              fill="#4F46E5"
              radius={[4, 4, 0, 0]}
              name="Revenus (€)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VenueStats;
