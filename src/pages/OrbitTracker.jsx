import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Radio, MapPin, Search, Calendar, Navigation, Target, Database, RefreshCw } from 'lucide-react';

// --- ICONS ---
const issMarker = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-6 h-6 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse relative">
            <div class="absolute -inset-4 bg-cyan-400/30 rounded-full animate-ping"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
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
  const [lastPassesFetch, setLastPassesFetch] = useState(null);
  const searchRef = useRef();

  const CACHE_KEYS = {
    ISS_POSITION: 'iss_current_position',
    GEOLOCATION: 'geolocation_',
    ISS_PASSES: 'iss_passes_'
  };

  const CACHE_TTLS = {
    ISS_POSITION: 5000, 
    GEOLOCATION: 7 * 24 * 60 * 60 * 1000, 
    ISS_PASSES: 60 * 60 * 1000 
  };

  // 1. Live ISS Telemetry
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
        updateCache(CACHE_KEYS.ISS_POSITION, newData, { ttl: CACHE_TTLS.ISS_POSITION });
      } catch (e) {
        console.error("ISS data fetch error:", e);
        const cachedISS = getCache(CACHE_KEYS.ISS_POSITION);
        if (cachedISS) {
          setIssData({ ...cachedISS, _cached: true });
        }
      }
    };
    fetchISS();
    const timer = setInterval(fetchISS, 5000);
    return () => clearInterval(timer);
  }, [updateCache, getCache]);

  // 2. User Location
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
          updateCache(`${CACHE_KEYS.GEOLOCATION}CURRENT`, newLocation, { ttl: CACHE_TTLS.GEOLOCATION });
          fetchISSPasses(newLocation.lat, newLocation.lng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsSearching(false);
        }
      );
    }
  }, [updateCache]);

  // 3. Search Location
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
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
        updateCache(geocodeCacheKey, newLocation, { ttl: CACHE_TTLS.GEOLOCATION });
        fetchISSPasses(newLocation.lat, newLocation.lng);
      } else {
        alert("Location not found.");
      }
    } catch (error) {
      console.error("Location search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, updateCache, getCache, isCacheStale]);

  // 4. Fetch Passes
  const fetchISSPasses = useCallback(async (lat, lon, forceRefresh = false) => {
    setLoadingPasses(true);
    const cacheKey = `${CACHE_KEYS.ISS_PASSES}${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const cachedPasses = getCache(cacheKey);
    const needsFetch = forceRefresh || !cachedPasses || isCacheStale(cacheKey);

    if (!needsFetch && cachedPasses) {
      setPasses(Array.isArray(cachedPasses) ? cachedPasses : []);
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
      updateCache(cacheKey, enrichedPasses, { ttl: CACHE_TTLS.ISS_PASSES });
    } catch (error) {
      console.error("ISS passes fetch error:", error);
      if (cachedPasses) {
        setPasses(Array.isArray(cachedPasses) ? cachedPasses : []);
        setUsingCachedPasses(true);
        setLastPassesFetch(cachedPasses._fetchedAt || 'Unknown');
      } else {
        setPasses([]);
      }
    } finally {
      setLoadingPasses(false);
    }
  }, [updateCache, getCache, isCacheStale]);

  const formatDate = useCallback((timestamp) => new Date(timestamp * 1000).toLocaleString(), []);
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

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
  }, []);

  const refreshPasses = useCallback(() => {
    if (userLocation) fetchISSPasses(userLocation.lat, userLocation.lng, true);
  }, [userLocation, fetchISSPasses]);

  return (
    <div className="h-[80vh] w-full flex flex-col gap-4 animate-in fade-in duration-700 relative">
      
      {/* --- MODE CONTROLS (Responsive) --- */}
      <div className="absolute top-4 left-0 w-full z-[1000] px-4 pointer-events-none md:left-6 md:w-auto md:px-0">
        <div className="flex flex-col gap-2 items-center md:items-start">
          
          <div className="pointer-events-auto w-full max-w-[calc(100vw-2rem)] md:w-auto overflow-x-auto no-scrollbar rounded-xl bg-space-950/90 backdrop-blur border border-white/20 p-1 shadow-2xl">
             <div className="flex gap-1 min-w-max">
                <button 
                  onClick={() => handleModeChange('ISS')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${mode === 'ISS' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Radio size={14} /> ISS Live
                </button>
                <button 
                  onClick={() => handleModeChange('USER')} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${mode === 'USER' ? 'bg-green-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  <Target size={14} /> ISS Overflight
                </button>
             </div>
          </div>

          {/* CACHE STATUS */}
          {usingCachedPasses && (
            <div className="pointer-events-auto bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 w-fit backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">Cached Passes</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MOBILE SEARCH PANEL --- */}
      {mode === 'USER' && (
        <div className="absolute top-[80px] md:top-20 left-4 right-4 md:right-auto z-[1000] bg-space-950/90 backdrop-blur border border-white/10 p-3 rounded-xl shadow-xl md:w-80 animate-in slide-in-from-left-4">
          <div className="mb-3">
            <p className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
              <Navigation size={16} /> Find ISS Overflights
            </p>
            
            <div className="flex gap-2 mb-2">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                placeholder="Enter city..."
                className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500 w-full min-w-0"
              />
              <button
                onClick={searchLocation}
                disabled={isSearching}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search size={16} />}
              </button>
            </div>
            
            <button
              onClick={getUserLocation}
              disabled={isSearching}
              className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 text-xs font-bold"
            >
              <MapPin size={14} />
              Use My Location
            </button>
          </div>

          {userLocation && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400 font-bold">Selected Location</p>
                {lastPassesFetch && (
                  <button onClick={refreshPasses} disabled={loadingPasses} className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${loadingPasses ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate w-full" title={userLocation.name}>{userLocation.name}</p>
            </div>
          )}
        </div>
      )}

      {/* ISS DATA PANEL */}
      {mode === 'ISS' && (
        <div className="absolute top-[80px] md:top-20 left-4 z-[900] bg-space-950/90 backdrop-blur border border-white/10 p-3 rounded-xl shadow-xl w-60 animate-in slide-in-from-left-4 hidden md:block">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Position</p>
              <p className="font-mono text-xs text-cyan-400">{issData.pos[0].toFixed(2)}, {issData.pos[1].toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Alt</p>
                <p className="font-mono text-xs text-white">{issData.alt.toFixed(0)}km</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Vel</p>
                <p className="font-mono text-xs text-white">{issData.vel.toFixed(0)}km/h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOBILE OPTIMIZED PASSES LIST --- */}
      {mode === 'USER' && userLocation && (
        <div className={`
          fixed md:absolute bottom-0 md:top-4 right-0 md:right-4 z-[1000] 
          w-full md:w-80 max-h-[40vh] md:max-h-[70vh] 
          bg-space-950/95 backdrop-blur border-t md:border border-white/10 
          rounded-t-2xl md:rounded-xl shadow-2xl p-4 overflow-y-auto
          transition-transform duration-300 ease-out
        `}>
          <div className="flex items-center justify-between mb-3 sticky top-0 bg-space-950/95 z-10 pb-2 border-b border-white/10">
            <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
              <Calendar size={16} /> Next Passes
            </h3>
            <div className="text-[10px] text-slate-500">
              {passes.length} Found
            </div>
          </div>
          
          {loadingPasses ? (
            <div className="text-center py-4">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : passes.length > 0 ? (
            <div className="space-y-2">
              {passes.map((pass, index) => (
                <div key={index} className={`p-2 rounded border ${index === 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-slate-900/30 border-white/5'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-white font-medium">{formatDate(pass.risetime)}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${index === 0 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {getTimeUntil(pass.risetime)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Dur: {pass.duration}s</span>
                    <span>Max Alt: {Math.round(pass.maxalt)}°</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-500">No passes found nearby.</div>
          )}
        </div>
      )}

      {/* MAP CONTAINER */}
      <div className="flex-1 rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0 bg-space-900">
        <MapContainer 
          center={[20, 78]} 
          zoom={3} 
          className="h-full w-full bg-space-950"
          attributionControl={false}
          scrollWheelZoom={true}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          {mode === 'ISS' && (
            <>
              <Marker position={issData.pos} icon={issMarker}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-cyan-600">ISS</h3>
                    <p className="text-xs mt-1">Alt: {issData.alt} km</p>
                    <p className="text-xs">Vel: {issData.vel} km/h</p>
                  </div>
                </Popup>
              </Marker>
              <RecenterMap position={issData.pos} mode={mode} />
            </>
          )}
          
          {mode === 'USER' && userLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarker}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-green-600">Your Location</h3>
                    <p className="text-xs mt-1">{userLocation.name}</p>
                  </div>
                </Popup>
              </Marker>
              <Marker position={issData.pos} icon={issMarker} />
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={1000000} 
                pathOptions={{ fillColor: 'green', color: 'green', fillOpacity: 0.1, weight: 1 }}
              />
              <RecenterMap position={[userLocation.lat, userLocation.lng]} mode={mode} zoom={4} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}