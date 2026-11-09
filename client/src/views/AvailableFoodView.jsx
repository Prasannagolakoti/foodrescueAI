import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Sparkles, 
  SlidersHorizontal, 
  X,
  Compass,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import FoodCard from '../components/FoodCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AvailableFoodView({ onViewDetails, onRequestFood, onOpenMap, onDeleteFood }) {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [foodType, setFoodType] = useState('all'); // 'all', 'veg', 'non-veg'
  const [statusFilter, setStatusFilter] = useState('Available'); // 'Available', 'all'
  const [minQuantity, setMinQuantity] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [userLocation, setUserLocation] = useState({
    lat: user?.lat ? parseFloat(user.lat) : null,
    lng: user?.lng ? parseFloat(user.lng) : null
  });
  const [geoEnabled, setGeoEnabled] = useState(false);

  useEffect(() => {
    if (user?.lat && user?.lng) {
      setUserLocation({
        lat: parseFloat(user.lat),
        lng: parseFloat(user.lng)
      });
    }
  }, [user]);

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
    fetchDonations();
  }, [selectedCategory, foodType, statusFilter, minQuantity, maxDistance, userLocation]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (foodType !== 'all') params.food_type = foodType;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (minQuantity) params.min_quantity = minQuantity;
      if (userLocation.lat && userLocation.lng) {
        params.user_lat = userLocation.lat;
        params.user_lng = userLocation.lng;
      }
      if (maxDistance) params.max_distance = maxDistance;

      const data = await api.getDonations(params);
      setDonations(data);
    } catch (err) {
      console.error('Fetch donations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonations();
  };

  const handleUseBrowserLocation = () => {
    if (user?.lat && user?.lng) {
      setUserLocation({
        lat: parseFloat(user.lat),
        lng: parseFloat(user.lng)
      });
      setGeoEnabled(true);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setFoodType('all');
    setStatusFilter('Available');
    setMinQuantity('');
    setMaxDistance('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Surplus Food Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Available Food Donations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, filter by location radius, and request verified food surplus for immediate rescue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUseBrowserLocation}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              geoEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            {geoEnabled ? 'GPS Active' : 'Use My GPS Location'}
          </button>

          <button
            onClick={fetchDonations}
            className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Listings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by food name, dish, or donor (e.g. Biryani, Bread, Fruits)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filter Pills: Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Granular Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Veg / Non-Veg */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Dietary Type</label>
            <select
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
            >
              <option value="all">All Dietary Types</option>
              <option value="veg">🌿 Pure Veg</option>
              <option value="non-veg">🍗 Non-Veg</option>
            </select>
          </div>

          {/* Max Distance */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Max Distance</label>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
            >
              <option value="">Any Distance</option>
              <option value="3">Within 3 km (Express)</option>
              <option value="7">Within 7 km</option>
              <option value="15">Within 15 km</option>
              <option value="30">Within 30 km</option>
            </select>
          </div>

          {/* Min Quantity */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Min Quantity (kg)</label>
            <input
              type="number"
              placeholder="Min kg..."
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
            />
          </div>

          {/* Availability Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Availability</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
            >
              <option value="Available">Available Only</option>
              <option value="all">All Statuses (Inc. Completed/Expired)</option>
            </select>
          </div>
        </div>

        {/* Clear filters action */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Found <strong>{donations.length}</strong> food donation{donations.length === 1 ? '' : 's'}</span>
          <button
            onClick={handleResetFilters}
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-88 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No matching food donations found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing distance filters, or check back soon as donors upload new surplus.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
          >
            Reset All Filters
          </button>
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
    </div>
  );
}

