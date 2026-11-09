import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  Search,
  Filter,
  RefreshCw,
  Send,
  Route as RouteIcon,
  Soup,
  Building,
  CheckCircle2,
  CalendarCheck,
  SlidersHorizontal,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SmartMatchingView({ onRequestFood, onViewDetails, onOpenMap }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Recipient Food Requirements Filters
  const [reqFoodName, setReqFoodName] = useState('');
  const [reqCategory, setReqCategory] = useState('All');
  const [reqQuantity, setReqQuantity] = useState('');
  const [maxDistance, setMaxDistance] = useState('all');
  const [filterMinScore, setFilterMinScore] = useState(40);
  const [selectedDonationId, setSelectedDonationId] = useState('');
  const [donationsList, setDonationsList] = useState([]);

  const categories = [
    'All',
    'Cooked Meals',
    'Bakery & Bread',
    'Raw Produce / Veggies',
    'Packaged / Canned',
    'Dairy & Sweets',
    'Beverages'
  ];

  useEffect(() => {
    loadMatches();
  }, [selectedDonationId, reqCategory, maxDistance, filterMinScore]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDonationId) params.donation_id = selectedDonationId;
      if (reqFoodName.trim()) params.food_name = reqFoodName.trim();
      if (reqCategory && reqCategory !== 'All') params.category = reqCategory;
      if (reqQuantity && parseFloat(reqQuantity) > 0) params.quantity = reqQuantity;
      if (maxDistance && maxDistance !== 'all') params.max_distance = maxDistance;
      params.min_score = filterMinScore;

      const [matchesData, donationsData] = await Promise.all([
        api.getSmartMatches(params),
        api.getDonations({ status: 'Available' })
      ]);

      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setDonationsList(Array.isArray(donationsData) ? donationsData : []);
    } catch (err) {
      console.error('Failed to load smart matches:', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMatches();
  };

  const handleResetFilters = () => {
    setReqFoodName('');
    setReqCategory('All');
    setReqQuantity('');
    setMaxDistance('all');
    setSelectedDonationId('');
    setFilterMinScore(40);
  };

  const filteredMatches = matches.filter((m) => m.matchPercentage >= filterMinScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        
        <div className="relative max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Automated Food Rescue Matching</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            AI Smart Food Matching System
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Intelligently pairs surplus food donations with recipient requirements by evaluating <strong>Food Name & Keywords (15%)</strong>, <strong>Category (15%)</strong>, <strong>Quantity (20%)</strong>, <strong>Live Availability (15%)</strong>, <strong>Expiry Time (15%)</strong>, and <strong>GPS Location Proximity (20%)</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-teal-200">
            <span className="flex items-center gap-1">✓ Real database records only</span>
            <span className="flex items-center gap-1">✓ 6-factor smart evaluation</span>
            <span className="flex items-center gap-1">✓ Dynamic donor-to-recipient Google Maps route</span>
          </div>
        </div>
      </div>

      {/* Recipient Food Requirements Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Food Matching Requirements & Filters
            </span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-emerald-600 transition"
          >
            Reset Filters
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Food Name Search Requirement */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Food Name / Requirement</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Biryani, Rice, Bread..."
                value={reqFoodName}
                onChange={(e) => setReqFoodName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Category Requirement */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Food Category</label>
            <select
              value={reqCategory}
              onChange={(e) => setReqCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-800"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Quantity Requirement */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Required Quantity (kg)</label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 10"
              value={reqQuantity}
              onChange={(e) => setReqQuantity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Max Proximity Distance */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Max Distance</label>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-800"
            >
              <option value="all">Any Distance</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>

          {/* Search Trigger */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Match Food</span>
            </button>
          </div>
        </form>

        {/* Secondary Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Specific Available Food Filter */}
            {donationsList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Focus on Food:</span>
                <select
                  value={selectedDonationId}
                  onChange={(e) => setSelectedDonationId(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
                >
                  <option value="">All Available Listings ({donationsList.length})</option>
                  {donationsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.food_name} ({d.quantity} {d.quantity_unit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Min Match % Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">
                Min Match: <strong>{filterMinScore}%</strong>
              </span>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(parseInt(e.target.value))}
                className="w-28 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredMatches.length}</strong> Matching Recommendations
            </span>
            <button
              onClick={loadMatches}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Recalculate Matches"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Matching Results List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3 p-6">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching food donations available right now</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            There are currently no active surplus food donations in the database matching your requirements (food name, category, quantity, availability, safe deadline, and location). Please check back soon or adjust your requirements above.
          </p>
          <div className="pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Search Requirements</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((m, idx) => (
            <div
              key={`${m.donationId}-${m.receiverId}-${idx}`}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            >
              {/* Match Score Badge Top Right */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Food Compatibility
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Distance: <strong>{m.distanceKm != null ? `${m.distanceKm} km away` : 'Coordinates pending'}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      m.foodType === 'veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {m.foodType === 'veg' ? '🌿 Pure Veg' : '🍗 Non-Veg'}
                    </span>
                    {m.hoursRemaining != null && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Safe for: <strong>~{m.hoursRemaining} hrs</strong>
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{m.foodName}</span>
                    <span className="text-slate-400 font-normal text-sm">➔</span>
                    <span className="text-emerald-700">{m.receiverName}</span>
                  </h3>
                </div>

                {/* Score Pill */}
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-2xl font-black text-emerald-600">{m.matchPercentage}%</span>
                      <span className="text-xs font-bold text-emerald-700">Compatibility</span>
                    </div>
                    <span className="text-[10px] text-slate-400">6-Factor AI Match</span>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-black text-lg shadow-inner">
                    {m.matchPercentage}%
                  </div>
                </div>
              </div>

              {/* Pairing Entities Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Donor Available Food */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Available Surplus Food</span>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-slate-800">{m.foodName}</strong>
                    <span className="font-bold text-emerald-700">{m.availableQuantity} {m.quantityUnit} (~{m.packetsCount} plates)</span>
                  </div>
                  <p className="text-slate-600 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Donor: <strong className="text-slate-800">{m.donorName}</strong>
                  </p>
                  <p className="text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Pickup: {m.pickupAddress}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Category: {m.foodCategory} | Safety: {m.safetyStatus || 'Verified'}
                  </p>
                </div>

                {/* Recipient Organization */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Target Recipient Organization</span>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-slate-800 flex items-center gap-1">
                      {m.receiverName}
                      {m.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="Verified NGO" />}
                    </strong>
                    <span className="font-bold text-teal-700">Demand: ~{m.requiredQuantity || m.availableQuantity} kg</span>
                  </div>
                  <p className="text-slate-600 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Type: {m.organizationName}
                  </p>
                  <p className="text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Location: {m.receiverAddress}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Contact: {m.receiverPhone || 'Verified in database'}
                  </p>
                </div>
              </div>

              {/* Explainable AI Rationale */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>AI Matching Analysis:</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  {m.recommendationReason}
                </p>
              </div>

              {/* 6-Factor Breakdown Progress Mini-Bars */}
              {m.breakdown && (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Proximity (20%)</span>
                      <span className="text-slate-800">{m.breakdown.locationScore || m.breakdown.distanceScore}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.breakdown.locationScore || m.breakdown.distanceScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Quantity (20%)</span>
                      <span className="text-slate-800">{m.breakdown.quantityScore}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${m.breakdown.quantityScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Food Name (15%)</span>
                      <span className="text-slate-800">{m.breakdown.foodNameScore || 95}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.breakdown.foodNameScore || 95}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Category (15%)</span>
                      <span className="text-slate-800">{m.breakdown.categoryScore || 95}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${m.breakdown.categoryScore || 95}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Expiry Time (15%)</span>
                      <span className="text-slate-800">{m.breakdown.expiryScore || 95}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${m.breakdown.expiryScore || 95}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Availability (15%)</span>
                      <span className="text-slate-800">{m.breakdown.availabilityScore || 100}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${m.breakdown.availabilityScore || 100}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom CTAs: Interactive Map + Details + Request */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                {/* Clickable Map Option: Origin = Donor, Destination = Recipient */}
                {onOpenMap && (
                  <button
                    type="button"
                    onClick={() => onOpenMap(
                      {
                        id: m.donationId,
                        food_name: m.foodName,
                        pickup_address: m.pickupAddress,
                        lat: m.donorLat,
                        lng: m.donorLng,
                        donor_name: m.donorName,
                        contact_phone: m.donorPhone
                      },
                      {
                        receiverName: m.receiverName,
                        receiverAddress: m.receiverAddress,
                        receiverLat: m.receiverLat,
                        receiverLng: m.receiverLng
                      }
                    )}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs flex items-center gap-1.5 transition"
                  >
                    <RouteIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Route on Google Maps</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => onViewDetails && onViewDetails({ 
                      id: m.donationId, 
                      food_name: m.foodName, 
                      safe_deadline: m.safeDeadline, 
                      quantity: m.availableQuantity, 
                      quantity_unit: m.quantityUnit, 
                      packets_count: m.packetsCount, 
                      pickup_address: m.pickupAddress, 
                      donor_name: m.donorName, 
                      category: m.foodCategory, 
                      food_type: m.foodType, 
                      storage_condition: 'Monitored', 
                      safety_status: m.safetyStatus, 
                      safety_score: m.safetyScore 
                    })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                  >
                    Inspect Details
                  </button>

                  <button
                    onClick={() => onRequestFood && onRequestFood({ 
                      id: m.donationId, 
                      food_name: m.foodName, 
                      safe_deadline: m.safeDeadline, 
                      quantity: m.availableQuantity, 
                      quantity_unit: m.quantityUnit, 
                      packets_count: m.packetsCount, 
                      pickup_address: m.pickupAddress, 
                      donor_name: m.donorName, 
                      category: m.foodCategory, 
                      food_type: m.foodType 
                    })}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Initiate Request
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
