import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Building, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Filter, 
  Eye, 
  Clock, 
  MapPin, 
  RefreshCw,
  Search,
  Flag
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'donations', 'reports'
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await api.getAdminUsers({ role: userRoleFilter });
        setUsers(data);
      } else if (activeTab === 'donations') {
        const data = await api.getDonations({ status: 'all' });
        setDonations(data);
      } else if (activeTab === 'reports') {
        const data = await api.getReports();
        setReports(data);
      }
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user verification
  const handleToggleVerify = async (userId, currentVerified) => {
    setActionLoading(true);
    try {
      await api.verifyUser(userId, !currentVerified);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: !currentVerified ? 1 : 0 } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  // Moderate donation status
  const handleModerateDonation = async (donationId, newStatus) => {
    setActionLoading(true);
    try {
      await api.moderateDonation(donationId, { status: newStatus });
      setDonations((prev) =>
        prev.map((d) => (d.id === donationId ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      alert(err.message || 'Failed to moderate donation');
    } finally {
      setActionLoading(false);
    }
  };

  // Update report status
  const handleUpdateReport = async (reportId, status) => {
    setActionLoading(true);
    try {
      await api.updateReportStatus(reportId, status);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
    } catch (err) {
      alert(err.message || 'Failed to update report');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Central Supervision & Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Admin Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verify NGOs and food donors, moderate active listings, oversee food safety compliance, and investigate reports.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users & Verification
          </button>

          <button
            onClick={() => setActiveTab('donations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'donations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Donations & Safety
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            Reports & Issues
          </button>
        </div>
      </div>

      {/* Tab 1: Users & Verification */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
              >
                <option value="all">All Roles</option>
                <option value="donor">Donors Only</option>
                <option value="receiver">Receivers / NGOs Only</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Organization / User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Contact & Location</th>
                    <th className="py-3.5 px-4">Activity Stats</th>
                    <th className="py-3.5 px-4">Verification Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'donor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.role === 'receiver'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-800 text-white'
                        }`}>
                          {u.role}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">{u.organization_type}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block text-slate-800">{u.phone || 'N/A'}</span>
                        <span className="text-[11px] text-slate-400 truncate block max-w-[180px]">{u.address}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === 'donor' ? (
                          <span>{u.donations_count || 0} donations • ★ {u.rating || '5.0'}</span>
                        ) : (
                          <span>{u.requests_count || 0} requests recorded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleVerify(u.id, u.is_verified)}
                            disabled={actionLoading}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              u.is_verified
                                ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            {u.is_verified ? 'Revoke Verification' : 'Verify Account'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Donations & Food Safety Moderation */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Food Surplus Listing</th>
                    <th className="py-3.5 px-4">Donor Organization</th>
                    <th className="py-3.5 px-4">Quantity / Portions</th>
                    <th className="py-3.5 px-4">Safety Score & Status</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={d.image_url}
                            alt={d.food_name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{d.food_name}</span>
                            <span className="text-[11px] text-slate-400">{d.category} • {d.food_type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{d.donor_name}</span>
                        <span className="text-[11px] text-slate-400">{d.pickup_address}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900">{d.quantity} {d.quantity_unit}</strong>
                        <span className="block text-[11px] text-slate-400">~{d.packets_count} plates</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            d.safety_status === 'Safe to Consider'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.safety_status === 'Needs Verification'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {d.safety_status} ({d.safety_score}%)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{d.storage_condition}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          d.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : d.status === 'Completed'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : d.status === 'Expired'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {d.status === 'Available' && (
                            <button
                              onClick={() => handleModerateDonation(d.id, 'Expired')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition"
                              title="Force Expire Listing for Safety"
                            >
                              Force Expire
                            </button>
                          )}
                          {d.status === 'Expired' && (
                            <button
                              onClick={() => handleModerateDonation(d.id, 'Available')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition"
                              title="Re-open Listing"
                            >
                              Re-open
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Reports & Issues */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">Clean moderation queue</h3>
              <p className="text-xs text-slate-500">No open reports or safety violations currently pending.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Report ID</th>
                      <th className="py-3.5 px-4">Reported By</th>
                      <th className="py-3.5 px-4">Target Type & ID</th>
                      <th className="py-3.5 px-4">Reason & Details</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Moderator Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">#{r.id}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{r.reporter_name}</span>
                          <span className="text-[11px] text-slate-400">{r.reporter_email}</span>
                        </td>
                        <td className="py-3.5 px-4 uppercase font-bold text-slate-700">
                          {r.target_type} #{r.target_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <strong className="text-rose-700 block">{r.reason}</strong>
                          <span className="text-[11px] text-slate-500 block max-w-sm">{r.details || 'No additional text'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            r.status === 'Pending'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : r.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.status !== 'Resolved' && (
                              <button
                                onClick={() => handleUpdateReport(r.id, 'Resolved')}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                              >
                                Mark Resolved
                              </button>
                            )}
                            {r.status !== 'Dismissed' && (
                              <button
                                onClick={() => handleUpdateReport(r.id, 'Dismissed')}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

