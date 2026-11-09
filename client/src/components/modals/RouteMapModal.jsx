import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  X, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Route as RouteIcon, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  RotateCw,
  Soup,
  Building
} from 'lucide-react';

export default function RouteMapModal({ isOpen, onClose, donation, targetReceiver, currentUser }) {
  if (!isOpen || !donation) return null;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showDirections, setShowDirections] = useState(false);

  // 1. Donor Pickup Coordinates strictly from database
  const rawDonorLat = donation.lat ?? donation.donorLat ?? donation.donation_lat ?? donation.donor_user_lat;
  const rawDonorLng = donation.lng ?? donation.donorLng ?? donation.donation_lng ?? donation.donor_user_lng;
  const donorLat = (rawDonorLat != null && rawDonorLat !== '') ? parseFloat(rawDonorLat) : null;
  const donorLng = (rawDonorLng != null && rawDonorLng !== '') ? parseFloat(rawDonorLng) : null;
  const isDonorValid = donorLat != null && !isNaN(donorLat) && donorLng != null && !isNaN(donorLng);

  const donorAddress = donation.pickup_address || donation.donation_pickup_address || donation.donor_address || 'Designated Pickup Point';
  const foodTitle = donation.food_name || donation.foodName || 'Surplus Food Donation';
  const donorName = donation.donor_name || donation.donorName || 'Donor';

  // 2. Recipient Coordinates strictly from database
  let recLat = null;
  let recLng = null;
  let recName = '';
  let recAddress = '';

  if (targetReceiver) {
    const rawRecLat = targetReceiver.receiverLat ?? targetReceiver.lat;
    const rawRecLng = targetReceiver.receiverLng ?? targetReceiver.lng;
    if (rawRecLat != null && rawRecLat !== '') recLat = parseFloat(rawRecLat);
    if (rawRecLng != null && rawRecLng !== '') recLng = parseFloat(rawRecLng);
    recName = targetReceiver.receiverName || targetReceiver.name || '';
    recAddress = targetReceiver.receiverAddress || targetReceiver.address || '';
  }

  // If item is a request record with joined receiver coordinates
  if ((recLat == null || recLng == null) && (donation.receiver_user_lat || donation.receiver_lat)) {
    const rawHistLat = donation.receiver_user_lat ?? donation.receiver_lat;
    const rawHistLng = donation.receiver_user_lng ?? donation.receiver_lng;
    if (rawHistLat != null && rawHistLat !== '') recLat = parseFloat(rawHistLat);
    if (rawHistLng != null && rawHistLng !== '') recLng = parseFloat(rawHistLng);
    if (!recName) recName = donation.receiver_name || '';
  }

  // If not provided in targetReceiver, check logged-in recipient from database
  if ((recLat == null || recLng == null) && currentUser) {
    if (currentUser.lat != null && currentUser.lat !== '' && !isNaN(parseFloat(currentUser.lat))) {
      recLat = parseFloat(currentUser.lat);
    }
    if (currentUser.lng != null && currentUser.lng !== '' && !isNaN(parseFloat(currentUser.lng))) {
      recLng = parseFloat(currentUser.lng);
    }
    if (!recName) recName = currentUser.name || '';
    if (!recAddress) recAddress = currentUser.address || '';
  }

  const isRecipientValid = recLat != null && !isNaN(recLat) && recLng != null && !isNaN(recLng);
  const recipientLabel = recName || recAddress || 'Recipient Organization';

  // Determine coordinate validation status
  let locationError = null;
  if (!isDonorValid && !isRecipientValid) {
    locationError = 'Both donor pickup location and recipient location coordinates are missing or invalid in the database. Google Maps directions require valid GPS coordinates for both parties.';
  } else if (!isDonorValid) {
    locationError = 'Donor food pickup location coordinates are missing or invalid in the database. Unable to determine route origin.';
  } else if (!isRecipientValid) {
    locationError = 'Recipient location coordinates are missing or invalid in the database. Please make sure the recipient profile has a valid registered location address.';
  }

  // 3. Dynamic Google Maps Directions URL (Origin = Donor, Destination = Recipient)
  const googleMapsNavUrl = (isDonorValid && isRecipientValid)
    ? `https://www.google.com/maps/dir/?api=1&origin=${donorLat},${donorLng}&destination=${recLat},${recLng}&travelmode=driving`
    : null;

  // 4. Render Interactive Leaflet Map
  useEffect(() => {
    if (!isDonorValid || !isRecipientValid || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(donorLat + recLat) / 2, (donorLng + recLng) / 2],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
      }).addTo(map);

      routeLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    renderRouteAndMarkers();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [donorLat, donorLng, recLat, recLng, isDonorValid, isRecipientValid]);

  const renderRouteAndMarkers = async () => {
    const map = mapInstanceRef.current;
    if (!map || !routeLayerRef.current || !isDonorValid || !isRecipientValid) return;

    routeLayerRef.current.clearLayers();
    setLoadingRoute(true);

    // 1. Origin Marker: Donor Pickup (Green Pin)
    const donorIcon = L.divIcon({
      className: 'custom-donor-marker',
      html: `
        <div style="background-color: #059669; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(5,150,105,0.5);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const donorMarker = L.marker([donorLat, donorLng], { icon: donorIcon });
    donorMarker.bindPopup(`
      <div style="font-family: system-ui; padding: 4px; max-width: 230px;">
        <span style="font-size: 10px; font-weight: bold; color: #059669; text-transform: uppercase;">ORIGIN / FOOD PICKUP</span>
        <strong style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">${foodTitle}</strong>
        <p style="font-size: 11px; color: #475569; margin: 2px 0;">Donor: <strong>${donorName}</strong></p>
        <p style="font-size: 11px; color: #64748b; margin: 2px 0 0;">${donorAddress}</p>
        <p style="font-size: 10px; color: #94a3b8; margin-top: 2px;">GPS: ${donorLat.toFixed(5)}, ${donorLng.toFixed(5)}</p>
      </div>
    `);
    routeLayerRef.current.addLayer(donorMarker);

    // 2. Destination Marker: Recipient Organization (Blue Pin)
    const recipientIcon = L.divIcon({
      className: 'custom-recipient-marker',
      html: `
        <div style="background-color: #2563eb; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(37,99,235,0.5);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const recipientMarker = L.marker([recLat, recLng], { icon: recipientIcon });
    recipientMarker.bindPopup(`
      <div style="font-family: system-ui; padding: 4px; max-width: 230px;">
        <span style="font-size: 10px; font-weight: bold; color: #2563eb; text-transform: uppercase;">DESTINATION / RECIPIENT</span>
        <strong style="display: block; font-size: 13px; color: #0f172a; margin-top: 2px;">${recipientLabel}</strong>
        <p style="font-size: 11px; color: #64748b; margin: 4px 0 0;">${recAddress || 'Recipient Facility'}</p>
        <p style="font-size: 10px; color: #94a3b8; margin-top: 2px;">GPS: ${recLat.toFixed(5)}, ${recLng.toFixed(5)}</p>
      </div>
    `);
    routeLayerRef.current.addLayer(recipientMarker);

    // 3. Road Route Calculation from Donor (Origin) to Recipient (Destination)
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${donorLng},${donorLat};${recLng},${recLat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(osrmUrl);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);

        const routeGeoJson = L.geoJSON(route.geometry, {
          style: {
            color: '#059669',
            weight: 5,
            opacity: 0.85,
            lineJoin: 'round',
            lineCap: 'round'
          }
        });
        routeLayerRef.current.addLayer(routeGeoJson);

        const steps = [];
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          route.legs[0].steps.forEach((step, idx) => {
            if (step.maneuver) {
              const modifier = step.maneuver.modifier ? ` (${step.maneuver.modifier})` : '';
              const instruction = step.name 
                ? `${step.maneuver.type || 'Turn'}${modifier} onto ${step.name}` 
                : `${step.maneuver.type || 'Proceed'}${modifier}`;
              steps.push({
                index: idx + 1,
                instruction,
                distance: `${Math.round(step.distance)}m`
              });
            }
          });
        }

        setRouteInfo({
          distanceKm,
          durationMin,
          steps: steps.length > 0 ? steps : [
            { index: 1, instruction: `Depart from Donor pickup point: ${donorAddress}`, distance: '100m' },
            { index: 2, instruction: 'Drive along connecting corridor towards recipient location', distance: `${distanceKm} km` },
            { index: 3, instruction: `Arrive at Recipient destination: ${recipientLabel}`, distance: '0m' }
          ]
        });

        const bounds = L.latLngBounds([
          [donorLat, donorLng],
          [recLat, recLng]
        ]);
        map.fitBounds(bounds, { padding: [60, 60] });
      } else {
        throw new Error('OSRM routing response not ok');
      }
    } catch (err) {
      console.warn('Road routing fallback to direct line:', err);
      const latlngs = [
        [donorLat, donorLng],
        [recLat, recLng]
      ];
      const directLine = L.polyline(latlngs, {
        color: '#059669',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8
      });
      routeLayerRef.current.addLayer(directLine);

      // Haversine direct distance
      const R = 6371;
      const dLat = ((recLat - donorLat) * Math.PI) / 180;
      const dLon = ((recLng - donorLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((donorLat * Math.PI) / 180) *
          Math.cos((recLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const directKm = (R * c).toFixed(1);

      setRouteInfo({
        distanceKm: directKm,
        durationMin: Math.max(5, Math.round(parseFloat(directKm) * 2.5)),
        steps: [
          { index: 1, instruction: `Depart from Donor pickup point: ${donorAddress}`, distance: '100m' },
          { index: 2, instruction: `Follow direct transit route toward recipient`, distance: `${directKm} km` },
          { index: 3, instruction: `Arrive at Recipient: ${recipientLabel}`, distance: '0m' }
        ]
      });

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [60, 60] });
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 relative">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <RouteIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Donor to Recipient Navigation Route
              </h3>
              <p className="text-xs text-slate-500">
                Direct GPS route from Donor Food Pickup (Origin) to Recipient (Destination)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close Map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Missing/Invalid Coordinates Error Warning */}
        {locationError && (
          <div className="px-5 py-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-start gap-3 shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold text-rose-800">Cannot Open Google Maps Navigation Route</strong>
              <p className="text-rose-700 leading-relaxed">{locationError}</p>
            </div>
          </div>
        )}

        {/* Modal Main Content: Map + Side Route Details */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Map Canvas */}
          <div className="flex-1 relative min-h-[300px] md:min-h-[440px] bg-slate-100">
            {(!isDonorValid || !isRecipientValid) ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Route Map Unavailable</h4>
                <p className="text-xs text-slate-500 max-w-md">
                  {locationError}
                </p>
              </div>
            ) : (
              <>
                <div ref={mapContainerRef} className="w-full h-full z-0" />

                {/* Floating Top Labels on Map */}
                <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
                  {/* Origin Badge */}
                  <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="font-semibold text-slate-700">Origin (Donor):</span>
                    <span className="text-emerald-800 font-bold truncate max-w-[140px] sm:max-w-[180px]">
                      {donorName}
                    </span>
                  </div>

                  {/* Destination Badge */}
                  <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="font-semibold text-slate-700">Destination (Recipient):</span>
                    <span className="text-blue-800 font-bold truncate max-w-[140px] sm:max-w-[180px]">
                      {recipientLabel}
                    </span>
                  </div>
                </div>

                {loadingRoute && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-center justify-center z-20">
                    <div className="bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
                      <RotateCw className="w-4 h-4 text-emerald-600 animate-spin" />
                      Calculating road directions between donor and recipient...
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Side Route Details & Turn-by-Turn Panel */}
          <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[300px] md:max-h-none p-4 space-y-4">
            
            <div className="space-y-3">
              {/* Estimated Transit Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Transit Distance</span>
                <div className="flex items-baseline justify-between mt-1">
                  <div>
                    <span className="text-2xl font-black text-slate-900">
                      {routeInfo?.distanceKm || '...'} <span className="text-xs font-bold text-slate-500">km</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{routeInfo?.durationMin || '...'} mins
                    </span>
                    <span className="text-[10px] text-slate-400">Road driving time</span>
                  </div>
                </div>
              </div>

              {/* Waypoints Description */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                {/* Donor (Origin) */}
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold mb-0.5">
                    <Soup className="w-3.5 h-3.5" />
                    <span>Origin: Food Pickup (Donor)</span>
                  </div>
                  <p className="text-slate-900 font-semibold pl-5 text-[11px]">{donorName} – {foodTitle}</p>
                  <p className="text-slate-500 pl-5 text-[11px] truncate">{donorAddress}</p>
                  {isDonorValid && (
                    <p className="text-slate-400 pl-5 text-[10px]">Coordinates: {donorLat.toFixed(5)}, {donorLng.toFixed(5)}</p>
                  )}
                </div>

                {/* Recipient (Destination) */}
                <div className="border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold mb-0.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>Destination: Recipient Facility</span>
                  </div>
                  <p className="text-slate-900 font-semibold pl-5 text-[11px]">{recipientLabel}</p>
                  {recAddress && (
                    <p className="text-slate-500 pl-5 text-[11px] truncate">{recAddress}</p>
                  )}
                  {isRecipientValid && (
                    <p className="text-slate-400 pl-5 text-[10px]">Coordinates: {recLat.toFixed(5)}, {recLng.toFixed(5)}</p>
                  )}
                </div>
              </div>

              {/* Turn-by-turn Step Drawer */}
              {routeInfo?.steps && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <button
                    onClick={() => setShowDirections(!showDirections)}
                    className="w-full p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition"
                  >
                    <span>Turn-by-Turn Steps ({routeInfo.steps.length})</span>
                    {showDirections ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {showDirections && (
                    <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto text-[11px] text-slate-600 divide-y divide-slate-100">
                      {routeInfo.steps.map((st) => (
                        <div key={st.index} className="pt-2 flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-800">{st.index}. {st.instruction}</span>
                          <span className="text-slate-400 text-[10px] shrink-0 font-medium">{st.distance}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Google Maps Dynamic Directions Button */}
            <div className="pt-2">
              {googleMapsNavUrl ? (
                <a
                  href={googleMapsNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Open in Google Maps Navigation</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              ) : (
                <div className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>Google Maps Unavailable (Missing GPS)</span>
                </div>
              )}
              <p className="text-[10px] text-center text-slate-400 mt-1.5">
                Routes directly from Donor GPS origin to Recipient GPS destination.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
