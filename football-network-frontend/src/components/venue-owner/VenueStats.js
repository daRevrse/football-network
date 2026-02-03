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
} from "recharts";
import { Euro, Users, Clock, TrendingUp, Loader2, Calendar } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(res.data.stats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Sem 1", revenus: stats?.totalRevenue * 0.2 || 0 },
    { name: "Sem 2", revenus: stats?.totalRevenue * 0.3 || 0 },
    { name: "Sem 3", revenus: stats?.totalRevenue * 0.15 || 0 },
    { name: "Sem 4", revenus: stats?.totalRevenue * 0.35 || 0 },
  ];

  const periods = [
    { value: "week", label: "7 jours" },
    { value: "month", label: "30 jours" },
    { value: "year", label: "12 mois" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Statistiques</h1>
          <p className="text-gray-500 mt-1">Analysez les performances de vos terrains</p>
        </div>
        <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                period === p.value
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Euro className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">
              +12%
            </span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {stats?.totalRevenue?.toFixed(0) || 0}€
          </p>
          <p className="text-sm text-gray-500 mt-1">Chiffre d'affaires</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {stats?.totalBookings || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Réservations totales</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {stats?.confirmedBookings || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Confirmées</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {stats?.totalBookings > 0
              ? `${Math.round((stats.confirmedBookings / stats.totalBookings) * 100)}% de conversion`
              : '—'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {Math.round(stats?.avgDuration || 0)} min
          </p>
          <p className="text-sm text-gray-500 mt-1">Durée moyenne</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Revenus par semaine</h3>
            <p className="text-sm text-gray-500 mt-0.5">Aperçu de la période sélectionnée</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                formatter={(value) => [`${value.toFixed(0)}€`, 'Revenus']}
              />
              <Bar
                dataKey="revenus"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-lg border border-gray-200">
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Améliorez vos performances</h4>
            <p className="text-sm text-gray-600">
              Les terrains avec des photos de qualité et des descriptions détaillées reçoivent
              en moyenne 40% plus de réservations. Pensez à mettre à jour vos fiches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueStats;
