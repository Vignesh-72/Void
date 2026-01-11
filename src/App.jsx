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
import IntroAnimation from './components/IntroAnimation';

const cacheManager = createCacheManager();

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [cacheStats, setCacheStats] = useState({ totalItems: 0, memoryUsage: '0 KB' });
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // --- SETTINGS STATE ---
  const [dynamicLayout, setDynamicLayout] = useState(() => {
    const saved = localStorage.getItem('void_dynamic_layout');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [pageTransitions, setPageTransitions] = useState(() => {
    const saved = localStorage.getItem('void_page_transitions');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('void_dynamic_layout', JSON.stringify(dynamicLayout));
  }, [dynamicLayout]);

  useEffect(() => {
    localStorage.setItem('void_page_transitions', JSON.stringify(pageTransitions));
  }, [pageTransitions]);

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
  const settingsContext = { dynamicLayout, setDynamicLayout, pageTransitions, setPageTransitions };

  return (
    <>
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      <div className="min-h-screen bg-black text-white font-sans selection:bg-white/30 overflow-hidden flex relative antialiased">
        
        <style>{`
          @keyframes pageEnter {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.99);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .page-transition {
            will-change: opacity, transform;
            backface-visibility: hidden;
            animation: pageEnter 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
        `}</style>

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
            bottom-4 left-4 right-4 h-16 rounded-2xl flex flex-row items-center justify-around px-2
            md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-6
            md:flex-col md:h-auto md:py-3 md:rounded-[32px] md:px-2 md:gap-2
            /* REDUCED WIDTHS HERE: 200px expanded / 64px collapsed */
            ${isNavHovered ? 'md:w-[220px]' : 'md:w-[64px]'}
          `}
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[inherit] -z-10" />

          <div className="relative z-10 w-full h-full flex md:flex-col md:gap-2 items-center md:items-start justify-around md:justify-start">
              
              {/* LOGO AREA */}
              <div className="hidden md:flex items-center gap-10 px-2 mb-2 border-b border-white/10 h-12 w-full shrink-0 overflow-hidden">
                <div className="relative w-10 h-10 flex shrink-0 items-center justify-center">
                    <div className="absolute inset-0 bg-white/10 rounded-full blur-xl opacity-40 animate-pulse" />
                    <img 
                      src="/logotrans.png" 
                      alt="VOID Logo" 
                      className="relative z-10 w-full h-full object-contain mix-blend-screen" 
                    />
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

              {/* NAV ITEMS */}
              <div className="contents md:flex md:flex-col md:gap-2 md:w-full">
                <NavBtn active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<House size={20}/>} label="Home" expanded={isNavHovered} />
                <NavBtn active={activeTab === 'launches'} onClick={() => setActiveTab('launches')} icon={<Rocket size={20}/>} label="Launches" expanded={isNavHovered} />
                <NavBtn active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<Map size={20}/>} label="ISS Tracker" expanded={isNavHovered} />
                <NavBtn active={activeTab === 'news'} onClick={() => setActiveTab('news')} icon={<Newspaper size={20}/>} label="News" expanded={isNavHovered} />
                <NavBtn active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Database size={20}/>} label="Assets" expanded={isNavHovered} />
                <NavBtn active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<User size={20}/>} label="About" expanded={isNavHovered} />
                
                <div className="contents md:hidden">
                  <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20}/>} label="Settings" expanded={false} />
                </div>
              </div>

              {/* SETTINGS DESKTOP */}
              <div className="hidden md:block mt-auto pt-2 border-t border-white/10 w-full">
                <NavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20}/>} label="Settings" expanded={isNavHovered} />
              </div>

          </div>
        </nav>

        {/* --- CONTENT AREA --- */}
        <main className={`
          flex-1 relative z-10 h-screen overflow-y-auto scroll-smooth pb-24 md:pb-0
          transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          /* ADJUSTED PADDING TO MATCH NEW NAV WIDTHS */
          ${dynamicLayout && isNavHovered ? 'md:pl-[240px]' : 'md:pl-[88px]'}
        `}>
          <div className="md:hidden flex items-center justify-center py-6 sticky top-0 z-40 border-b border-white/10">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-md -z-10" />
             <div className="flex items-center gap-3 relative z-10">
                <img src="/logotrans.png" className="w-8 h-8 object-contain mix-blend-screen" alt="logo" />
                <h1 className="text-lg font-black italic tracking-tighter text-white">VOID</h1>
             </div>
          </div>

          <div 
            key={activeTab} 
            className={`
              p-4 md:p-8 max-w-7xl mx-auto pb-24
              ${pageTransitions ? 'page-transition' : ''}
            `}
          >
            {activeTab === 'home' && <Home cacheContext={cacheContext} />}
            {activeTab === 'launches' && <LaunchPad cacheContext={cacheContext} />}
            {activeTab === 'map' && <OrbitTracker cacheContext={cacheContext} />}
            {activeTab === 'news' && <News cacheContext={cacheContext} />}
            {activeTab === 'assets' && <Assets cacheContext={cacheContext} />}
            {activeTab === 'settings' && <Settings cacheContext={cacheContext} settingsContext={settingsContext} />}
            {activeTab === 'about' && <About />}
          </div>
        </main>
      </div>
    </>
  );
}

const NavBtn = ({ active, onClick, icon, label, expanded }) => (
  <button 
    onClick={onClick}
    className={`
      group relative flex items-center justify-center shrink-0 rounded-2xl transition-all duration-200 ease-out overflow-hidden
      h-10 w-10 md:h-12 md:w-full md:justify-start
    `}
  >
    <div className={`
      absolute inset-0 transition-all duration-300
      ${active 
        ? 'bg-white/15 border border-transparent shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' 
        : 'border border-transparent hover:bg-white/5'}
    `} />

    <div className={`
       flex items-center justify-center shrink-0 relative z-10
       w-full h-full md:w-[50px] md:h-full
       transition-transform duration-300
       text-white
       ${active ? 'scale-110 opacity-100' : 'opacity-50 group-hover:opacity-100 group-hover:scale-110'}
    `}>
      {icon}
    </div>

    <span className={`
      hidden md:block whitespace-nowrap text-xs font-bold uppercase tracking-widest relative z-10
      transition-all duration-300 absolute left-[46px]
      text-white
      ${active ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}
      ${expanded 
        ? 'opacity-100 translate-x-0 w-auto delay-100' 
        : 'opacity-0 -translate-x-2 w-0 duration-0 delay-0 pointer-events-none'}
    `}>
      {label}
    </span>
  </button>
);

export default App;