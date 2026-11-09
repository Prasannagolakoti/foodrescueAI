import React, { useState } from 'react';
import { 
  User, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Star, 
  Save, 
  Sparkles,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function UserProfileView() {
  const { user, stats, refreshProfile, quickLogin } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [organizationType, setOrganizationType] = useState(user?.organization_type || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.updateProfile({
        name,
        phone,
        address,
        organization_type: organizationType,
        bio
      });
      await refreshProfile();
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        <div className="relative">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
            alt={user.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-slate-100 shadow-md"
          />
          {user.is_verified ? (
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white" title="Verified Organization">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          ) : null}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-slate-900">{user.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              {user.role}
            </span>
            {user.is_verified ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                Verified Entity
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                Pending Verification
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium">{user.organization_type}</p>
          <p className="text-xs text-slate-600 max-w-xl">{user.bio || 'Dedicated to zero waste and feeding hungry souls.'}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {user.phone || '+91 98491 55667'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {user.address}
            </span>
          </div>
        </div>
      </div>

      {/* Role-Specific Stats Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {user.role === 'donor' ? (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-emerald-600">{stats.total_donations || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Donations Listed</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-teal-600">{Math.round(stats.total_kg_donated || 0)} kg</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Rescued Weight</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-emerald-700">{stats.total_packets_donated || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Meals Provided</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
                  ★ {Math.round((stats.avg_rating || 5) * 10) / 10}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                  Rating ({stats.review_count || 1} reviews)
                </span>
              </div>
            </>
          ) : user.role === 'receiver' ? (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-emerald-600">{stats.total_requests || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Requests Placed</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-teal-600">{Math.round(stats.total_kg_received || 0)} kg</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Food Received</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-emerald-700">{stats.total_beneficiaries_served || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Beneficiaries Fed</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-sky-600">{stats.completed_requests || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Completed Rescues</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-emerald-600">{stats.total_donors || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Registered Donors</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-teal-600">{stats.total_receivers || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Registered NGOs</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-amber-600">{stats.total_listings || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Listings Managed</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-2xl font-black text-rose-600">{stats.pending_reports || 0}</span>
                <span className="text-xs text-slate-500 block mt-0.5 font-medium">Open Reports</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Update Organization Details
        </h3>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Legal Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Entity Type *</label>
            <input
              type="text"
              required
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address / Landmark *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Mission / Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

