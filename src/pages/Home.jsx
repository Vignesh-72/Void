import React, { useState, useEffect } from 'react';
import { getApod } from '../api/nasa';
import axios from 'axios';
import { Rocket, CalendarPlus, Info, Shield, Cpu, Code, Percent, Database, Satellite, Clock } from 'lucide-react';
import { CACHE_KEYS, CACHE_TTLS } from '../utils/cacheManager';

export default function Home({ cacheContext }) {
  const { updateCache, getCache, isCacheStale } = cacheContext;
  const [apod, setApod] = useState(null);
  const [nextLaunch, setNextLaunch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingCachedApod, setUsingCachedApod] = useState(false);
  const [usingCachedLaunch, setUsingCachedLaunch] = useState(false);
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTMinus = (date) => {
    if (!date) return "Calculating...";
    const diff = new Date(date) - now;
    if (diff < 0) return "Launched";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m ${secs}s`;
  };

  const addToCalendarUrl = (launch) => {
    if (!launch) return '#';
    const startTime = new Date(launch.date_utc).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTime = new Date(new Date(launch.date_utc).getTime() + 60*60*1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`${launch.name} Launch`);
    const details = encodeURIComponent(`Watch live: ${launch.links?.webcast || 'TBD'}`);
    const location = encodeURIComponent(launch.location || 'Space');
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  };

  const fetchHomeData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const cachedApod = getCache(CACHE_KEYS.APOD);
      const shouldFetchApod = forceRefresh || !cachedApod || isCacheStale(CACHE_KEYS.APOD);
      
      if (shouldFetchApod) {
        try {
          const apodRes = await getApod();
          const apodData = {
            title: apodRes.data.title,
            url: apodRes.data.url,
            explanation: apodRes.data.explanation,
            copyright: apodRes.data.copyright || "NASA",
            _fetchedAt: new Date().toISOString()
          };
          setApod(apodData);
          setUsingCachedApod(false);
          updateCache(CACHE_KEYS.APOD, apodData, { ttl: CACHE_TTLS.APOD });
        } catch (error) {
          if (cachedApod) {
            setApod({ ...cachedApod, _cached: true });
            setUsingCachedApod(true);
          } else {
             setApod({
              title: "Cosmic Exploration",
              url: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=2071&auto=format&fit=crop",
              explanation: "System offline. Showing default visualization of orbital mechanics.",
              copyright: "VOID System",
              _fallback: true
            });
          }
        }
      } else {
        setApod({ ...cachedApod, _cached: true });
        setUsingCachedApod(true);
      }

      const cachedLaunch = getCache(CACHE_KEYS.NEXT_LAUNCH);
      const shouldFetchLaunch = forceRefresh || !cachedLaunch || isCacheStale(CACHE_KEYS.NEXT_LAUNCH);
      
      if (shouldFetchLaunch) {
        try {
          const res = await axios.get('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&ordering=net');
          const currentTime = new Date();
          const validLaunch = res.data.results.find(launch => new Date(launch.net) > currentTime);

          if (validLaunch) {
            const launchData = {
              name: validLaunch.name,
              date_utc: validLaunch.net,
              mission: validLaunch.mission?.name,
              description: validLaunch.mission?.description,
              type: validLaunch.mission?.type || "Orbital Mission",
              orbit: validLaunch.mission?.orbit?.name || "Low Earth Orbit",
              provider: validLaunch.launch_service_provider?.name,
              location: validLaunch.pad?.location?.name,
              status: validLaunch.status?.name || "Scheduled",
              probability: validLaunch.probability,
              links: {
                patch: { small: validLaunch.image },
                webcast: validLaunch.vidURLs?.[0]?.url
              },
              _fetchedAt: new Date().toISOString()
            };
            setNextLaunch(launchData);
            setUsingCachedLaunch(false);
            updateCache(CACHE_KEYS.NEXT_LAUNCH, launchData, { ttl: CACHE_TTLS.NEXT_LAUNCH });
          } else if (cachedLaunch) {
            setNextLaunch({ ...cachedLaunch, _cached: true });
            setUsingCachedLaunch(true);
          } else {
            setNextLaunch(null);
          }
        } catch (error) {
          if (cachedLaunch) {
            setNextLaunch({ ...cachedLaunch, _cached: true });
            setUsingCachedLaunch(true);
          } else {
            setNextLaunch(null);
          }
        }
      } else {
        setNextLaunch({ ...cachedLaunch, _cached: true });
        setUsingCachedLaunch(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-lg text-slate-400 font-medium font-mono">
        INITIALIZING PROTOCOLS...
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-in fade-in duration-700">
      
      {/* HERO: APOD */}
      {/* FROSTED GLASS CONTAINER */}
      <section className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
        <div className="aspect-[21/9] relative overflow-hidden">
          <img 
            src={apod?.url} 
            alt={apod?.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-70 group-hover:opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-4 shadow-sm">
              <Satellite className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Astronomy Picture of the Day</span>
              {usingCachedApod && (
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full ml-2 border border-white/20">CACHED</span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg">{apod?.title}</h1>
            <p className="text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-2xl drop-shadow-md">{apod?.explanation}</p>
            {apod?.copyright && (
              <p className="text-xs text-slate-500 mt-4 font-mono uppercase tracking-widest">© {apod.copyright}</p>
            )}
          </div>
        </div>
      </section>

      {/* MISSION CONTROL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FROSTED GLASS CONTAINER */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Next Scheduled Launch</p>
                      {usingCachedLaunch && (
                        <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded border border-white/10">CACHED</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">
                      {nextLaunch?.name || "No upcoming launches"}
                    </h2>
                  </div>
                </div>
                {nextLaunch?.provider && (
                  <p className="text-slate-400 font-mono text-sm pl-16">{nextLaunch.provider}</p>
                )}
              </div>
              {nextLaunch && (
                <div className="flex gap-2">
                  <a
                    href={addToCalendarUrl(nextLaunch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all shadow-sm hover:shadow-md hover:border-white/20"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Calendar</span>
                  </a>
                </div>
              )}
            </div>

            {/* Launch Timeline */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Launch Date</p>
                  <p className="text-lg font-mono text-white">
                    {nextLaunch ? new Date(nextLaunch.date_utc).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    }) : 'TBD'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Launch Time</p>
                  <p className="text-lg font-mono text-white">
                    {nextLaunch ? new Date(nextLaunch.date_utc).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : '--:--'}
                  </p>
                </div>
                {/* Special White Glow for Countdown */}
                <div className="p-4 rounded-2xl bg-white/10 border border-white/20 relative overflow-hidden group shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                  <p className="text-xs text-white uppercase font-bold mb-1 animate-pulse">Countdown</p>
                  <div className="text-lg font-mono text-white drop-shadow-md">
                    {getTMinus(nextLaunch?.date_utc)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Status</p>
                  <span className="inline-flex items-center text-sm font-bold text-white">
                    {nextLaunch?.status || 'Scheduled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MISSION DETAILS */}
        {/* FROSTED GLASS CONTAINER */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl p-8">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
            <Satellite className="w-5 h-5 text-slate-300" />
            Mission Profile
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2 border-b border-white/5 pb-4">
              <p className="text-xs text-slate-400 uppercase font-bold">Target Orbit</p>
              <p className="text-lg font-mono text-white">
                {nextLaunch?.orbit || "Low Earth Orbit"}
              </p>
            </div>
            
            <div className="space-y-2 border-b border-white/5 pb-4">
              <p className="text-xs text-slate-400 uppercase font-bold">Mission Type</p>
              <p className="text-lg font-mono text-white">
                {nextLaunch?.type || "Orbital"}
              </p>
            </div>
            
            <div className="space-y-2 border-b border-white/5 pb-4">
              <p className="text-xs text-slate-400 uppercase font-bold">Launch Location</p>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                <p className="text-slate-300 text-sm">
                  {nextLaunch?.location || "Kennedy Space Center"}
                </p>
              </div>
            </div>

            {nextLaunch?.probability && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 uppercase font-bold">Launch Probability</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-slate-400 to-white shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                      style={{ width: `${nextLaunch.probability}%` }}
                    />
                  </div>
                  <span className="text-lg font-mono text-white flex items-center gap-1">
                    {nextLaunch.probability}%
                  </span>
                </div>
              </div>
            )}

            {nextLaunch?.links?.webcast && (
              <a
                href={nextLaunch.links.webcast}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl transition-all font-bold uppercase tracking-wider text-xs hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] backdrop-blur-sm"
              >
                <CalendarPlus className="w-4 h-4" />
                Watch Live Stream
              </a>
            )}
          </div>
        </div>
      </div>

      {/* PLATFORM INFORMATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FROSTED GLASS CONTAINER */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl p-8">
          <h3 className="text-xl font-black italic text-white mb-6">About VOID</h3>
          <p className="text-slate-300 mb-8 leading-relaxed font-light">
            VOID is an advanced open-source dashboard that aggregates real-time space data from NASA, 
            SpaceX, and global space agencies. Designed for enthusiasts and professionals alike, 
            it provides accurate telemetry and mission tracking in a unified interface.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Shield className="w-3 h-3 text-white" />
              Secure Connection
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Cpu className="w-3 h-3 text-white" />
              Real-time Data
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Code className="w-3 h-3 text-white" />
              Open Source
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Database className="w-3 h-3 text-white" />
              Smart Caching
            </span>
          </div>
        </div>

        {/* FROSTED GLASS CONTAINER */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl p-8">
          <h3 className="text-xl font-black italic text-white mb-6">Data Sources</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-sm font-black text-white">N</span>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">NASA API</p>
                  <p className="text-xs text-slate-400">Astronomy imagery & data</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded border border-white/10">ACTIVE</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">The Space Devs</p>
                  <p className="text-xs text-slate-400">Launch manifests & schedules</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded border border-white/10">ACTIVE</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Real-time Updates</p>
                  <p className="text-xs text-slate-400">Live tracking & predictions</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded border border-white/10">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}