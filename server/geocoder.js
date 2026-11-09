// Geocoding utility for real user-entered addresses
// Uses known address coordinate dictionary with fallback to OpenStreetMap Nominatim

const KNOWN_COORDINATES = [
  { match: /vignan/i, lat: 16.2315471, lng: 80.5526116 },
  { match: /vadlamudi/i, lat: 16.2246056, lng: 80.5589246 },
  { match: /chebrolu/i, lat: 16.1950, lng: 80.5280 },
  { match: /guntur/i, lat: 16.3067, lng: 80.4365 },
  { match: /tenali/i, lat: 16.2430, lng: 80.6400 },
  { match: /vijayawada/i, lat: 16.5062, lng: 80.6480 },
  { match: /banjara\s*hills/i, lat: 17.4123, lng: 78.4382 },
  { match: /panjagutta/i, lat: 17.4265, lng: 78.4468 },
  { match: /jubilee\s*hills/i, lat: 17.4319, lng: 78.4073 },
  { match: /hitec\s*city/i, lat: 17.4435, lng: 78.3772 },
  { match: /madhapur/i, lat: 17.4483, lng: 78.3915 },
  { match: /gachibowli/i, lat: 17.4401, lng: 78.3489 },
  { match: /kukatpally/i, lat: 17.4849, lng: 78.4138 },
  { match: /secunderabad/i, lat: 17.4399, lng: 78.4983 },
  { match: /hyderabad/i, lat: 17.3850, lng: 78.4867 }
];

async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') return null;
  const cleanAddr = address.trim();
  if (!cleanAddr) return null;

  // 1. Check known coordinate dictionary
  for (const item of KNOWN_COORDINATES) {
    if (item.match.test(cleanAddr)) {
      return { lat: item.lat, lng: item.lng };
    }
  }

  // 2. Query OpenStreetMap Nominatim
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(cleanAddr);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FoodRescueApp/1.0' },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }

  return null;
}

module.exports = {
  geocodeAddress
};

