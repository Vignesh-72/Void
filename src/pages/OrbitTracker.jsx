import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Radio, MapPin, Search, Calendar, Navigation, Target, Database, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

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
  const { updateCache, getCache, isCacheStale } = cacheContext;
  const [mode, setMode] = useState('ISS');
  const [issData, setIssData] = useState({ pos: [0, 0], alt: 0, vel: 0 });
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [passes, setPasses] = useState([]);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [usingCachedPasses, setUsingCachedPasses] = useState(false);
  const [lastPassesFetch, setLastPassesFetch] = useState(null);
  
  // UI State
  const [showPasses, setShowPasses] = useState(false); 

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
    setShowPasses(true); 
    
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
    if (newMode === 'ISS') setShowPasses(false);
  }, []);

  const refreshPasses = useCallback(() => {
    if (userLocation) fetchISSPasses(userLocation.lat, userLocation.lng, true);
  }, [userLocation, fetchISSPasses]);

  return (
    // FIX: Removed calc() that was causing overflow. 
    // Added overflow-hidden to prevent body scrolling.
    <div className="flex flex-col h-[75vh] md:h-[80vh] gap-4 animate-in fade-in duration-700 relative overflow-hidden">
      
      {/* --- TOP CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 z-10 shrink-0">
        
        {/* MODE TOGGLES */}
        <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex w-full md:w-auto">
          <button 
            onClick={() => handleModeChange('ISS')} 
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 
              ${mode === 'ISS' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Radio size={14} /> Live Track
          </button>
          <button 
            onClick={() => handleModeChange('USER')} 
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 
              ${mode === 'USER' ? 'bg-green-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Target size={14} /> Overflights
          </button>
        </div>

        {/* SEARCH BAR (Only User Mode) */}
        {mode === 'USER' && (
          <div className="flex gap-2 w-full md:w-auto md:max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                placeholder="Find city (e.g. London)"
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:border-green-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <button
              onClick={getUserLocation}
              disabled={isSearching}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white disabled:opacity-50"
              title="Use Current Location"
            >
              <MapPin size={18} />
            </button>
          </div>
        )}

        {/* ISS STATS (Desktop) */}
        {mode === 'ISS' && (
          <div className="hidden md:flex gap-4 text-xs font-mono bg-black/40 px-4 py-2 rounded-xl border border-white/10">
            <span className="text-slate-400">ALT: <span className="text-white">{issData.alt.toFixed(0)} km</span></span>
            <span className="text-slate-400 border-l border-white/10 pl-4">VEL: <span className="text-white">{issData.vel.toFixed(0)} km/h</span></span>
          </div>
        )}
      </div>

      {/* --- MAIN MAP AREA --- */}
      {/* FIX: Removed min-h that was pushing content out. Used flex-1 to fill remaining space. */}
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
            attribution='© OpenStreetMap'
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

        {/* MOBILE OVERLAY: ISS STATS (ISS Mode Only) */}
        {mode === 'ISS' && (
          // FIXED: Adjusted padding from bottom to ensure it doesn't overlap nav
          <div className="md:hidden absolute bottom-20 left-4 right-4 bg-black/80 backdrop-blur-md border border-white/20 p-3 rounded-xl flex justify-between items-center z-[500]">
             <div className="text-center">
               <p className="text-[10px] text-slate-400 font-bold">ALTITUDE</p>
               <p className="text-lg font-mono text-white">{issData.alt.toFixed(0)} <span className="text-xs">km</span></p>
             </div>
             <div className="h-8 w-px bg-white/10"></div>
             <div className="text-center">
               <p className="text-[10px] text-slate-400 font-bold">VELOCITY</p>
               <p className="text-lg font-mono text-white">{issData.vel.toFixed(0)} <span className="text-xs">km/h</span></p>
             </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM SHEET: PASS PREDICTIONS --- */}
      {mode === 'USER' && userLocation && (
        <div 
          className={`
            fixed md:absolute 
            /* FIX: Set bottom-24 to clear the mobile navbar */
            bottom-24 md:bottom-4
            left-0 md:left-auto right-0 md:right-4 z-[1000] 
            w-full md:w-80
            bg-[#0a0a0a] md:bg-black/90 md:backdrop-blur-xl border-t md:border border-white/20 
            rounded-t-3xl md:rounded-2xl
            shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
            /* Logic: If closed, hide everything except header (60px) */
            ${showPasses ? 'translate-y-0' : 'translate-y-[calc(100%-60px)] md:translate-y-0'}
          `}
          style={{ maxHeight: '60vh' }}
        >
          {/* DRAG HANDLE / HEADER */}
          <div 
            onClick={() => setShowPasses(!showPasses)}
            className="flex items-center justify-between p-4 cursor-pointer border-b border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-t-3xl md:rounded-t-2xl"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${passes.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Next Sightings</h3>
                <p className="text-[10px] text-slate-400">{passes.length} Passes Found</p>
              </div>
            </div>
            <div className="md:hidden text-slate-500">
              {showPasses ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </div>
          </div>

          {/* LIST CONTENT */}
          <div className="overflow-y-auto p-4 space-y-3 md:max-h-[300px] max-h-[40vh]">
            {loadingPasses ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <RefreshCw className="w-6 h-6 text-green-500 animate-spin" />
                <p className="text-xs text-slate-500 font-mono">CALCULATING ORBITALS...</p>
              </div>
            ) : passes.length > 0 ? (
              passes.map((pass, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-xs text-white font-bold mb-0.5">{formatDate(pass.risetime)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Dur: {pass.duration}s • Max Alt: {Math.round(pass.maxalt)}°
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${index === 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-400 border-white/10'}`}>
                    {getTimeUntil(pass.risetime)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-4">
                <Target className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-500">No upcoming passes detected for this location.</p>
              </div>
            )}
            
            {/* Cache Indicator */}
            {usingCachedPasses && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5 mt-2">
                <Database size={10} className="text-amber-500" />
                <span className="text-[10px] text-amber-500 font-mono">OFFLINE DATA</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}