import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Star, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Eye, 
  PackageCheck,
  Building,
  Filter,
  LogIn,
  AlertCircle,
  Trash2,
  Route as RouteIcon
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DonationHistoryView({ onOpenRateModal, onViewDetails, onOpenMap, onDeleteFood, setCurrentView }) {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const isDonor = userRole === 'donor';
  const isRecipient = userRole === 'recipient' || userRole === 'receiver';
  const isAdmin = userRole === 'admin';

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isDonor ? 'donations' : 'requests');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [activeTab, user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (activeTab === 'donations') {
        // Fetch donations posted by this donor (or all if admin)
        const params = isDonor ? { donor_id: user.id } : {};
        const data = await api.getDonations(params);
        setHistoryItems(Array.isArray(data) ? data : []);
      } else {
        // Fetch requests (role-filtered by server based on user session)
        const data = await api.getRequests();
        setHistoryItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <History className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Donation & Rescue History</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Please sign in to view your previous food donations, fulfilled rescue operations, and recipient ratings.
        </p>
        <button
          onClick={() => setCurrentView && setCurrentView('auth')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Sign In to View History
        </button>
      </div>
    );
  }

  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      !search.trim() ||
      (item.food_name && item.food_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.donor_name && item.donor_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.receiver_name && item.receiver_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.organization_name && item.organization_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4" />
            Verified Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Donation & Rescue History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isDonor
              ? 'View all surplus food donations you have submitted and their fulfillment records.'
              : isRecipient
              ? 'View all surplus food donations you have requested and received.'
              : 'Complete platform historical archive of donations and requests.'}
          </p>
        </div>

        {/* Tab Switcher for Donor or Admin */}
        {(isDonor || isAdmin) && (
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('donations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'donations'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isDonor ? 'My Food Donations' : 'All Donations'}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'requests'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isDonor ? 'Fulfillments & Requests' : 'All Requests'}
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search records by food or partner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed Only</option>
            <option value="Available">Available Only</option>
            <option value="Accepted">Accepted Only</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Expired">Expired</option>
          </select>

          <span className="text-xs text-slate-500 font-medium">
            <strong>{filteredItems.length}</strong> record{filteredItems.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No history records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'donations'
              ? 'No food donations match your current filters. Donations you publish will be recorded here.'
              : 'No completed requests recorded yet. When food requests are made and completed, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={`${activeTab}-${item.id}`}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100">
                    #{item.id}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.food_name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Recorded on {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : item.status === 'Expired'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : item.status === 'Available'
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Data Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block font-medium">Quantity / Servings</span>
                  <strong className="text-sm text-slate-900 font-bold">
                    {item.quantity || item.requested_quantity} {item.quantity_unit || 'kg'}
                  </strong>
                  <span className="text-[11px] text-emerald-600 block">
                    ~{item.packets_count || item.beneficiaries_count || Math.round((item.quantity || 10) * 2.5)} meals
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Counterparty</span>
                  <strong className="text-sm text-slate-900 font-bold truncate block">
                    {activeTab === 'donations'
                      ? (item.donor_org || item.donor_name || 'My Donation')
                      : (item.organization_name || item.receiver_name || item.donor_name || 'Partner')}
                  </strong>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {activeTab === 'donations' ? item.donor_name : (item.receiver_name || item.donor_name)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Pickup Spot</span>
                  <span className="text-slate-800 font-medium truncate block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {item.pickup_address || item.pickup_location || 'Designated Pickup Hub'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Safety / Quality</span>
                  <span className="font-semibold text-emerald-700 block">
                    {item.safety_status || 'Safe to Consider'}
                  </span>
                </div>
              </div>

              {/* Review / Rating if already provided */}
              {item.feedback_rating && (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100 text-xs text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold flex items-center gap-1 text-amber-600">
                      ★ {item.feedback_rating}.0
                    </span>
                    <span>"{item.feedback_comment || 'Great quality food and quick pickup coordination.'}"</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {onOpenMap && (
                    <button
                      onClick={() => onOpenMap(item)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5"
                    >
                      <RouteIcon className="w-3.5 h-3.5 text-emerald-600" />
                      View Route Map
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'donations' && (isDonor || isAdmin) && item.status === 'Available' && onDeleteFood && (
                    <button
                      onClick={() => onDeleteFood(item)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1"
                      title="Delete food listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Listing
                    </button>
                  )}

                  {isRecipient && item.status === 'Completed' && (
                    <button
                      onClick={() => onOpenRateModal && onOpenRateModal(item)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      {item.feedback_rating ? 'Edit Rating' : 'Rate Experience'}
                    </button>
                  )}

                  <button
                    onClick={() => onViewDetails && onViewDetails(item)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
