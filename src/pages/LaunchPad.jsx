import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Rocket, MapPin, Info, ChevronRight, Target, Filter, Search, AlertCircle, ExternalLink, TrendingUp, RefreshCw, ChevronDown, Satellite, Check, Calendar, History } from 'lucide-react';
import Loader from '../components/Loader';

// --- CUSTOM SELECT COMPONENT ---
const CustomSelect = ({ value, onChange, options, icon: Icon, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || value;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-black/40 border ${isOpen ? 'border-white/50' : 'border-white/10'} rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-all font-medium flex items-center justify-between group hover:bg-white/5`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between border-b border-white/5 last:border-0
                ${value === opt.value ? 'bg-white/20 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              {opt.label}
              {value === opt.value && <Check className="w-3 h-3 text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function LaunchPad({ cacheContext }) {
  const { updateCache, getCache, isCacheStale, clearCache } = cacheContext || {};
  
  // --- STATE ---
  const [viewMode, setViewMode] = useState('upcoming'); 
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [now, setNow] = useState(new Date());
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgency, setFilterAgency] = useState('all');
  const [sortBy, setSortBy] = useState('time'); 
  const [failedImages, setFailedImages] = useState(new Set());

  const CACHE_KEY = `launch_manifest_${viewMode}`;
  const CACHE_TTL = 15 * 60 * 1000; 

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- DATA FETCHING ---
  const fetchManifest = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const cached = getCache ? getCache(CACHE_KEY) : null;
      const isStale = isCacheStale ? isCacheStale(CACHE_KEY) : true;

      // Use Cache if valid
      if (!forceRefresh && cached && !isStale) {
        const cachedList = Array.isArray(cached) ? cached : Object.values(cached);
        const filteredCache = viewMode === 'upcoming' 
          ? cachedList.filter(l => new Date(l.net).getTime() > Date.now()) 
          : cachedList;

        setLaunches(filteredCache);
        setUsingCachedData(true);
        setLastFetchTime(cached._fetchedAt);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Fetch Fresh Data
      const endpoint = viewMode === 'upcoming' 
        ? 'https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=30&ordering=net'
        : 'https://lldev.thespacedevs.com/2.2.0/launch/previous/?limit=30&ordering=-net';

      const res = await axios.get(endpoint);
      
      if (res.data && Array.isArray(res.data.results)) {
        const fetchTime = new Date().toISOString();
        const nowMs = Date.now();

        const validLaunches = res.data.results
          .filter(l => {
            if (viewMode === 'upcoming') {
              return new Date(l.net).getTime() > nowMs;
            }
            return true;
          })
          .map(l => ({ ...l, _fetchedAt: fetchTime }));

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
      if (getCache) {
        const cached = getCache(CACHE_KEY);
        if (cached) {
          setLaunches(Array.isArray(cached) ? cached : Object.values(cached));
          setUsingCachedData(true);
        }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLaunches([]); 
    setLoading(true); 
    setFailedImages(new Set());
    setExpandedId(null);
    fetchManifest();
  }, [viewMode]);

  const handleRefresh = () => {
    if (clearCache) clearCache(CACHE_KEY);
    fetchManifest(true);
  };

  const handleImageError = (id) => {
    setFailedImages(prev => new Set(prev).add(id));
  };

  // --- FILTERING & SORTING ---
  const filteredLaunches = useMemo(() => {
    let result = [...launches];
    
    if (viewMode === 'upcoming') {
      const nowMs = Date.now();
      result = result.filter(l => new Date(l.net).getTime() > nowMs);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l => 
        (l.name || '').toLowerCase().includes(term) ||
        (l.launch_service_provider?.name || '').toLowerCase().includes(term) ||
        (l.mission?.name || '').toLowerCase().includes(term)
      );
    }
    if (filterAgency !== 'all') {
      result = result.filter(l => 
        (l.launch_service_provider?.name || '').toLowerCase().includes(filterAgency.toLowerCase())
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'agency') return (a.launch_service_provider?.name || '').localeCompare(b.launch_service_provider?.name || '');
      
      if (viewMode === 'upcoming') return new Date(a.net) - new Date(b.net);
      return new Date(b.net) - new Date(a.net);
    });
    return result;
  }, [launches, searchTerm, filterAgency, sortBy, viewMode]);

  const agencyOptions = useMemo(() => {
    const unique = new Set(launches.map(l => l.launch_service_provider?.name).filter(Boolean));
    const opts = Array.from(unique).sort().map(name => ({ value: name, label: name }));
    return [{ value: 'all', label: 'All Agencies' }, ...opts];
  }, [launches]);

  const sortOptions = [
    { value: 'time', label: viewMode === 'upcoming' ? 'Soonest Launch' : 'Most Recent' },
    { value: 'name', label: 'Mission Name' },
    { value: 'agency', label: 'Launch Agency' },
  ];

  // Helpers
  const getTMinus = (dateString) => {
    if (!dateString) return "TBD";
    const diff = new Date(dateString) - now;
    const isPast = diff < 0;
    
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((absDiff / (1000 * 60)) % 60);
    
    if (viewMode === 'past' || isPast) {
      if (days > 365) return `${Math.floor(days/365)} YEARS AGO`;
      if (days > 30) return `${Math.floor(days/30)} MONTHS AGO`;
      if (days > 0) return `${days} DAYS AGO`;
      return `${hours}H ${mins}M AGO`;
    }
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    return `${hours}h ${mins}m ${Math.floor((absDiff/1000)%60)}s`;
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('success')) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (s.includes('fail')) return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (s.includes('go') || s.includes('green')) return 'bg-white/20 text-white border-white/30'; 
    return 'bg-white/10 text-slate-300 border-white/10';
  };

  const getAgencyColor = () => 'bg-white/10 text-white border-white/20';

  if (loading || (isRefreshing && !launches.length)) {
    return <Loader text={`LOADING ${viewMode === 'upcoming' ? 'MANIFEST' : 'ARCHIVES'}...`} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER & TOGGLE */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter">
            {viewMode === 'upcoming' ? 'LAUNCH MANIFEST' : 'MISSION ARCHIVE'}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-slate-400 text-sm font-light">
              {usingCachedData ? 'OFFLINE DATABASE' : 'LIVE UPLINK'} 
            </p>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 border border-white/10 font-mono">
              UPDATED: {lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString() : '--:--'}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          {/* VIEW TOGGLE */}
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
            <button 
              onClick={() => setViewMode('upcoming')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 
                ${viewMode === 'upcoming' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Rocket size={14} /> Upcoming
            </button>
            <button 
              onClick={() => setViewMode('past')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 
                ${viewMode === 'past' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <History size={14} /> Past Missions
            </button>
          </div>

          <div className="flex gap-2">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 min-w-[100px] flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Total Loaded
              </div>
              <p className="text-lg font-bold text-white font-mono leading-none">{launches.length}</p>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 hover:bg-white/10 hover:border-white/20 transition-all group disabled:opacity-50 flex items-center justify-center"
            >
              <RefreshCw size={20} className={`text-white ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-lg z-20 relative">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          <input 
            type="text" 
            placeholder="Search missions..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-black/60 transition-all placeholder-slate-500 font-medium"
          />
        </div>

        <CustomSelect 
          icon={Filter}
          value={filterAgency}
          onChange={setFilterAgency}
          options={agencyOptions}
        />

        <CustomSelect 
          icon={Target}
          value={sortBy}
          onChange={setSortBy}
          options={sortOptions}
        />
      </div>

      {/* LAUNCH GRID */}
      <div className="grid grid-cols-1 gap-6 z-0 relative">
        {filteredLaunches.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 border-dashed">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 font-mono text-sm">NO DATA FOUND IN ARCHIVES.</p>
          </div>
        ) : (
          filteredLaunches.map(launch => {
            const isExpanded = expandedId === launch.id;
            const hasImageError = failedImages.has(launch.id);
            const progress = viewMode === 'past' ? 100 : Math.max(0, Math.min(100, 100 - ((new Date(launch.net) - now) / (1000 * 60 * 60 * 24 * 7)) * 100));

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
                <div 
                  className={`absolute bottom-0 left-0 h-[2px] transition-all duration-1000 opacity-50 ${viewMode === 'past' ? 'bg-white' : 'bg-white'}`} 
                  style={{ width: `${progress}%` }} 
                />

                <div className="p-5 md:p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    <div className="flex items-start gap-4 flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-inner shrink-0">
                        {launch.image && !hasImageError ? (
                          <img 
                            src={launch.image} 
                            alt="Rocket" 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale hover:grayscale-0 duration-500"
                            onError={() => handleImageError(launch.id)}
                          />
                        ) : (
                          <Rocket className="text-slate-500" size={28} />
                        )}
                        {(launch.status?.abbrev === 'Success' || launch.status?.abbrev === 'Go') && (
                          <div className={`absolute inset-0 flex items-center justify-center ${viewMode === 'past' ? 'bg-green-500/20' : 'bg-white/10'}`}>
                            {viewMode === 'past' ? <Check className="text-green-400 drop-shadow-md" size={24} /> : <Rocket className="text-white drop-shadow-md" size={24} />}
                          </div>
                        )}
                      </div>
                      
                      <div className="lg:hidden flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getAgencyColor()}`}>
                             {launch.launch_service_provider?.abbrev || 'UNK'}
                           </span>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(launch.status?.name)}`}>
                             {launch.status?.abbrev || 'TBD'}
                           </span>
                        </div>
                        {/* FIX: Conditional wrap/truncate */}
                        <h3 className={`text-lg font-bold text-white leading-tight ${isExpanded ? 'whitespace-normal' : 'truncate'}`}>
                          {launch.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-1">
                           {viewMode === 'past' ? 'LAUNCHED:' : 'T-MINUS:'} {getTMinus(launch.net)}
                        </p>
                      </div>
                    </div>

                    <div className="hidden lg:block flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getAgencyColor()}`}>
                          {launch.launch_service_provider?.name || 'Unknown Agency'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getStatusColor(launch.status?.name)}`}>
                          {launch.status?.name || 'Status TBD'}
                        </span>
                      </div>
                      {/* FIX: Conditional wrap/truncate */}
                      <h3 className={`text-xl font-bold text-white group-hover:text-slate-200 transition-colors ${isExpanded ? 'whitespace-normal' : 'truncate'}`}>
                        {launch.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5"><Rocket size={12}/> {launch.rocket?.configuration?.name}</span>
                        <span className="flex items-center gap-1.5 truncate max-w-[200px]"><MapPin size={12}/> {launch.pad?.location?.name?.split(',')[0]}</span>
                        {launch.mission?.orbit && <span className="flex items-center gap-1.5"><Satellite size={12}/> {launch.mission.orbit.name}</span>}
                      </div>
                    </div>

                    <div className="hidden lg:block w-48 flex-shrink-0 text-right">
                       <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                         {viewMode === 'past' ? 'Launched On' : 'Target Launch'}
                       </p>
                       <p className="font-mono text-sm text-white mb-2">
                         {new Date(launch.net).toLocaleDateString()}
                       </p>
                       <p className="text-[10px] font-bold text-white uppercase mb-0.5 animate-pulse">
                         {viewMode === 'past' ? 'Mission Status' : 'T-Minus'}
                       </p>
                       <p className={`font-mono text-xl font-bold tabular-nums leading-none drop-shadow-md ${viewMode === 'past' ? 'text-slate-300' : 'text-white'}`}>
                         {getTMinus(launch.net)}
                       </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-2 fade-in duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <Info size={14}/> Mission Briefing
                          </h4>
                          <p className="text-sm text-slate-300 leading-relaxed font-light break-words">
                            {launch.mission?.description || "Classified or unavailable mission details."}
                          </p>
                        </div>
                        
                        <div className="space-y-3 font-mono text-xs">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">LAUNCH PAD</span>
                            <span className="text-white text-right truncate max-w-[60%]">{launch.pad?.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">ORBITAL REGIME</span>
                            <span className="text-white text-right">{launch.mission?.orbit?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-slate-500">EXACT TIME</span>
                            <span className="text-white text-right">{new Date(launch.net).toLocaleTimeString()}</span>
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
                            <ExternalLink size={14} /> Watch Replay / Stream
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {!isExpanded && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="rotate-90 text-slate-500" size={16} />
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