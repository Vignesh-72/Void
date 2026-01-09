import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Radio, Globe, MapPin, Search, Calendar, Clock, Navigation, Target, Database, RefreshCw } from 'lucide-react';

// --- ICONS ---
const issMarker = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-6 h-6 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse relative">
            <div class="absolute -inset-4 bg-cyan-400/30 rounded-full animate-ping"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const padMarker = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-2 h-2 bg-orange-500 rotate-45 border border-white shadow-lg hover:scale-150 transition-transform cursor-pointer"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4]
});

const userMarker = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

function RecenterMap({ position, mode, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position && (mode === 'ISS' || mode === 'USER')) {
      map.setView(position, zoom || map.getZoom(), { animate: true });
    }
  }, [position, mode, zoom]);
  return null;
}

export default function OrbitTracker({ cacheContext }) {
  const { updateCache, getCache, isCacheStale, clearCache } = cacheContext;
  const [mode, setMode] = useState('ISS');
  const [issData, setIssData] = useState({ pos: [0, 0], alt: 0, vel: 0 });
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [passes, setPasses] = useState([]);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [usingCachedPasses, setUsingCachedPasses] = useState(false);
  const [usingCachedPads, setUsingCachedPads] = useState(false);
  const [lastPassesFetch, setLastPassesFetch] = useState(null);
  const [lastPadsFetch, setLastPadsFetch] = useState(null);
  const [isRefreshingPads, setIsRefreshingPads] = useState(false);
  const searchRef = useRef();

  const CACHE_KEYS = {
    ISS_POSITION: 'iss_current_position',
    LAUNCH_PADS: 'launch_pads',
    GEOLOCATION: 'geolocation_',
    ISS_PASSES: 'iss_passes_'
  };

  const CACHE_TTLS = {
    ISS_POSITION: 5000, // 5 seconds (real-time)
    LAUNCH_PADS: 24 * 60 * 60 * 1000, // 24 hours (static)
    GEOLOCATION: 7 * 24 * 60 * 60 * 1000, // 7 days (static)
    ISS_PASSES: 60 * 60 * 1000 // 1 hour
  };

  // 1. Live ISS Telemetry (real-time, minimal caching)
  useEffect(() => {
    const fetchISS = async () => {
      try {
        const res = await axios.get('https://api.wheretheiss.at/v1/satellites/25544');
        const newData = {
          pos: [res.data.latitude, res.data.longitude],
          alt: Math.round(res.data.altitude),
          vel: Math.round(res.data.velocity),
          timestamp: new Date(res.data.timestamp * 1000),
          _fetchedAt: new Date().toISOString()
        };
        
        setIssData(newData);
        
        // Cache for 5 seconds to prevent rapid API calls
        updateCache(CACHE_KEYS.ISS_POSITION, newData, { ttl: CACHE_TTLS.ISS_POSITION });
      } catch (e) {
        console.error("ISS data fetch error:", e);
        
        // Fallback to cached data
        const cachedISS = getCache(CACHE_KEYS.ISS_POSITION);
        if (cachedISS) {
          setIssData({ ...cachedISS, _cached: true });
        }
      }
    };

    // Initial fetch
    fetchISS();
    
    // Set interval for live updates
    const timer = setInterval(fetchISS, 5000);
    return () => clearInterval(timer);
  }, [updateCache, getCache]);

  // 2. GLOBAL Launch Sites (with caching)
  useEffect(() => {
    const fetchLaunchPads = async (forceRefresh = false) => {
      if (mode !== 'PADS') return;

      // Check cache first
      const cachedPads = getCache(CACHE_KEYS.LAUNCH_PADS);
      const needsUpdate = forceRefresh || !cachedPads || isCacheStale(CACHE_KEYS.LAUNCH_PADS);

      if (!needsUpdate && cachedPads) {
        setUsingCachedPads(true);
        setLastPadsFetch(cachedPads._fetchedAt || new Date().toISOString());
        return;
      }

      if (forceRefresh) {
        setIsRefreshingPads(true);
      }

      try {
        const res = await axios.get('https://lldev.thespacedevs.com/2.2.0/pad/?limit=500');
        const enrichedPads = res.data.results.map(pad => ({
          ...pad,
          _fetchedAt: new Date().toISOString()
        }));

        setUsingCachedPads(false);
        setLastPadsFetch(new Date().toISOString());
        
        // Cache for 24 hours
        updateCache(CACHE_KEYS.LAUNCH_PADS, enrichedPads, { ttl: CACHE_TTLS.LAUNCH_PADS });
      } catch (err) {
        console.error("Map Data Error", err);
        
        // Fallback to cached data
        if (cachedPads) {
          setUsingCachedPads(true);
          setLastPadsFetch(cachedPads._fetchedAt || 'Unknown');
        }
      } finally {
        setIsRefreshingPads(false);
      }
    };

    fetchLaunchPads();
  }, [mode, updateCache, getCache, isCacheStale]);

  // 3. Get user's current location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Your Current Location",
            _fetchedAt: new Date().toISOString()
          };
          setUserLocation(newLocation);
          setMode('USER');
          setIsSearching(false);
          
          // Cache geolocation
          updateCache(
            `${CACHE_KEYS.GEOLOCATION}CURRENT`,
            newLocation,
            { ttl: CACHE_TTLS.GEOLOCATION }
          );
          
          fetchISSPasses(newLocation.lat, newLocation.lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsSearching(false);
        }
      );
    }
  }, [updateCache]);

  // 4. Search for location by name
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Check cache for geocoding results
    const geocodeCacheKey = `${CACHE_KEYS.GEOLOCATION}${searchQuery.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedLocation = getCache(geocodeCacheKey);
    
    if (cachedLocation && !isCacheStale(geocodeCacheKey)) {
      setUserLocation(cachedLocation);
      setMode('USER');
      fetchISSPasses(cachedLocation.lat, cachedLocation.lng);
      setIsSearching(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const newLocation = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          name: result.display_name,
          _fetchedAt: new Date().toISOString()
        };
        
        setUserLocation(newLocation);
        setMode('USER');
        
        // Cache geocoding result for 7 days
        updateCache(geocodeCacheKey, newLocation, { ttl: CACHE_TTLS.GEOLOCATION });
        
        fetchISSPasses(newLocation.lat, newLocation.lng);
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Location search error:", error);
      alert("Error searching for location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, updateCache, getCache, isCacheStale]);

  // 5. Fetch ISS passes for a location
  const fetchISSPasses = useCallback(async (lat, lon, forceRefresh = false) => {
    setLoadingPasses(true);
    
    // Create cache key for this location
    const cacheKey = `${CACHE_KEYS.ISS_PASSES}${lat.toFixed(4)}_${lon.toFixed(4)}`;
    
    // Check cache first
    const cachedPasses = getCache(cacheKey);
    const needsFetch = forceRefresh || !cachedPasses || isCacheStale(cacheKey);

    if (!needsFetch && cachedPasses) {
      setPasses(cachedPasses);
      setUsingCachedPasses(true);
      setLastPassesFetch(cachedPasses._fetchedAt || new Date().toISOString());
      setLoadingPasses(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://api.wheretheiss.at/v1/satellites/25544/passes?lat=${lat}&lon=${lon}&n=10`
      );
      
      const passesData = response.data.passes || [];
      const enrichedPasses = passesData.map(pass => ({
        ...pass,
        _fetchedAt: new Date().toISOString()
      }));
      
      setPasses(enrichedPasses);
      setUsingCachedPasses(false);
      setLastPassesFetch(new Date().toISOString());
      
      // Cache for 1 hour
      updateCache(cacheKey, enrichedPasses, { ttl: CACHE_TTLS.ISS_PASSES });
    } catch (error) {
      console.error("ISS passes fetch error:", error);
      
      // Fallback to cached data if available
      if (cachedPasses) {
        setPasses(cachedPasses);
        setUsingCachedPasses(true);
        setLastPassesFetch(cachedPasses._fetchedAt || 'Unknown');
      } else {
        setPasses([]);
      }
    } finally {
      setLoadingPasses(false);
    }
  }, [updateCache, getCache, isCacheStale]);

  // 6. Format date for display
  const formatDate = useCallback((timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  // 7. Calculate time until pass
  const getTimeUntil = useCallback((timestamp) => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    
    if (diff < 0) return "Passed";
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }, []);

  // Get cached pads
  const getCachedPads = useCallback(() => {
    const cached = getCache(CACHE_KEYS.LAUNCH_PADS);
    return cached || [];
  }, [getCache]);

  // Handle mode change
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    
    // Auto-refresh pads if they're stale when switching to PADS mode
    if (newMode === 'PADS') {
      const cachedPads = getCache(CACHE_KEYS.LAUNCH_PADS);
      if (!cachedPads || isCacheStale(CACHE_KEYS.LAUNCH_PADS)) {
        // Will trigger useEffect
      }
    }
  }, [getCache, isCacheStale]);

  // Refresh passes for current location
  const refreshPasses = useCallback(() => {
    if (userLocation) {
      fetchISSPasses(userLocation.lat, userLocation.lng, true);
    }
  }, [userLocation, fetchISSPasses]);

  // Refresh pads data
  const refreshPads = useCallback(() => {
    clearCache(CACHE_KEYS.LAUNCH_PADS);
    // Trigger useEffect by forcing re-evaluation
    const cachedPads = getCache(CACHE_KEYS.LAUNCH_PADS);
    if (!cachedPads || isCacheStale(CACHE_KEYS.LAUNCH_PADS)) {
      // Will trigger useEffect
    }
  }, [clearCache, getCache, isCacheStale]);

  return (
    <div className="h-[80vh] w-full flex flex-col gap-4 animate-in fade-in duration-700 relative">
      
      {/* MODE CONTROLS */}
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-4">
        <div className="flex bg-space-950/90 backdrop-blur border border-white/20 p-1 rounded-xl shadow-2xl">
          <button 
            onClick={() => handleModeChange('ISS')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'ISS' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Radio size={14} /> ISS Live
          </button>
          <button 
            onClick={() => handleModeChange('USER')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'USER' ? 'bg-green-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Target size={14} /> ISS Overflight
          </button>
          <button 
            onClick={() => handleModeChange('PADS')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'PADS' ? 'bg-orange-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="flex items-center gap-1">
              <Globe size={14} />
              Launch Sites
              {isRefreshingPads && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
            </div>
          </button>
        </div>

        {/* CACHE STATUS BADGE */}
        {(usingCachedPads || usingCachedPasses) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">
                {usingCachedPads ? 'Cached Launch Pads' : 'Cached ISS Passes'}
              </span>
            </div>
          </div>
        )}

        {/* LOCATION SEARCH (for USER mode) */}
        {mode === 'USER' && (
          <div className="bg-space-950/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-xl w-80 animate-in slide-in-from-left-4">
            <div className="mb-4">
              <p className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                <Navigation size={16} /> Find ISS Overflights
              </p>
              
              <div className="flex gap-2 mb-3">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                  placeholder="Enter city or address..."
                  className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={searchLocation}
                  disabled={isSearching}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                </button>
              </div>
              
              <div className="text-center">
                <span className="text-xs text-slate-400">— OR —</span>
              </div>
              
              <button
                onClick={getUserLocation}
                disabled={isSearching}
                className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MapPin size={16} />
                Use My Current Location
              </button>
            </div>

            {/* USER LOCATION INFO */}
            {userLocation && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 font-bold">Selected Location</p>
                  {lastPassesFetch && (
                    <button
                      onClick={refreshPasses}
                      disabled={loadingPasses}
                      className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingPasses ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  )}
                </div>
                <p className="text-sm text-white font-mono">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
                <p className="text-xs text-slate-400 truncate" title={userLocation.name}>
                  {userLocation.name}
                </p>
                {userLocation._fetchedAt && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Saved: {new Date(userLocation._fetchedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ISS DATA PANEL */}
        {mode === 'ISS' && (
          <div className="bg-space-950/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-xl w-60 animate-in slide-in-from-left-4">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Position</p>
                <p className="font-mono text-sm text-cyan-400">
                  {issData.pos[0].toFixed(4)}, {issData.pos[1].toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Altitude</p>
                <p className="font-mono text-sm text-white">{issData.alt.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Velocity</p>
                <p className="font-mono text-sm text-white">{issData.vel.toLocaleString()} km/h</p>
              </div>
              {issData.timestamp && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Last Update</p>
                  <p className="font-mono text-xs text-slate-400">
                    {issData.timestamp.toLocaleTimeString()}
                    {issData._cached && ' (cached)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PADS MODE INFO */}
      {mode === 'PADS' && (
        <div className="absolute top-6 right-6 z-[1000] w-72">
          <div className="bg-space-950/90 backdrop-blur border border-white/10 rounded-xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                <Globe size={16} /> Launch Sites
              </h3>
              <button
                onClick={refreshPads}
                disabled={isRefreshingPads}
                className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingPads ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span className={usingCachedPads ? 'text-amber-400' : 'text-green-400'}>
                  {usingCachedPads ? 'Cached' : 'Live'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Last Updated</span>
                <span className="text-slate-300">
                  {lastPadsFetch ? new Date(lastPadsFetch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Sites Loaded</span>
                <span className="text-slate-300">{getCachedPads().length}</span>
              </div>
            </div>
            
            {usingCachedPads && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-amber-400">
                  Displaying cached data. Will refresh in {Math.max(0, Math.floor((CACHE_TTLS.LAUNCH_PADS - (Date.now() - (new Date(lastPadsFetch || 0)).getTime())) / 60000))} min.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ISS PASSES TABLE (for USER mode) */}
      {mode === 'USER' && userLocation && (
        <div className="absolute top-6 right-6 z-[1000] w-96 max-h-[60vh] overflow-y-auto">
          <div className="bg-space-950/90 backdrop-blur border border-white/10 rounded-xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
                  <Calendar size={16} /> Next 10 ISS Passes
                </h3>
                {usingCachedPasses && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">CACHED</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshPasses}
                  disabled={loadingPasses}
                  className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingPasses ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
            
            {lastPassesFetch && (
              <div className="mb-3 text-xs text-slate-500">
                Predictions valid until: {new Date(new Date(lastPassesFetch).getTime() + CACHE_TTLS.ISS_PASSES).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            
            {loadingPasses ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-slate-400 mt-2">Calculating orbital passes...</p>
              </div>
            ) : passes.length > 0 ? (
              <div className="space-y-2">
                {passes.map((pass, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${index === 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-slate-900/30 border-white/5'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs text-slate-400">Rise Time</p>
                        <p className="text-sm text-white font-medium">
                          {formatDate(pass.risetime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${index === 0 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {getTimeUntil(pass.risetime)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Duration:</span>
                        <span className="text-white ml-2">{pass.duration} seconds</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Max Alt:</span>
                        <span className="text-white ml-2">{Math.round(pass.maxalt)}°</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">No ISS pass predictions available for this location.</p>
                <p className="text-xs text-slate-500 mt-1">Try a different location or check back later.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAP CONTAINER */}
      <div className="flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0 bg-space-900">
        <MapContainer 
          center={[20, 78]} 
          zoom={3} 
          className="h-full w-full bg-space-950"
          attributionControl={false}
          scrollWheelZoom={true}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* ISS MODE: Show ISS and track it */}
          {mode === 'ISS' && (
            <>
              <Marker position={issData.pos} icon={issMarker}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-cyan-600">International Space Station</h3>
                    <p className="text-sm mt-1">Altitude: {issData.alt} km</p>
                    <p className="text-sm">Velocity: {issData.vel} km/h</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Last update: {issData.timestamp?.toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
              <RecenterMap position={issData.pos} mode={mode} />
            </>
          )}
          
          {/* USER MODE: Show user location and ISS passes */}
          {mode === 'USER' && userLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarker}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-green-600">Observation Point</h3>
                    <p className="text-sm mt-1">{userLocation.name}</p>
                    <p className="text-xs text-slate-600">
                      {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Saved: {userLocation._fetchedAt ? new Date(userLocation._fetchedAt).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </Popup>
              </Marker>
              {/* Show ISS current position in user mode too */}
              <Marker position={issData.pos} icon={issMarker}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-cyan-600">ISS Current Position</h3>
                  </div>
                </Popup>
              </Marker>
              {/* Circle showing visibility range (approx 1000km radius) */}
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={1000000} // 1000km in meters
                pathOptions={{ fillColor: 'green', color: 'green', fillOpacity: 0.1, weight: 1 }}
              />
              <RecenterMap position={[userLocation.lat, userLocation.lng]} mode={mode} zoom={5} />
            </>
          )}
          
          {/* PADS MODE: Show all launch pads */}
          {mode === 'PADS' && getCachedPads()
            .filter(pad => pad.latitude && pad.longitude) 
            .map(pad => (
              <Marker 
                key={pad.id} 
                position={[parseFloat(pad.latitude), parseFloat(pad.longitude)]} 
                icon={padMarker}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[160px]">
                    <h3 className="font-bold text-sm uppercase text-black">{pad.name}</h3>
                    <div className="text-[10px] font-mono mt-1 text-slate-600 bg-slate-100 p-1 rounded inline-block">
                      {pad.location?.name}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded">
                        Launches: {pad.total_launch_count}
                      </span>
                    </div>
                    {pad._fetchedAt && (
                      <p className="text-[10px] text-slate-500 mt-2">
                        Updated: {new Date(pad._fetchedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}