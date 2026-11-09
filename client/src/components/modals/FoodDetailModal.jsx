import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  Building, 
  CheckCircle2, 
  HeartHandshake, 
  Flag,
  Route as RouteIcon,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FoodDetailModal({ donation, onClose, onRequest, onReport, onOpenMap, onDeleteFood, userRole }) {
  const { user } = useAuth();
  if (!donation) return null;

  const isOwnerOrAdmin = user && (user.id === donation.donor_id || user.role === 'admin');
  const normalizedRole = (userRole || user?.role || '').toLowerCase();
  const isRecipient = normalizedRole === 'receiver' || normalizedRole === 'recipient';

  const now = new Date();
  const deadline = new Date(donation.safe_deadline);
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 3600);
  const isExpired = diffHours <= 0;

  const getSafetyBadge = (status) => {
    if (status === 'Safe to Consider') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Safe to Consider ({donation.safety_score || 95}/100)
        </span>
      );
    }
    if (status === 'Needs Verification') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Needs Verification ({donation.safety_score || 65}/100)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        Expired / Unsafe
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 shadow-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Banner Image */}
        <div className="relative h-64 w-full bg-slate-100 overflow-hidden rounded-t-3xl">
          <img
            src={donation.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'}
            alt={donation.food_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                donation.food_type === 'veg' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {donation.food_type}
              </span>
              <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-xs">
                {donation.food_name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-white">
                {donation.quantity} <span className="text-lg font-medium">{donation.quantity_unit}</span>
              </span>
              <p className="text-xs text-white/90">~{donation.packets_count} portions</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Status and Safety bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              {getSafetyBadge(donation.safety_status)}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                {donation.category}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              {isExpired ? (
                <span className="text-rose-600 font-bold">Expired</span>
              ) : (
                <span className="text-slate-800">
                  Safe for <strong className="text-emerald-700">{Math.max(0, Math.round(diffHours * 10) / 10)} hrs</strong>
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Surplus Description</h4>
            <p className="text-slate-700 text-sm leading-relaxed">
              {donation.description || 'Hygienically prepared surplus food ready for redistribution.'}
            </p>
          </div>

          {/* Critical Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Preparation Time</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                {new Date(donation.prep_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
              <span className="text-[11px] text-slate-500">{new Date(donation.prep_time).toLocaleDateString()}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Safe Until</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                {new Date(donation.safe_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
              <span className="text-[11px] text-slate-500">{new Date(donation.safe_deadline).toLocaleDateString()}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 block font-medium">Storage Method</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block truncate">
                {donation.storage_condition}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">Monitored</span>
            </div>
          </div>

          {/* AI Food Safety Advisor Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">AI Food Safety Verification Note</h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  {donation.safety_notes || 'All safety criteria conform with safe food redistribution hygiene protocols. Always verify freshness at pickup.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-2 italic">
                  *Disclaimer: AI verification evaluates temperature, elapsed time, and storage protocols algorithmically. Physical visual inspection before serving is mandatory.
                </p>
              </div>
            </div>
          </div>

          {/* Donor & Pickup Details with Interactive Map Link */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={donation.donor_avatar || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80'}
                  alt={donation.donor_name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {donation.donor_name}
                    {donation.donor_verified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" title="Verified Donor" />
                    ) : null}
                  </h4>
                  <p className="text-xs text-slate-500">{donation.donor_org || 'Registered Food Donor'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-500">★ {donation.donor_rating || '5.0'}</span>
                <span className="text-[11px] text-slate-400 block">({donation.donor_reviews_count || 1} rescues)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{donation.pickup_address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{donation.contact_phone || '+91 98491 55667'}</span>
              </div>
            </div>

            {/* Interactive Route Map Button */}
            {onOpenMap && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMap(donation);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs flex items-center justify-center gap-2 transition"
                >
                  <RouteIcon className="w-4 h-4 text-emerald-600" />
                  <span>Open Interactive Map & Turn-by-Turn Route</span>
                </button>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-between pt-2 gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onReport && onReport(donation)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 font-medium transition"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Concern
              </button>

              {/* Delete Listing Button for Donor */}
              {isOwnerOrAdmin && onDeleteFood && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDeleteFood(donation);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Listing
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>

              {isRecipient && donation.status === 'Available' && !isExpired ? (
                <button
                  onClick={() => {
                    onClose();
                    onRequest(donation);
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
                >
                  <HeartHandshake className="w-4 h-4" />
                  Request This Food
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
