import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Compass, 
  Layers, 
  Clock, 
  ShieldCheck, 
  HeartHandshake, 
  Building, 
  Eye, 
  Send,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MapView({ onViewDetails, onRequestFood }) {
  const { user } = useAuth();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circleLayerRef = useRef(null);

  const [donations, setDonations] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Cooked Meals', 'Produce', 'Bakery', 'NGOs'
  const [radiusKm, setRadiusKm] = useState(15);
  const [userCoords, setUserCoords] = useState({
    lat: user?.lat || 17.4265,
    lng: user?.lng || 78.4468
  });
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const [donationsRes, usersRes] = await Promise.all([
        api.getDonations({ status: 'Available' }),
        api.getUsers({ role: 'receiver' }).catch(() => [])
      ]);
      setDonations(donationsRes);
      setNgos(usersRes);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userCoords.lat, userCoords.lng],
        zoom: 13,
        zoomControl: true
      });

      // CartoDB Positron / OSM clean tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      circleLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Radius Circle when data or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    markersLayerRef.current.clearLayers();
    circleLayerRef.current.clearLayers();

    // 1. Draw User Location Pin & Radius Circle
    const userIcon = L.divIcon({
      className: 'custom-user-pin',
      html: `
        <div style="background-color: #0f172a; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon });
    userMarker.bindPopup(`
      <div style="font-family: system-ui; padding: 4px;">
        <strong style="color: #0f172a; font-size: 13px;">Your Current Reference Location</strong>
        <p style="font-size: 11px; color: #64748b; margin: 2px 0 0;">Scanning surplus food in ${radiusKm} km radius</p>
      </div>
    `);
    markersLayerRef.current.addLayer(userMarker);

    // Draw radius circle
    if (radiusKm > 0) {
      const circle = L.circle([userCoords.lat, userCoords.lng], {
        radius: radiusKm * 1000,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 8'
      });
      circleLayerRef.current.addLayer(circle);
    }

    // 2. Add Food Donation Markers
    if (activeFilter !== 'NGOs') {
      const filteredDonations = donations.filter((d) => {
        if (activeFilter === 'Cooked Meals') return d.category === 'Cooked Meals';
        if (activeFilter === 'Bakery') return d.category === 'Bakery & Bread';
        if (activeFilter === 'Produce') return d.category === 'Raw Produce / Veggies';
        return true;
      });

      filteredDonations.forEach((d) => {
        if (!d.lat || !d.lng || isNaN(parseFloat(d.lat)) || isNaN(parseFloat(d.lng))) return;
        const lat = parseFloat(d.lat);
        const lng = parseFloat(d.lng);

        const foodIcon = L.divIcon({
          className: 'custom-food-pin',
          html: `
            <div style="background-color: #059669; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(5,150,105,0.4);">
              <span style="font-size: 16px;">🍲</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([lat, lng], { icon: foodIcon });

        const popupContent = `
          <div style="font-family: system-ui; width: 220px; padding: 2px;">
            <img src="${d.image_url}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;" />
            <div style="font-size: 10px; font-weight: bold; color: ${d.food_type === 'veg' ? '#059669' : '#dc2626'}; text-transform: uppercase;">
              ${d.food_type === 'veg' ? '🌿 Pure Veg' : '🍗 Non-Veg'} • ${d.category}
            </div>
            <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 2px 0 4px;">${d.food_name}</h4>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              <strong>${d.quantity} ${d.quantity_unit}</strong> (~${d.packets_count} plates)
            </div>
            <div style="font-size: 11px; color: #059669; font-weight: 600; margin-bottom: 6px;">
              ${d.distanceKm != null ? `${d.distanceKm} km away` : d.pickup_address.split(',')[0]}
            </div>
            <div style="display: flex; gap: 4px;">
              <button id="btn-popup-req-${d.id}" style="flex: 1; padding: 6px; background-color: #059669; color: white; font-weight: bold; font-size: 11px; border: none; border-radius: 6px; cursor: pointer;">
                Request Food
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          const reqBtn = document.getElementById(`btn-popup-req-${d.id}`);
          if (reqBtn) {
            reqBtn.onclick = () => {
              if (onRequestFood) onRequestFood(d);
            };
          }
        });

        markersLayerRef.current.addLayer(marker);
      });
    }

    // 3. Add NGO / Receiver Markers
    if (activeFilter === 'All' || activeFilter === 'NGOs') {
      ngos.forEach((ngo) => {
        const lat = ngo.lat || 17.4265;
        const lng = ngo.lng || 78.4468;

        const ngoIcon = L.divIcon({
          className: 'custom-ngo-pin',
          html: `
            <div style="background-color: #0284c7; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(2,132,199,0.35);">
              <span style="font-size: 15px;">🏠</span>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker([lat, lng], { icon: ngoIcon });
        marker.bindPopup(`
          <div style="font-family: system-ui; width: 200px; padding: 2px;">
            <div style="font-size: 10px; font-weight: bold; color: #0284c7; text-transform: uppercase;">
              Registered Receiver • ${ngo.organization_type || 'Shelter'}
            </div>
            <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 2px 0 4px;">${ngo.name}</h4>
            <p style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${ngo.address}</p>
            <div style="font-size: 11px; color: #0284c7; font-weight: 600;">
              📞 ${ngo.phone || '+91 97011 22334'}
            </div>
          </div>
        `);
        markersLayerRef.current.addLayer(marker);
      });
    }
  }, [donations, ngos, activeFilter, radiusKm, userCoords]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setUserCoords(newCoords);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lng], 14, { duration: 1.5 });
          }
          setLocating(false);
        },
        (err) => {
          alert('Could not retrieve device GPS. Using default location coordinates.');
          setLocating(false);
        }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            Geographic Food Rescue Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Interactive City Food Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visual map of available food donations, donor pickup spots, and nearby NGOs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            {locating ? 'Locating...' : 'Locate Me (GPS)'}
          </button>

          <button
            onClick={loadMapData}
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Map Pins"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Filter categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'All', label: 'All Markers' },
            { id: 'Cooked Meals', label: '🍲 Cooked Meals' },
            { id: 'Bakery', label: '🍞 Bakery' },
            { id: 'Produce', label: '🍎 Fresh Produce' },
            { id: 'NGOs', label: '🏠 Orphanages & NGOs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Radius Slider */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
            Search Radius: <strong className="text-emerald-600">{radiusKm} km</strong>
          </label>
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value))}
            className="w-28 sm:w-36 accent-emerald-600"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100 h-[620px]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-5 left-5 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-slate-200 text-xs space-y-2 max-w-xs">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">Map Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white shrink-0" />
            <span className="text-slate-600">Surplus Food Listings ({donations.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-sky-600 border border-white shrink-0" />
            <span className="text-slate-600">Registered NGOs & Shelters ({ngos.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-white shrink-0" />
            <span className="text-slate-600">Your Current Anchor Coordinates</span>
          </div>
        </div>
      </div>
    </div>
  );
}

