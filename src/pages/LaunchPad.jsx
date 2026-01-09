import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Rocket, MapPin, Calendar, Clock, Satellite, Info, ChevronRight, Target, Filter, Search, AlertCircle, ExternalLink, TrendingUp, RefreshCw, Image } from 'lucide-react';

export default function LaunchPad({ cacheContext }) {
  const { updateCache, getCache, isCacheStale, clearCache } = cacheContext || {};
  
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgency, setFilterAgency] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [launches, setLaunches] = useState([]);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());

  const CACHE_KEY = 'launch_manifest';
  const CACHE_TTL = 15 * 60 * 1000;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const normalizeData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') return Object.values(data);
    return [];
  };

  const fetchManifest = async (forceRefresh = false) => {
    if (!getCache) return;

    try {
      if (!forceRefresh) setLoading(true);
      else setIsRefreshing(true);

      const cachedData = getCache(CACHE_KEY);
      const isStale = isCacheStale ? isCacheStale(CACHE_KEY) : true;

      if (!forceRefresh && cachedData && !isStale) {
        const normalized = normalizeData(cachedData);
        if (normalized.length > 0) {
          setLaunches(normalized);
          setUsingCachedData(true);
          setLastFetchTime(normalized[0]?._fetchedAt || new Date().toISOString());
          setLoading(false);
          return;
        }
      }

      const res = await axios.get('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=30&ordering=net');
      
      if (res.data && Array.isArray(res.data.results)) {
        const currentTime = new Date();
        const fetchTime = new Date().toISOString();

        const validLaunches = res.data.results
          .filter(l => l.net && new Date(l.net) > currentTime)
          .map(l => ({
            ...l,
            _fetchedAt: fetchTime
          }));

        setLaunches(validLaunches);
        setUsingCachedData(false);
        setLastFetchTime(fetchTime);
        setFailedImages(new Set());

        if (updateCache) {
          updateCache(CACHE_KEY, validLaunches, { ttl: CACHE_TTL });
        }
      }

    } catch (err) {
      console.error("Manifest Fetch Error", err);
      const cachedData = getCache(CACHE_KEY);
      if (cachedData) {
        const normalized = normalizeData(cachedData);
        setLaunches(normalized);
        setUsingCachedData(true);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, []);

  const handleRefresh = () => {
    if (clearCache) clearCache(CACHE_KEY);
    fetchManifest(true);
  };

  const handleImageError = (id) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  const filteredLaunches = useMemo(() => {
    let result = [...launches];
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(l => 
        (l.name || '').toLowerCase().includes(lowerTerm) ||
        (l.launch_service_provider?.name || '').toLowerCase().includes(lowerTerm) ||
        (l.mission?.name || '').toLowerCase().includes(lowerTerm)
      );
    }
    if (filterAgency !== 'all') {
      result = result.filter(l => 
        (l.launch_service_provider?.name || '').toLowerCase().includes(filterAgency.toLowerCase())
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'agency': return (a.launch_service_provider?.name || '').localeCompare(b.launch_service_provider?.name || '');
        default: return new Date(a.net) - new Date(b.net);
      }
    });
    return result;
  }, [launches, searchTerm, filterAgency, sortBy]);

  const agencies = useMemo(() => {
    const set = new Set(launches.map(l => l.launch_service_provider?.name).filter(Boolean));
    return Array.from(set).sort();
  }, [launches]);

  const getTMinus = (dateString) => {
    if (!dateString) return "TBD";
    const diff = new Date(dateString) - now;
    if (diff < 0) return "LAUNCHED";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    return `${hours}h ${mins}m ${secs}s`;
  };

  // MONOCHROME GLASS STATUS BADGES
  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('go') || s.includes('green')) return 'bg-white/10 text-white border-white/20';
    if (s.includes('hold') || s.includes('red')) return 'bg-white/5 text-slate-400 border-white/10';
    return 'bg-white/5 text-slate-300 border-white/10';
  };

  const getAgencyColor = (name) => {
    return 'bg-white/5 text-white border-white/10'; // Unified glass style
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
      <p className="mt-6 font-mono text-lg text-slate-400 animate-pulse">&gt; LOADING MANIFEST...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter">
            LAUNCH MANIFEST
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2 font-light">
            {usingCachedData ? 'OFFLINE DATABASE' : 'LIVE UPLINK'} 
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 border border-white/10">
              {new Date(lastFetchTime).toLocaleTimeString()}
            </span>
          </p>
        </div>
        
        {/* STATS - FROSTED GLASS */}
        <div className="flex gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <Rocket size={12} className="text-white" /> Total
            </div>
            <p className="text-2xl font-bold text-white mt-1">{launches.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <TrendingUp size={12} className="text-white" /> 24h
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {launches.filter(l => (new Date(l.net) - now) < 86400000).length}
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 hover:border-white/20 transition-all group disabled:opacity-50"
          >
            <RefreshCw size={20} className={`text-white ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
      </div>

      {/* FILTER BAR - FROSTED GLASS */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search missions..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors placeholder-slate-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={filterAgency}
            onChange={e => setFilterAgency(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white appearance-none focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
          >
            <option value="all" className="bg-black text-white">All Agencies</option>
            {agencies.map(a => <option key={a} value={a} className="bg-black text-white">{a}</option>)}
          </select>
        </div>
        <div className="relative">
          <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white appearance-none focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
          >
            <option value="time" className="bg-black text-white">Sort by Time</option>
            <option value="name" className="bg-black text-white">Sort by Name</option>
            <option value="agency" className="bg-black text-white">Sort by Agency</option>
          </select>
        </div>
      </div>

      {/* LAUNCH GRID */}
      <div className="grid grid-cols-1 gap-6">
        {filteredLaunches.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 border-dashed">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No launches match your filters.</p>
          </div>
        ) : (
          filteredLaunches.map(launch => {
            const isExpanded = expandedId === launch.id;
            const hasImageError = failedImages.has(launch.id);
            const progress = Math.max(0, Math.min(100, 100 - ((new Date(launch.net) - now) / (1000 * 60 * 60 * 24 * 7)) * 100));

            return (
              <div 
                key={launch.id}
                onClick={() => setExpandedId(isExpanded ? null : launch.id)}
                className={`
                  relative group overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
                  backdrop-blur-md shadow-lg
                  ${isExpanded 
                    ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }
                `}
              >
                {/* Progress Bar - White/Gray Gradient */}
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-slate-500 to-white transition-all duration-1000 opacity-30" 
                  style={{ width: `${progress}%` }} 
                />

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* ICON / IMAGE */}
                    <div className="flex items-start gap-4 flex-shrink-0">
                      <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-inner">
                        {launch.image && !hasImageError ? (
                          <img 
                            src={launch.image} 
                            alt="Rocket" 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale hover:grayscale-0 duration-500"
                            onError={() => handleImageError(launch.id)}
                          />
                        ) : (
                          <Rocket className="text-slate-500" size={32} />
                        )}
                        
                        {launch.probability !== null && (
                          <div className="absolute bottom-0 w-full bg-black/80 backdrop-blur text-[10px] text-center py-0.5 text-white font-bold border-t border-white/10">
                            {launch.probability}% PROB
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile Title View */}
                      <div className="lg:hidden flex-1">
                        <div className="flex gap-2 mb-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getAgencyColor(launch.launch_service_provider?.name)}`}>
                             {launch.launch_service_provider?.abbrev || 'UNK'}
                           </span>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(launch.status?.name)}`}>
                             {launch.status?.abbrev || 'TBD'}
                           </span>
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight">{launch.name}</h3>
                      </div>
                    </div>

                    {/* MAIN INFO (Desktop) */}
                    <div className="hidden lg:block flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getAgencyColor(launch.launch_service_provider?.name)}`}>
                          {launch.launch_service_provider?.name || 'Unknown Agency'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getStatusColor(launch.status?.name)}`}>
                          {launch.status?.name || 'Status TBD'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-slate-200 transition-colors truncate">
                        {launch.name}
                      </h3>
                      <div className="flex gap-4 mt-2 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5"><Rocket size={12}/> {launch.rocket?.configuration?.name}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={12}/> {launch.pad?.location?.name?.split(',')[0]}</span>
                        {launch.mission?.orbit && <span className="flex items-center gap-1.5"><Satellite size={12}/> {launch.mission.orbit.name}</span>}
                      </div>
                    </div>

                    {/* RIGHT: COUNTDOWN */}
                    <div className="lg:w-48 flex-shrink-0 text-right">
                       <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Target Launch</p>
                       <p className="font-mono text-sm text-white mb-2">
                         {new Date(launch.net).toLocaleDateString()} <span className="text-slate-600">|</span> {new Date(launch.net).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                       </p>
                       <p className="text-[10px] font-bold text-white uppercase mb-0.5 animate-pulse">T-Minus</p>
                       <p className="font-mono text-2xl font-bold text-white tabular-nums leading-none drop-shadow-md">
                         {getTMinus(launch.net)}
                       </p>
                    </div>
                  </div>

                  {/* EXPANDED DETAILS - GLASS REVEAL */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                            <Info size={14}/> Mission Briefing
                          </h4>
                          <p className="text-sm text-slate-300 leading-relaxed font-light">
                            {launch.mission?.description || "Classified or unavailable mission details."}
                          </p>
                        </div>
                        
                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">LAUNCH PAD</span>
                            <span className="text-white text-right">{launch.pad?.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">ORBITAL REGIME</span>
                            <span className="text-white text-right">{launch.mission?.orbit?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">WINDOW START</span>
                            <span className="text-white text-right">{launch.window_start ? new Date(launch.window_start).toLocaleTimeString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {launch.vidURLs?.[0]?.url && (
                        <div className="mt-6 flex justify-end">
                          <a 
                            href={launch.vidURLs[0].url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={14} /> Watch Webcast
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* EXPAND HINT */}
                {!isExpanded && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="rotate-90 text-white" size={20} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}