import React from 'react';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  Route as RouteIcon,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FoodCard({ donation, onViewDetails, onRequestFood, onOpenMap, onDeleteFood, userRole }) {
  const { user } = useAuth();
  const isOwnerOrAdmin = user && (user.id === donation.donor_id || user.role === 'admin');

  const now = new Date();
  const deadline = new Date(donation.safe_deadline);
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 3600);
  const isExpired = diffHours <= 0 || donation.status === 'Expired';
  const isApproachingExpiry = diffHours > 0 && diffHours < 2;

  const getSafetyBadge = (status) => {
    if (isExpired || status === 'Expired / Unsafe') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Expired / Unsafe
        </span>
      );
    }
    if (status === 'Needs Verification') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Needs Verification
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        Safe to Consider ({donation.safety_score || 95}%)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Card Header Image */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={donation.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'}
          alt={donation.food_name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          onError={(e) => {
            // Fallback gracefully if image URL is invalid or fails to load
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
            donation.food_type === 'veg'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}>
            {donation.food_type === 'veg' ? '🌿 Pure Veg' : '🍗 Non-Veg'}
          </span>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white">
            {donation.category}
          </span>
        </div>

        {/* Bottom Banner on Image: Quantity & Remaining Hours */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <span className="text-xl font-extrabold drop-shadow-xs">
              {donation.quantity} <span className="text-xs font-semibold">{donation.quantity_unit}</span>
            </span>
            <p className="text-[11px] text-emerald-200 font-medium drop-shadow-xs">
              ~{donation.packets_count} plates
            </p>
          </div>

          <div className="text-right">
            {isExpired ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-600 text-white">
                Expired
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                isApproachingExpiry ? 'bg-amber-500 text-white animate-pulse' : 'bg-black/60 backdrop-blur-xs text-emerald-300'
              }`}>
                <Clock className="w-3 h-3" />
                {Math.max(0, Math.round(diffHours * 10) / 10)}h left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* AI Safety Status Badge */}
          <div className="mb-2">
            {getSafetyBadge(donation.safety_status)}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition">
            {donation.food_name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {donation.description || 'Surplus wholesome food packaged for prompt rescue.'}
          </p>
        </div>

        {/* Logistics & Location info */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Donor:</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 truncate max-w-[170px]">
              {donation.donor_name}
              {donation.donor_verified ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : null}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Storage:</span>
            <span className="font-medium text-slate-700 truncate max-w-[170px]">{donation.storage_condition}</span>
          </div>

          {/* Location & Interactive Map Trigger */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Location:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-800 text-right truncate max-w-[120px]">
                {donation.distanceKm != null ? (
                  <strong className="text-emerald-600">{donation.distanceKm} km away</strong>
                ) : (
                  (donation.pickup_address || '').split(',')[0]
                )}
              </span>

              {onOpenMap && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMap(donation);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs transition"
                  title="Open interactive route map & directions"
                >
                  <RouteIcon className="w-3 h-3 text-emerald-600" />
                  <span>Map</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => onViewDetails(donation)}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition flex items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </button>

          {donation.status === 'Available' && !isExpired ? (
            <button
              onClick={() => onRequestFood(donation)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 transition flex items-center justify-center gap-1"
            >
              Request Food
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <span className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 text-center">
              {donation.status}
            </span>
          )}

          {/* Delete Option for Donor who posted this listing or Admin */}
          {isOwnerOrAdmin && onDeleteFood && (
            <button
              type="button"
              onClick={() => onDeleteFood(donation)}
              className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition shrink-0"
              title="Delete Food Donation Listing"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
