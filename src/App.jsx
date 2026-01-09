import React, { useState, useEffect, useCallback } from 'react';
import { Rocket, Map, Newspaper, House, Database, Settings as SettingsIcon, User } from 'lucide-react';
import Home from './pages/Home';
import LaunchPad from './pages/LaunchPad';
import OrbitTracker from './pages/OrbitTracker';
import News from './pages/News';
import Assets from './pages/Assets';
import Settings from './pages/Settings';
import About from './pages/About';
import { createCacheManager, CACHE_KEYS, CACHE_TTLS } from './utils/cacheManager';

const cacheManager = createCacheManager();

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [cacheStats, setCacheStats] = useState({ totalItems: 0, memoryUsage: '0 KB' });
  const [isNavHovered, setIsNavHovered] = useState(false);

  // --- CACHE LOGIC ---
  useEffect(() => {
    const updateStats = () => {
      setCacheStats({
        totalItems: cacheManager.getAllKeys().length,
        memoryUsage: calculateMemoryUsage()
      });
    };
    updateStats();
    const interval = setInterval(updateStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const calculateMemoryUsage = () => {
    try {
      let totalSize = 0;
      cacheManager.getAllKeys().forEach(key => {
        const cached = cacheManager.get(key);
        if (cached) totalSize += JSON.stringify(cached.data).length;
      });
      return `${(totalSize / 1024).toFixed(2)} KB`;
    } catch { return 'Unknown'; }
  };

  const updateCache = useCallback((section, data, options = {}) => {
    const { ttl, key = section } = options;
    let cacheTtl = ttl || CACHE_TTLS.ASSETS; 
    cacheManager.set(key, data, cacheTtl);
    setCacheStats(prev => ({ ...prev, totalItems: cacheManager.getAllKeys().length }));
  }, []);

  const getCache = useCallback((key) => {
    const cached = cacheManager.get(key);
    return cached ? { ...cached.data, _cached: true, _timestamp: cached.timestamp } : null;
  }, []);

  const isCacheStale = useCallback((key) => cacheManager.isStale(key), []);

  const clearCache = useCallback((key) => {
    cacheManager.clear(key);
    setCacheStats(prev => ({ ...prev, totalItems: cacheManager.getAllKeys().length }));
  }, []);

  const clearAllCache = useCallback(() => {
    cacheManager.clearAll();
    setCacheStats({ totalItems: 0, memoryUsage: '0 KB' });
  }, []);

  const cacheContext = { updateCache, getCache, isCacheStale, clearCache, clearAllCache, cacheStats };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/30 overflow-hidden flex relative antialiased">
      
      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 bg-void-gradient pointer-events-none z-0" />
      <div className="fixed inset-0 bg-noise opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />
      <div 
        className="fixed inset-0 bg-stars opacity-40 pointer-events-none z-0"
        style={{ backgroundSize: '550px 550px, 350px 350px, 250px 250px', backgroundPosition: '0 0, 40px 60px, 130px 270px' }}
      />
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px] pointer-events-none z-0 opacity-20" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[120px] pointer-events-none z-0 opacity-10" />

      {/* --- NAVIGATION BAR --- */}
      <nav 
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
        className={`
          fixed z-50 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] will-change-[width,height]
          
          /* LAYOUT */
          /* Mobile: Bottom pill */
          bottom-4 left-4 right-4 h-16 rounded-2xl flex flex-row items-center justify-around px-2
          
          /* Desktop: Left sidebar */
          md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-6
          md:flex-col md:h-auto md:py-3 md:rounded-[32px] md:px-2 md:gap-2
          
          /* Desktop Width Transition: Tighter collapsed state (68px) */
          ${isNavHovered ? 'md:w-[260px]' : 'md:w-[68px]'}
        `}
      >
        {/* Glass Background */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[inherit] -z-10" />

        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex md:flex-col md:gap-2 items-center md:items-start justify-around md:justify-start">
            
            {/* LOGO AREA */}
            <div className="hidden md:flex items-center gap-3 px-2 mb-2 border-b border-white/10 h-12 w-full shrink-0 overflow-hidden">
              <div className="relative w-10 h-10 flex shrink-0 items-center justify-center">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-50 animate-pulse" />
                  <div className="relative z-10 w-2 h-2 bg-white rounded-full shadow-[0_0_15px_white]" />
              </div>
              
              <div className={`
                transition-all duration-300 whitespace-nowrap overflow-hidden
                ${isNavHovered ? 'opacity-100 translate-x-0 delay-100' : 'opacity-0 -translate-x-4 w-0 duration-0'}
              `}>
                <h1 className="text-xl font-black italic tracking-tighter text-white">
                  VOID
                </h1>
              </div>
            </div>

            {/* NAV ITEMS GROUP */}
            <div className="contents md:flex md:flex-col md:gap-2 md:w-full">
              <NavBtn active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<House size={20}/>} label="Mission Control" expanded={isNavHovered} />
              <NavBtn active={activeTab === 'launches'} onClick={() => setActiveTab('launches')} icon={<Rocket size={20}/>} label="Launch Manifest" expanded={isNavHovered} />
              <NavBtn active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<Map size={20}/>} label="Live Tracker" expanded={isNavHovered} />
              <NavBtn active={activeTab === 'news'} onClick={() => setActiveTab('news')} icon={<Newspaper size={20}/>} label="Intel Feed" expanded={isNavHovered} />
              <NavBtn active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Database size={20}/>} label="Asset Database" expanded={isNavHovered} />
              <NavBtn active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<User size={20}/>} label="About" expanded={isNavHovered} />
              
              <div className="contents md:hidden">
                <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20}/>} label="Settings" expanded={false} />
              </div>
            </div>

            {/* SETTINGS DESKTOP */}
            <div className="hidden md:block mt-auto pt-2 border-t border-white/10 w-full">
              <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20}/>} label="System Settings" expanded={isNavHovered} />
            </div>

        </div>
      </nav>

      {/* --- CONTENT AREA --- */}
      <main className="flex-1 relative z-10 h-screen overflow-y-auto scroll-smooth pb-24 md:pb-0 md:pl-[100px]">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-center py-6 sticky top-0 z-40 border-b border-white/10">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md -z-10" />
           <div className="flex items-center gap-3 relative z-10">
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
              <h1 className="text-lg font-black italic tracking-tighter text-white">VOID</h1>
           </div>
        </div>

        <div 
          key={activeTab}
          className="p-4 md:p-8 max-w-7xl mx-auto pb-24 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out"
        >
          {activeTab === 'home' && <Home cacheContext={cacheContext} />}
          {activeTab === 'launches' && <LaunchPad cacheContext={cacheContext} />}
          {activeTab === 'map' && <OrbitTracker cacheContext={cacheContext} />}
          {activeTab === 'news' && <News cacheContext={cacheContext} />}
          {activeTab === 'assets' && <Assets cacheContext={cacheContext} />}
          {activeTab === 'settings' && <Settings cacheContext={cacheContext} />}
          {activeTab === 'about' && <About />}
        </div>
      </main>
    </div>
  );
}

