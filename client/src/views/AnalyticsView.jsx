import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Leaf, 
  Droplet, 
  Users, 
  HeartHandshake, 
  Building, 
  Package, 
  Clock,
  PieChart as PieIcon,
  MapPin,
  RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Aggregating live food rescue impact metrics...</p>
      </div>
    );
  }

  const { summary, charts } = data;

  // Chart 1: Food Categories (Doughnut)
  const categoryChartData = {
    labels: charts.categoryStats.map((c) => c.category),
    datasets: [
      {
        data: charts.categoryStats.map((c) => c.total_quantity),
        backgroundColor: [
          '#10b981', // emerald
          '#f59e0b', // amber
          '#06b6d4', // cyan
          '#8b5cf6', // purple
          '#ec4899', // pink
          '#3b82f6'  // blue
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Chart 2: Monthly Rescued (Bar)
  const monthlyChartData = {
    labels: charts.monthlyStats.length > 0 ? charts.monthlyStats.map((m) => m.month) : ['Current Month'],
    datasets: [
      {
        label: 'Food Rescued (kg)',
        data: charts.monthlyStats.length > 0 ? charts.monthlyStats.map((m) => m.total_kg) : [summary.totalKgRescued],
        backgroundColor: '#059669',
        borderRadius: 8
      }
    ]
  };

  // Chart 3: Location Distribution (Horizontal Bar)
  const locationChartData = {
    labels: charts.locationStats.map((l) => l.location_zone),
    datasets: [
      {
        label: 'Rescued Volume (kg)',
        data: charts.locationStats.map((l) => l.total_kg),
        backgroundColor: '#0d9488',
        borderRadius: 6
      }
    ]
  };

  // Chart 4: Dietary Type Breakdown
  const dietaryChartData = {
    labels: charts.foodTypeStats.map((t) => (t.food_type === 'veg' ? '🌿 Pure Veg' : '🍗 Non-Veg')),
    datasets: [
      {
        data: charts.foodTypeStats.map((t) => t.total_kg),
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Empirical Environmental & Social Impact
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Food Waste Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time data aggregated directly from active database records and verified rescue operations.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.totalKgRescued} <span className="text-sm font-semibold text-emerald-600">kg</span>
            </span>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Food Rescued</p>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block">
            ~{summary.totalPacketsDistributed} meal portions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.totalBeneficiariesReached}
            </span>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Beneficiaries Fed</p>
          </div>
          <span className="text-[11px] text-teal-700 font-medium block">
            Across {summary.registeredNgos} partner shelters
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.successfulDonations}
            </span>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Successful Rescues</p>
          </div>
          <span className="text-[11px] text-amber-700 font-medium block">
            {summary.pendingRequests} pending verification
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.co2SavedKg} <span className="text-sm font-semibold text-sky-600">kg</span>
            </span>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">CO₂ Averted from Landfills</p>
          </div>
          <span className="text-[11px] text-sky-700 font-medium block">
            {summary.waterSavedLiters.toLocaleString()} L water preserved
          </span>
        </div>
      </div>

      {/* Environmental Footprint Callout */}
      <div className="bg-linear-to-r from-emerald-900 to-teal-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            Eco-Sustainability Impact
          </span>
          <h3 className="text-xl sm:text-2xl font-black">
            Preventing Methane & Preserving Precious Natural Resources
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every kilogram of food rescued eliminates approx. <strong>2.5 kg of greenhouse emissions (CO₂e)</strong> and safeguards over <strong>1,000 liters of agricultural freshwater</strong> from waste streams.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <span className="text-3xl font-black text-emerald-400">{summary.co2SavedKg} kg</span>
            <span className="text-xs text-slate-300 block mt-1">CO₂ Prevented</span>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="text-center">
            <span className="text-3xl font-black text-teal-300">{(summary.waterSavedLiters / 1000).toFixed(1)}k L</span>
            <span className="text-xs text-slate-300 block mt-1">Water Preserved</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Food Categories Doughnut */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Food Categories Rescued
            </h3>
            <span className="text-xs text-slate-400">By Weight (kg)</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Chart 2: Monthly Rescued (Bar) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Rescue Trajectory (Monthly kg)
            </h3>
            <span className="text-xs text-slate-400">Total Volume</span>
          </div>
          <div className="h-64">
            <Bar
              data={monthlyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                  x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

        {/* Chart 3: Location Zone Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              Location-Wise Food Rescue Stats
            </h3>
            <span className="text-xs text-slate-400">Regional Clusters</span>
          </div>
          <div className="h-64">
            <Bar
              data={locationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                  y: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

        {/* Chart 4: Dietary Preference Breakdown (Veg vs Non-Veg) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              Dietary Composition (Veg vs Non-Veg)
            </h3>
            <span className="text-xs text-slate-400">Distribution %</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={dietaryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

