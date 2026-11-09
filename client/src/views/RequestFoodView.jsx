import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Package, 
  Star,
  Users,
  Search,
  Filter,
  AlertCircle,
  LogIn,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RequestFoodView({ onOpenRateModal, setCurrentView }) {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const isDonor = userRole === 'donor';
  const isRecipient = userRole === 'recipient' || userRole === 'receiver';
  const isAdmin = userRole === 'admin';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [statusFilter, user]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await api.getRequests(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch requests error:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus, donorNotes = '') => {
    try {
      setUpdatingId(requestId);
      setActionMessage(null);
      await api.updateRequestStatus(requestId, newStatus, donorNotes);
      setActionMessage(`Request #${requestId} status successfully updated to "${newStatus}"!`);
      setTimeout(() => setActionMessage(null), 3500);
      await fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to update request');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Food Rescue Requests</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Please sign in as a Donor to manage incoming requests for your food, or as a Recipient to track your requests.
        </p>
        <button
          onClick={() => setCurrentView && setCurrentView('auth')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Sign In to Access Requests
        </button>
      </div>
    );
  }

  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.food_name?.toLowerCase().includes(term) ||
      r.receiver_name?.toLowerCase().includes(term) ||
      r.donor_name?.toLowerCase().includes(term) ||
      r.organization_name?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending Review</span>;
      case 'Accepted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">Accepted</span>;
      case 'Ready for Pickup':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Ready for Pickup</span>;
      case 'Picked Up':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">In Transit</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Completed & Fed</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Declined</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-4 h-4" />
            Dispatch & Fulfillment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Food Rescue Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isDonor
              ? 'Review real incoming requests from recipients, accept collection schedules, and manage pickup dispatch.'
              : isRecipient
              ? 'Track the live status of your food requests and coordinate collection with donors.'
              : 'Supervise all platform food rescue requests and status transitions.'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-100 p-1 rounded-2xl">
          {['all', 'Pending', 'Accepted', 'Ready for Pickup', 'Completed', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Requests' : st}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by food name or partner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <button
          onClick={fetchRequests}
          className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition"
          title="Refresh Requests"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isDonor
              ? 'No requests have been placed for your food donations yet. When recipients request your food, they will appear here.'
              : isRecipient
              ? 'You have not submitted any food requests yet. Browse the Available Food catalog to request food.'
              : 'No requests match the selected status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={req.food_image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80'}
                    alt={req.food_name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{req.food_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.food_type === 'veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {req.food_type === 'veg' ? '🌿 Veg' : '🍗 Non-Veg'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Request ID #{req.id} • Submitted {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {getStatusBadge(req.status)}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    req.urgency_level === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {req.urgency_level} Urgency
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Requested Volume</span>
                  <p className="text-sm font-bold text-slate-900">
                    {req.requested_quantity} {req.quantity_unit} requested
                  </p>
                  <p className="text-slate-500 flex items-center gap-1 font-semibold text-emerald-700">
                    <Users className="w-3.5 h-3.5" />
                    Feeding {req.beneficiaries_count} individuals
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Recipient Organization</span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {req.organization_name || req.receiver_name}
                  </p>
                  <p className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {req.receiver_phone || 'Contact provided upon pickup'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block">Pickup Point & Target Time</span>
                  <p className="font-semibold text-slate-800 truncate flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {req.pickup_location || req.donation_pickup_address}
                  </p>
                  <p className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {new Date(req.required_pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} ({new Date(req.required_pickup_time).toLocaleDateString()})
                  </p>
                </div>
              </div>

              {/* Special Handling Notes */}
              {req.special_requirements && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                  <strong className="text-slate-800">Transport & Handling Notes: </strong>
                  {req.special_requirements}
                </div>
              )}

              {/* Donor Notes */}
              {req.donor_notes && (
                <div className="p-3 bg-emerald-50/70 rounded-xl text-xs text-emerald-900 border border-emerald-100">
                  <strong>Donor Instructions: </strong> {req.donor_notes}
                </div>
              )}

              {/* Action Buttons based on Role & Current Status */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Donor: <strong>{req.donor_name}</strong> {req.donor_phone ? `(${req.donor_phone})` : ''}
                </div>

                <div className="flex items-center gap-2">
                  {/* Donor Acceptance Actions */}
                  {isDonor && req.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'Rejected', 'Food is no longer available.')}
                        disabled={updatingId === req.id}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'Accepted', 'Food is confirmed and will be packaged in thermal containers.')}
                        disabled={updatingId === req.id}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                      >
                        Accept Request
                      </button>
                    </>
                  )}

                  {/* Donor Ready for Pickup Action */}
                  {isDonor && req.status === 'Accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'Ready for Pickup', 'Packaged & verified for collection.')}
                      disabled={updatingId === req.id}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}

                  {/* Recipient / Donor Confirm Picked Up */}
                  {(isRecipient || isDonor || isAdmin) && req.status === 'Ready for Pickup' && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'Picked Up')}
                      disabled={updatingId === req.id}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition"
                    >
                      Confirm Collection (Picked Up)
                    </button>
                  )}

                  {/* Recipient / Donor Completed Action */}
                  {(isRecipient || isDonor || isAdmin) && req.status === 'Picked Up' && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'Completed')}
                      disabled={updatingId === req.id}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                    >
                      Mark Completed & Distributed
                    </button>
                  )}

                  {/* Completed: Rate Donor for Recipients */}
                  {req.status === 'Completed' && (isRecipient || isAdmin) && (
                    <button
                      onClick={() => onOpenRateModal && onOpenRateModal(req)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      {req.feedback_rating ? 'Edit Rating' : 'Rate Donor'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
