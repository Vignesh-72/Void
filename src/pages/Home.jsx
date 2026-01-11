import React, { useState, useEffect } from 'react';
// FIX: Import createPortal to break out of the z-index stack
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Rocket, CalendarPlus, Info, Shield, Cpu, Code, Database, Satellite, Clock, RefreshCw, X, MapPin, ExternalLink, Play, ChevronRight } from 'lucide-react';
import { CACHE_KEYS, CACHE_TTLS } from '../utils/cacheManager';
import Loader from '../components/Loader';

// --- CONSTANTS ---
const PRIMARY_SOURCE = {
  title: "Deep Field Observation",
  url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2011&auto=format&fit=crop",
  explanation: "Real-time visual feed from deep space observation outposts. This imagery captures the dense nebulosity and star formation regions in the outer spiral arms.",
  copyright: "VOID Network",
  _isLocal: false
};

const FALLBACK_SOURCE = {
  title: "System Offline",
  url: "/fallbackimage.png", 
  explanation: "Unable to establish uplink. Displaying locally cached system assets.",
  copyright: "Local System",
  _isLocal: true
};

// --- MODAL COMPONENT ---
const LaunchDetailModal = ({ launch, onClose, getTMinus }) => {
  if (!launch) return null;

  let mapQuery = null;
  if (launch.pad?.latitude && launch.pad?.longitude) {
    mapQuery = `${launch.pad.latitude},${launch.pad.longitude}`;
  } else if (launch.location) {
    mapQuery = launch.location;
  }

  const mapUrl = mapQuery 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=k&z=13&ie=UTF8&iwloc=&output=embed`
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      
      <div 
        className="bg-[#0a0a0a] border border-white/20 rounded-2xl md:rounded-3xl w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col md:flex-row" 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-50 p-2 bg-black/60 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10 backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* SECTION 1: IMAGE & ACTIONS */}
        <div className="w-full md:w-1/3 bg-white/5 border-b md:border-b-0 md:border-r border-white/10 p-5 md:p-6 flex flex-col order-first md:order-last relative">
          <div className="relative aspect-video md:aspect-auto md:flex-1 rounded-xl overflow-hidden bg-black border border-white/10 mb-4 md:mb-6 group">
            {launch.image ? (
              <img 
                src={launch.image} 
                alt="Rocket" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <Rocket className="w-12 h-12 text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-[10px] font-bold text-blue-400 uppercase mb-0.5 animate-pulse">Live Countdown</p>
              <p className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tighter shadow-black drop-shadow-md">
                {getTMinus(launch.date_utc)}
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            {launch.links?.webcast && (
              <a 
                href={launch.links.webcast} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Play size={14} fill="currentColor" /> Watch Stream
              </a>
            )}
            <a 
              href={`https://www.google.com/search?q=${encodeURIComponent(launch.name + ' launch')}`}
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              <ExternalLink size={14} /> Mission Info
            </a>
          </div>
        </div>

        {/* SECTION 2: INFO & MAP */}
        <div className="w-full md:w-2/3 p-5 md:p-8 space-y-6 md:space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                {launch.provider || 'Unknown Provider'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${launch.status?.toLowerCase().includes('go') ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/10 text-slate-300 border-white/20'}`}>
                {launch.status}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter leading-tight mb-2">
              {launch.name}
            </h2>
            <p className="text-slate-400 font-mono text-xs">
              <Clock className="w-3 h-3 inline mr-1.5" />
              {new Date(launch.date_utc).toLocaleString(undefined, { 
                weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
              <Info size={14} /> Mission Briefing
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              {launch.description || "No specific mission details available for this launch."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Orbit</p>
              <p className="text-white font-mono text-sm break-words leading-tight">
                {launch.orbit || "Unknown"}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Rocket</p>
              <p className="text-white font-mono text-sm break-words leading-tight">
                {launch.rocket_config || "Unknown"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
              <MapPin size={14} /> Launch Site
            </h3>
            
            {mapUrl ? (
              <div className="rounded-xl overflow-hidden border border-white/10 h-48 md:h-56 bg-slate-900 relative group">
                <iframe 
                  width="100%" 
                  style={{ height: '120%' }}
                  src={mapUrl} 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight="0" 
                  marginWidth="0" 
                  title="Launch Pad Map"
                  className="opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0 duration-500 relative -top-[10%]"
                />
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1 border border-white/10 pointer-events-none">
                  Live Satellite View
                </div>
              </div>
            ) : (
              <div className="h-32 bg-white/5 rounded-xl flex flex-col items-center justify-center border border-white/10 text-center p-4">
                <MapPin className="w-6 h-6 text-slate-600 mb-2" />
                <p className="text-xs text-slate-500">Map data unavailable for this site.</p>
              </div>
            )}
            <p className="text-xs text-slate-500 truncate">{launch.location}</p>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Home({ cacheContext }) {
  const { updateCache, getCache, isCacheStale } = cacheContext;

  const cachedLaunch = getCache(CACHE_KEYS.NEXT_LAUNCH);
  const isLaunchStale = isCacheStale(CACHE_KEYS.NEXT_LAUNCH);

  const [apod, setApod] = useState(PRIMARY_SOURCE);
  const [nextLaunch, setNextLaunch] = useState(cachedLaunch || null);
  const [loading, setLoading] = useState(!cachedLaunch);
  const [now, setNow] = useState(new Date());
  
  const [selectedLaunch, setSelectedLaunch] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTMinus = (date) => {
    if (!date) return "00d 00h 00m 00s";
    const diff = new Date(date) - now;
    if (diff < 0) return "LAUNCHED";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m ${secs}s`;
  };

  const fetchHomeData = async (forceRefresh = false) => {
    if (!nextLaunch) setLoading(true);

    try {
      if (forceRefresh || !cachedLaunch || isLaunchStale) {
        try {
          const res = await axios.get('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&ordering=net');
          const validLaunch = res.data.results.find(launch => new Date(launch.net) > new Date());

          if (validLaunch) {
            const launchData = {
              name: validLaunch.name,
              date_utc: validLaunch.net,
              provider: validLaunch.launch_service_provider?.name,
              status: validLaunch.status?.name || "Scheduled",
              location: validLaunch.pad?.location?.name,
              description: validLaunch.mission?.description,
              orbit: validLaunch.mission?.orbit?.name,
              rocket_config: validLaunch.rocket?.configuration?.name,
              pad: {
                latitude: validLaunch.pad?.latitude,
                longitude: validLaunch.pad?.longitude,
                name: validLaunch.pad?.name
              },
              image: validLaunch.image,
              links: { webcast: validLaunch.vidURLs?.[0]?.url },
              _fetchedAt: new Date().toISOString()
            };
            setNextLaunch(launchData);
            updateCache(CACHE_KEYS.NEXT_LAUNCH, launchData, { ttl: CACHE_TTLS.NEXT_LAUNCH });
          } 
        } catch (error) {
          console.error("Launch Fetch Failed:", error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading) return <Loader text="INITIALIZING MISSION CONTROL..." />;

  const displayApod = apod;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION */}
      <section className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 shadow-xl min-h-[300px] md:min-h-[400px]">
        <div className="absolute inset-0 bg-black">
          <img 
            src={displayApod.url} 
            alt={displayApod.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pointer-events-none">
          <div className="max-w-4xl pointer-events-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-2 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                <Satellite size={12} /> Deep Space Feed
              </span>
            </div>
            <h1 className="text-xl md:text-3xl font-black text-white mb-2 leading-tight drop-shadow-lg">
              {displayApod.title}
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl drop-shadow-md line-clamp-3">
              {displayApod.explanation}
            </p>
          </div>
        </div>
      </section>

      {/* 2. DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NEXT LAUNCH CARD */}
        <div 
          onClick={() => setSelectedLaunch(nextLaunch)}
          className="lg:col-span-2 bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col cursor-pointer group hover:border-white/30 transition-all hover:bg-white/5"
        >
          <div className="p-5 flex-1 flex flex-col justify-center">
            
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                  <Rocket className="w-6 h-6 text-blue-400" />
                </div>
                <div className="min-w-0">
                  {/* CHANGED TEXT TO "Upcoming Launch" */}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Upcoming Launch</p>
                  <h2 className="text-xl font-bold text-white leading-tight truncate group-hover:text-blue-200 transition-colors">
                    {nextLaunch?.name || "TBD"}
                  </h2>
                </div>
              </div>
              <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Provider</p>
                <p className="text-xs text-white truncate font-medium">{nextLaunch?.provider || "Unknown"}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Location</p>
                <p className="text-xs text-white truncate font-medium">{nextLaunch?.location?.split(',')[0] || "Unknown"}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Date</p>
                <p className="text-xs text-white truncate font-medium">
                  {nextLaunch ? new Date(nextLaunch.date_utc).toLocaleDateString() : 'TBD'}
                </p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/20 blur-xl rounded-full"></div>
                <p className="text-[10px] text-blue-400 uppercase font-bold animate-pulse mb-1">T-Minus</p>
                <p className="text-xs text-white font-mono font-bold">{getTMinus(nextLaunch?.date_utc)}</p>
              </div>
            </div>

          </div>
        </div>

        {/* PLATFORM INFO */}
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-xl p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Status</h3>
          </div>
          
          <div className="space-y-3">
            {/* DYNAMIC SYSTEM STATUS */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Deep Space Link</span>
              <span className={`font-bold ${apod ? 'text-green-400' : 'text-red-400'}`}>
                {apod ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Launch DB</span>
              <span className={`font-bold ${nextLaunch ? 'text-green-400' : 'text-red-400'}`}>
                {nextLaunch ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Time Sync</span>
              <span className="text-white font-mono">{now.toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex gap-2 overflow-x-auto no-scrollbar">
            {/* CHANGED TO v1.0 Stable */}
            <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 border border-white/5 whitespace-nowrap">v1.0 Stable</span>
            <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 border border-white/5 whitespace-nowrap">Secure</span>
            <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 border border-white/5 whitespace-nowrap">Cached</span>
          </div>
        </div>

      </div>

      {/* DETAIL MODAL */}
      {selectedLaunch && (
        <LaunchDetailModal 
          launch={selectedLaunch} 
          onClose={() => setSelectedLaunch(null)} 
          getTMinus={getTMinus}
        />
      )}

    </div>
  );
}