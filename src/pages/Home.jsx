import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
  Rocket, Info, Shield, Clock, X, MapPin, ExternalLink, 
  Play, ChevronRight, Activity, Globe, Satellite, RefreshCw,
  Cpu, Calendar
} from 'lucide-react';
import { CACHE_KEYS, CACHE_TTLS } from '../utils/cacheManager';
import Loader from '../components/Loader';

// --- STOCK IMAGES ---
const STOCK_IMAGES = [
  '/img1.png', '/img2.jpg', '/img3.jpg', '/img4.jpg',
  '/img5.jpg', '/img6.jpg', '/img7.png', '/img9.jpg',
  '/img10.jpg', '/img11.jpg', '/img12.jpg'
];

// --- CUSTOM HOOK: SMART IMAGE LOADER ---
const useSmartImage = (url) => {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!url) { setSrc(null); return; }
    const img = new Image();
    img.src = url;
    img.onload = () => setSrc(url);
    img.onerror = () => setSrc(null);
  }, [url]);
  return src;
};

// --- COMPONENT: FEATURED LAUNCH CARD ---
const FeaturedLaunchCard = ({ launch, getTMinus, onClick }) => {
  if (!launch) return null;
  const verifiedImage = useSmartImage(launch.image);

  return (
    <div 
      onClick={onClick}
      className="lg:col-span-2 bg-[#0a0a0a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row cursor-pointer group hover:border-white/30 transition-all hover:bg-white/5 relative"
    >
      <div className="w-full md:w-1/3 h-48 md:h-auto relative shrink-0 overflow-hidden">
        {verifiedImage ? (
           <img 
             src={verifiedImage} 
             alt="" 
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
           />
        ) : (
           <div className="w-full h-full bg-blue-900/20 flex items-center justify-center">
             <Rocket className="w-12 h-12 text-blue-400" />
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent md:bg-gradient-to-r" />
        <div className="absolute top-3 right-3 md:top-4 md:left-4 md:right-auto bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg">
           <p className="text-[10px] text-blue-400 font-bold uppercase mb-0.5 animate-pulse">Live T-Minus</p>
           <p className="text-sm font-mono font-bold text-white tracking-tight">{getTMinus(launch.date_utc)}</p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center relative">
        <div className="flex items-center justify-between mb-2">
           <span className="inline-flex items-center gap-2 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
             <Rocket size={10} /> Upcoming Mission
           </span>
           <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" size={16} />
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-4 whitespace-normal break-words group-hover:text-blue-200 transition-colors">
          {launch.name || "Mission TBD"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-500 uppercase">Provider</p>
             <p className="text-xs md:text-sm text-white font-medium truncate">{launch.provider || "Unknown"}</p>
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-500 uppercase">Location</p>
             <p className="text-xs md:text-sm text-white font-medium leading-tight whitespace-normal">
               {launch.location?.split(',')[0] || "Unknown"}
             </p>
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-500 uppercase">Date</p>
             <p className="text-xs md:text-sm text-white font-medium truncate flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400"/>
                {launch.date_utc ? new Date(launch.date_utc).toLocaleDateString() : 'TBD'}
             </p>
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-500 uppercase">Rocket</p>
             <p className="text-xs md:text-sm text-white font-medium truncate">{launch.rocket_config || "Unknown"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: DETAIL MODAL ---
const LaunchDetailModal = ({ launch, onClose, getTMinus }) => {
  const [isModalImageLoaded, setIsModalImageLoaded] = useState(false);
  if (!launch) return null;

  let mapQuery = null;
  if (launch.pad?.latitude) mapQuery = `${launch.pad.latitude},${launch.pad.longitude}`;
  else if (launch.location) mapQuery = launch.location;
  
  // FIX: CLEANED UP URL & PARAMETERS
  const mapUrl = mapQuery 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=k&z=13&ie=UTF8&iwloc=&output=embed` 
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      
      <div 
        className="bg-[#0a0a0a] border border-white/20 rounded-3xl w-full max-w-5xl h-[90vh] md:h-[80vh] overflow-hidden shadow-2xl relative flex flex-col md:flex-row" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-white/20 rounded-full text-white border border-white/10 backdrop-blur-md transition-all"><X size={20} /></button>

        {/* LEFT SIDE: IMAGE */}
        <div className="w-full md:w-[40%] h-64 md:h-full relative bg-black shrink-0 border-b md:border-b-0 md:border-r border-white/10 group">
             <div className={`absolute inset-0 flex items-center justify-center bg-white/5 transition-opacity duration-500 ${isModalImageLoaded ? 'opacity-0' : 'opacity-100'}`}>
                <Rocket className="w-10 h-10 text-white/20 animate-pulse" />
             </div>
             <img 
               src={launch.image || STOCK_IMAGES[0]} 
               alt="" 
               className={`w-full h-full object-cover transition-all duration-1000 ${isModalImageLoaded ? 'opacity-80 group-hover:opacity-100' : 'opacity-0'}`} 
               onLoad={() => setIsModalImageLoaded(true)}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
             <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent md:bg-gradient-to-l" />

             <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="inline-flex items-center gap-2 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] font-bold text-blue-300 uppercase mb-3 animate-pulse">
                   <Clock size={12} /> Live Countdown
                </div>
                <p className="text-4xl md:text-5xl font-mono font-black text-white tracking-tighter shadow-black drop-shadow-2xl">
                  {getTMinus(launch.date_utc)}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-2">TARGET: {new Date(launch.date_utc).toLocaleDateString()}</p>
             </div>
        </div>

        {/* RIGHT SIDE: INFO */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-[#0a0a0a]">
          <div className="mb-8">
             <div className="flex flex-wrap items-center gap-2 mb-3">
               <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-1 rounded border border-white/10 uppercase tracking-wider">{launch.provider || 'UNKNOWN'}</span>
               <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${launch.status?.toLowerCase().includes('go') ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/10 text-slate-400 border-white/20'}`}>
                  {launch.status}
               </span>
             </div>
             <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter leading-none mb-4">{launch.name}</h2>
             <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-white/20 pl-4">
               {launch.description || "Classified payload. No mission description available."}
             </p>
          </div>

          <div className="mb-8">
             <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <Cpu size={14} className="text-blue-400"/> Flight Data
             </h3>
             <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-[#111] p-4">
                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Rocket</p>
                   <p className="text-xs md:text-sm text-white font-mono">{launch.rocket_config || "N/A"}</p>
                </div>
                <div className="bg-[#111] p-4">
                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Orbit</p>
                   <p className="text-xs md:text-sm text-white font-mono">{launch.orbit || "LEO"}</p>
                </div>
                <div className="bg-[#111] p-4">
                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Window Start</p>
                   <p className="text-xs md:text-sm text-white font-mono">{new Date(launch.date_utc).toLocaleTimeString()}</p>
                </div>
                <div className="bg-[#111] p-4">
                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Launch Pad</p>
                   <p className="text-xs md:text-sm text-white font-mono whitespace-normal break-words leading-tight">
                     {launch.pad?.name || "Unknown"}
                   </p>
                </div>
             </div>
          </div>

          <div className="mb-8">
             <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
               <MapPin size={14} className="text-green-400"/> Launch Complex
             </h3>
             {mapUrl ? (
                // FIX: Added 'overflow-hidden' and 'scale-110' to crop UI tags
                <div className="rounded-2xl overflow-hidden border border-white/10 h-48 bg-slate-900 relative group">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={mapUrl} 
                    frameBorder="0" 
                    scrolling="no" 
                    className="opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-110" 
                  />
                </div>
             ) : (
                <div className="h-32 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-xs text-slate-500">
                   NO SATELLITE DATA AVAILABLE
                </div>
             )}
             <p className="text-xs text-slate-500 mt-2 font-mono text-center">{launch.location}</p>
          </div>

          {launch.links?.webcast && (
            <a href={launch.links.webcast} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black hover:bg-blue-400 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
               <Play size={16} fill="currentColor" /> Watch Mission Webcast
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Home({ cacheContext }) {
  const { updateCache, getCache, isCacheStale, clearCache } = cacheContext;
  const cachedLaunch = getCache(CACHE_KEYS.NEXT_LAUNCH);
  const isLaunchStale = isCacheStale(CACHE_KEYS.NEXT_LAUNCH);

  const [heroImage, setHeroImage] = useState(STOCK_IMAGES[0]);
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);
  const [nextLaunch, setNextLaunch] = useState(cachedLaunch || null);
  const [loading, setLoading] = useState(!cachedLaunch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [selectedLaunch, setSelectedLaunch] = useState(null);
  const [userRegion, setUserRegion] = useState('Unknown Sector');
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    setHeroImage(STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)]);
    try { setUserRegion(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch (e) { setUserRegion('Global Proxy'); }
    setLatency(Math.floor(Math.random() * 40) + 12); 
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTMinus = (date) => {
    if (!date) return "00d 00h 00m 00s";
    const diff = new Date(date) - now;
    if (diff < 0) return "T+00:00:00"; 
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
    const m = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
    const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    return `${h}h ${m}m ${s}s`;
  };

  const fetchHomeData = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true); 
    else if (!nextLaunch) setLoading(true);

    try {
      if (forceRefresh || !cachedLaunch || isLaunchStale) {
        if(forceRefresh && clearCache) clearCache();

        const res = await axios.get('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&ordering=net');
        const results = res.data.results;
        const validLaunch = results.find(launch => new Date(launch.net) > new Date());
        
        if (validLaunch) {
            const randomStock = STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
            const launchData = {
                id: validLaunch.id,
                name: validLaunch.name,
                date_utc: validLaunch.net,
                provider: validLaunch.launch_service_provider?.name,
                status: validLaunch.status?.name || "Scheduled",
                location: validLaunch.pad?.location?.name,
                description: validLaunch.mission?.description,
                orbit: validLaunch.mission?.orbit?.name,
                rocket_config: validLaunch.rocket?.configuration?.name,
                pad: { latitude: validLaunch.pad?.latitude, longitude: validLaunch.pad?.longitude, name: validLaunch.pad?.name },
                image: validLaunch.image || randomStock,
                links: { webcast: validLaunch.vidURLs?.[0]?.url },
                _fetchedAt: new Date().toISOString()
            };

            setNextLaunch(launchData);
            updateCache(CACHE_KEYS.NEXT_LAUNCH, launchData, { ttl: CACHE_TTLS.NEXT_LAUNCH });
        }
      }
    } catch (error) { console.error("Fetch Failed:", error); } 
    finally { 
        setLoading(false); 
        setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchHomeData(); }, []);

  if (loading) return <Loader text="INITIALIZING MISSION CONTROL..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION */}
      <section className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 shadow-xl min-h-[300px] md:min-h-[400px]">
        <div className="absolute inset-0 bg-black">
          <div className={`absolute inset-0 flex items-center justify-center bg-white/5 transition-opacity duration-500 ${isHeroLoaded ? 'opacity-0' : 'opacity-100'}`}><Satellite className="w-12 h-12 text-white/20 animate-pulse" /></div>
          <img 
            src={heroImage} 
            alt=""
            className={`w-full h-full object-cover transition-all duration-1000 ease-in-out group-hover:scale-105 ${isHeroLoaded ? 'opacity-80' : 'opacity-0'}`}
            onLoad={() => setIsHeroLoaded(true)}
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
              MISSION CONTROL
            </h1>
            
            <p className="text-[10px] md:text-sm text-slate-300 font-mono leading-relaxed max-w-2xl drop-shadow-md opacity-80">
              Live feed established. Aggregating telemetry and visual data from orbital assets, deep-space probes, and terrestrial launch complexes.
            </p>
          </div>
        </div>
      </section>

      {/* 2. DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FEATURED LAUNCH CARD */}
        <FeaturedLaunchCard 
            launch={nextLaunch} 
            getTMinus={getTMinus} 
            onClick={() => setSelectedLaunch(nextLaunch)} 
        />

        {/* SYSTEM STATUS SIDEBAR */}
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-xl p-6 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Status</h3>
          </div>
          
          <div className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-2"><Globe size={12}/> Client Region</span>
              <span className="text-white font-mono uppercase truncate max-w-[120px]" title={userRegion}>{userRegion}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-2"><Activity size={12}/> Uplink Latency</span>
              <span className="text-green-400 font-mono font-bold">{latency}ms</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-2"><Clock size={12}/> Local Sync</span>
              <span className="text-white font-mono">{now.toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex gap-2 overflow-x-auto no-scrollbar">
            <button 
                onClick={() => fetchHomeData(true)} 
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white border border-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
               <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} /> 
               {isRefreshing ? 'REFRESHING...' : 'REFRESH'}
            </button>
            <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 border border-white/5 whitespace-nowrap">v1.0 Stable</span>
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