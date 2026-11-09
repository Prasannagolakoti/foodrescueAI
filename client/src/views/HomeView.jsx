import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Leaf, 
  Clock, 
  Search,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import FoodCard from '../components/FoodCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function HomeView({ setCurrentView, onViewDetails, onRequestFood, onOpenMap, onDeleteFood }) {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [donationsRes, analyticsRes] = await Promise.all([
        api.getDonations({ status: 'Available' }),
        api.getAnalytics()
      ]);
      setDonations(donationsRes.slice(0, 6)); // Top 6 active listings
      setAnalytics(analyticsRes.summary);
    } catch (err) {
      console.error('Home load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentView('available-food');
  };

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 shadow-2xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI-Driven Food Rescue & Zero Waste Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Rescue Surplus Food. <br />
            <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Feed Hungry Souls in Minutes.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Bridging banquet halls, restaurants, hostels, and supermarkets with local orphanages, shelters, and NGOs through <strong>real-time AI Smart Matching</strong> and strict food safety verification.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentView('available-food')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition transform hover:-translate-y-0.5"
            >
              Explore Available Food
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentView('donate')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs flex items-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              Donate Surplus Food
            </button>

            <button
              onClick={() => setCurrentView('smart-matching')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-linear-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-400/30 flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              AI Smart Matching Matrix
            </button>
          </div>

          {/* Search Bar Bar Inside Hero */}
          <div className="pt-6 max-w-xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-white/95 rounded-2xl p-1.5 shadow-xl text-slate-800">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search food by name (e.g. Biryani, Bread, Rice, Curry)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-hidden text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shrink-0"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="border-t border-emerald-800/60 bg-emerald-950/60 backdrop-blur-md px-6 py-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {analytics?.totalKgRescued ?? 0} <span className="text-sm font-semibold text-emerald-400">kg</span>
              </span>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1 font-medium">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                Food Waste Prevented
              </p>
            </div>

            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {analytics?.totalBeneficiariesReached ?? 0}
              </span>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                Beneficiaries Fed
              </p>
            </div>

            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {analytics?.registeredNgos ?? 0}
              </span>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1 font-medium">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                Registered Recipients & NGOs
              </p>
            </div>

            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {analytics?.co2SavedKg ?? 0} <span className="text-sm font-semibold text-emerald-400">kg</span>
              </span>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                CO₂ Emissions Averted
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgent Availability Alert Banner (Shown dynamically when real urgent food is nearing deadline) */}
      {(() => {
        const urgentItem = donations.find((d) => {
          const diff = (new Date(d.safe_deadline).getTime() - Date.now()) / (1000 * 3600);
          return diff > 0 && diff <= 4;
        });
        if (!urgentItem) return null;
        const diffHrs = Math.max(0, Math.round(((new Date(urgentItem.safe_deadline).getTime() - Date.now()) / 3600000) * 10) / 10);
        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Urgent Food Surplus Available for Dispatch</h4>
                  <p className="text-xs text-amber-800">
                    {urgentItem.food_name} (~{urgentItem.packets_count || Math.round(urgentItem.quantity * 2.5)} portions) in {urgentItem.pickup_address.split(',')[0]} (Safe for ~{diffHrs} hours).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('smart-matching')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shrink-0"
              >
                Trigger AI Match
              </button>
            </div>
          </section>
        );
      })()}

      {/* Featured Available Food Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Real-Time Listings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Fresh Surplus Food Available Now
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hygienically verified, safe-deadline monitored, ready for verified shelter pickups.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('available-food')}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 self-start sm:self-auto transition"
          >
            View All {donations.length > 0 ? `(${donations.length} Active)` : ''}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">No active surplus donations right now</h4>
            <p className="text-xs text-slate-400 mt-1">Check back shortly or post a surplus donation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <FoodCard
                key={donation.id}
                donation={donation}
                onViewDetails={onViewDetails}
                onRequestFood={onRequestFood}
                onOpenMap={onOpenMap}
                onDeleteFood={onDeleteFood}
                userRole={user?.role}
              />
            ))}
          </div>
        )}
      </section>

      {/* How It Works - 4 Steps */}
      <section className="bg-emerald-50/60 border-y border-emerald-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Smart Rescue Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How AI Accelerates Food Redistribution
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Eliminating phone tag and food spoilage with automated matching and verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-3xl font-black text-emerald-200 block mb-2">01</span>
              <h3 className="text-base font-bold text-slate-900 mb-1">Donor Adds Surplus</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Banquet halls, caterers, or hostels upload excess food details, quantity, and prep timestamp in 60 seconds.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-3xl font-black text-emerald-200 block mb-2">02</span>
              <h3 className="text-base font-bold text-slate-900 mb-1">AI Safety Verification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Algorithms check thermal thresholds, storage conditions, and calculate safe consumption deadlines automatically.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-3xl font-black text-emerald-200 block mb-2">03</span>
              <h3 className="text-base font-bold text-slate-900 mb-1">Intelligent Proximity Match</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Matching matrix prioritizes nearby orphanages and shelters matching beneficiary capacity and vehicle transit time.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-3xl font-black text-emerald-200 block mb-2">04</span>
              <h3 className="text-base font-bold text-slate-900 mb-1">Swift Pickup & Smiles</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Volunteers collect food in insulated boxes; status transitions from Ready to Completed with reviews and impact points!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Smart Matching Banner CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-r from-teal-900 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-4 max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
              Flagship Capability
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
              AI Smart Matching Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Our intelligent engine scores distance (Haversine formula), quantity volume, time urgency, and storage requirements to pair surplus meals with the most suitable shelter.
            </p>
            <div className="flex items-center gap-4 text-xs text-teal-200 pt-1">
              <span>✓ Distance scoring</span>
              <span>✓ Capacity alignment</span>
              <span>✓ Expiry urgency</span>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => setCurrentView('smart-matching')}
              className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-white text-slate-900 hover:bg-teal-50 shadow-lg transition transform hover:scale-105"
            >
              Launch Matching Matrix
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