// --- FIXED NAV BUTTON ALIGNMENT ---
const NavBtn = ({ active, onClick, icon, label, expanded }) => (
  <button 
    onClick={onClick}
    className={`
      group relative flex items-center rounded-2xl transition-all duration-200 ease-out overflow-hidden
      
      /* Mobile: Fixed square button, centered content */
      h-10 w-10 justify-center
      
      /* Desktop: Fixed height, Dynamic width */
      md:h-12 md:w-full md:justify-start
    `}
  >
    {/* 1. BUTTON BACKGROUND LAYER */}
    <div className={`
      absolute inset-0 transition-all duration-300
      ${active 
        ? 'bg-white/15 border border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' 
        : 'border border-transparent hover:bg-white/5'}
    `} />

    {/* 2. ICON WRAPPER */}
    <div className={`
       flex items-center justify-center shrink-0 relative z-10
       /* Mobile: Fill container */
       w-full h-full 
       /* Desktop: Fixed 50px width. Ensures icon stays put. */
       md:w-[50px] md:h-full
       
       transition-transform duration-300
       text-white
       ${active ? 'scale-110 opacity-100' : 'opacity-50 group-hover:opacity-100 group-hover:scale-110'}
    `}>
      {icon}
    </div>

    {/* 3. LABEL WRAPPER 
        - Position: left-[56px] (Tighter to icon)
        - Logic: Opacity 0 immediately when not expanded to prevent "buggy" look
    */}
    <span className={`
      hidden md:block whitespace-nowrap text-xs font-bold uppercase tracking-widest relative z-10
      transition-all duration-300 absolute left-[56px]
      
      text-white
      ${active ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}
      
      /* Toggle Visibility */
      ${expanded 
        ? 'opacity-100 translate-x-0 w-auto delay-100' 
        : 'opacity-0 -translate-x-2 w-0 duration-0 delay-0 pointer-events-none'}
    `}>
      {label}
    </span>
  </button>
);

export default App;