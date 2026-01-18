import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Github, Mail, User, Cpu, Layers, Zap, 
  Shield, GitBranch, Network, Database, 
  Server, Globe, Terminal, Code, Activity 
} from 'lucide-react';

// --- BACKGROUND COMPONENT (Fixed for Mobile & Z-Index) ---
const FixedBackground = ({ image, isLoaded, onLoad }) => {
  // Portal renders this outside the 'page-transition' div that causes scrolling issues.
  return createPortal(
    <div className="fixed inset-0 w-full h-[100dvh] z-[1] pointer-events-none bg-black">
      <img 
        src={image} 
        alt="Background" 
        // object-center prevents the 'zoomed in' look on mobile
        className={`w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-90' : 'opacity-0'}`}
        onLoad={onLoad}
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)]" />
    </div>,
    document.body
  );
};

export default function About() {
  
  // --- RANDOM BACKGROUND LOGIC ---
  const [randomBg] = useState(() => {
    const images = [
      '/img1.png', '/img2.jpg', '/img3.jpg', '/img4.jpg',
      '/img5.jpg', '/img6.jpg', '/img7.png', '/img9.jpg',
      '/img10.jpg', '/img11.jpg', '/img12.jpg'
    ];
    if (images.length === 0) return '/fallbackimage.png';
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  });

  // --- LOADING ANIMATION STATE ---
  const [isBgLoaded, setIsBgLoaded] = useState(false);

  // Clean up portal logic on unmount
  useEffect(() => {
    return () => setIsBgLoaded(false);
  }, []);

  return (
    <div className="relative w-full overflow-hidden text-white pb-20">
      
      {/* --- 1. PORTAL BACKGROUND --- */}
      <FixedBackground 
        image={randomBg} 
        isLoaded={isBgLoaded} 
        onLoad={() => setIsBgLoaded(true)} 
      />

      {/* --- CONTENT CONTAINER --- */}
      {/* z-10 ensures text sits ON TOP of the portal background */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 space-y-16 md:space-y-24 pt-12 animate-in fade-in duration-1000">

        {/* --- HERO SECTION --- */}
        <div className="text-center space-y-6">
          <div className="relative w-32 md:w-48 mx-auto group">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[50px] animate-pulse"></div>
            <img 
              src="/logotrans.png" 
              alt="VOID Logo" 
              className="relative w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform duration-700" 
            />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-2xl">
              PROJECT VOID
            </h1>
            <div className="flex items-center justify-center gap-3 text-[10px] md:text-sm font-mono text-blue-400 tracking-[0.3em] uppercase">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
              System v1.0.0 Online
            </div>
          </div>
        </div>

        {/* --- MISSION BRIEFING --- */}
        <section className="max-w-4xl mx-auto">
          <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-12 overflow-hidden hover:border-white/20 transition-colors duration-500 shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Network size={100} className="md:w-[120px] md:h-[120px]" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
               <div className="flex-1 space-y-4 md:space-y-6">
                 <div className="flex items-center gap-2 text-blue-300 font-mono text-xs uppercase tracking-widest mb-2">
                   <Activity size={14} /> Mission Directive
                 </div>
                 
                 <h2 className="text-xl md:text-3xl font-bold leading-tight text-white">
                   "Space data, simplified."
                 </h2>
                 <p className="text-slate-300 leading-relaxed font-light text-sm md:text-base">
                   We built VOID to make space exploration easy to understand. Instead of confusing data tables, we pull information from NASA, SpaceX, and others to show you real-time launches, orbital tracking, and mission updates in one clean, simple dashboard. No complex code—just the universe at your fingertips.
                 </p>
               </div>
            </div>
          </div>
        </section>

        {/* --- ARCHITECT PROFILE --- */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch">
          
          {/* Profile Card */}
          <div className="md:col-span-5 bg-black/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative w-28 h-28 md:w-32 md:h-32 mb-6">
               <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-spin-slow"></div>
               <div className="absolute inset-2 border border-white/10 rounded-full"></div>
               <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                 <User size={40} className="text-slate-300 md:w-12 md:h-12" />
               </div>
               <div className="absolute bottom-0 right-0 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">DEV</div>
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-1">Vignesh S</h3>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-8">Lead Architect & Developer</p>

            <div className="flex w-full gap-3 mt-auto">
              <a href="https://github.com/Vignesh-72/Void" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/20 border border-white/10 rounded-xl transition-all group/btn">
                <Github size={16} /> <span className="text-[10px] md:text-xs font-bold">GITHUB</span>
              </a>
              <a href="mailto:vicky31pro@gmail.com" className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/20 border border-white/10 rounded-xl transition-all group/btn">
                <Mail size={16} /> <span className="text-[10px] md:text-xs font-bold">EMAIL</span>
              </a>
            </div>
          </div>

          {/* Tech Stack Grid */}
          <div className="md:col-span-7 grid grid-cols-1 gap-4">
            
            {/* Frontend Module */}
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden hover:bg-white/10 transition-colors shadow-lg">
               <h4 className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                 <Cpu size={16} className="text-blue-400" /> Engine Core
               </h4>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <p className="text-[10px] md:text-xs text-slate-500">FRAMEWORK</p>
                   <p className="font-mono text-xs md:text-sm text-white">React 18 + Vite</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] md:text-xs text-slate-500">STYLING</p>
                   <p className="font-mono text-xs md:text-sm text-white">Tailwind CSS</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] md:text-xs text-slate-500">VISUALS</p>
                   <p className="font-mono text-xs md:text-sm text-white">Lucide + Framer</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] md:text-xs text-slate-500">MAPS</p>
                   <p className="font-mono text-xs md:text-sm text-white">Leaflet GL</p>
                 </div>
               </div>
            </div>

            {/* API Module */}
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden hover:bg-white/10 transition-colors shadow-lg">
               <h4 className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                 <Globe size={16} className="text-green-400" /> Data Uplinks
               </h4>
               <ul className="space-y-3">
                 <li className="flex justify-between items-center text-xs md:text-sm font-mono">
                   <span className="text-slate-400">LAUNCH_DATA</span>
                   <span className="text-white bg-white/10 px-2 py-0.5 rounded">TheSpaceDevs API</span>
                 </li>
                 <li className="flex justify-between items-center text-xs md:text-sm font-mono">
                   <span className="text-slate-400">ORBITAL_TELEMETRY</span>
                   <span className="text-white bg-white/10 px-2 py-0.5 rounded">WhereTheISS.at</span>
                 </li>
                 <li className="flex justify-between items-center text-xs md:text-sm font-mono">
                   <span className="text-slate-400">ASSET_LIBRARY</span>
                   <span className="text-white bg-white/10 px-2 py-0.5 rounded">SpaceX API v4</span>
                 </li>
                 <li className="flex justify-between items-center text-xs md:text-sm font-mono">
                   <span className="text-slate-400">INTEL_FEED</span>
                   <span className="text-white bg-white/10 px-2 py-0.5 rounded">Reddit API</span>
                 </li>
               </ul>
            </div>

          </div>
        </section>

        {/* --- SYSTEM LOG --- */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-t-xl bg-[#1a1a1a] border border-white/10 p-2 flex items-center gap-2">
            <div className="flex gap-1.5 ml-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
            <span className="ml-auto mr-auto font-mono text-[10px] text-slate-500">/var/logs/system_boot.log</span>
          </div>
          <div className="bg-black/80 backdrop-blur-xl border-x border-b border-white/10 rounded-b-xl p-4 md:p-6 font-mono text-[10px] md:text-sm shadow-2xl overflow-x-auto">
            <div className="space-y-2 text-slate-300 whitespace-nowrap md:whitespace-normal">
              <p><span className="text-green-500">➜</span> Initializing Core Systems... <span className="text-green-500">OK</span></p>
              <p><span className="text-green-500">➜</span> Connecting to Global Arrays... <span className="text-green-500">OK</span></p>
              <p><span className="text-blue-500">ℹ</span> [INFO] React Engine Mount Successful.</p>
              <p><span className="text-blue-500">ℹ</span> [INFO] Caching Layer (TTL) Active.</p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white typing-demo">
                  <span className="text-purple-400">user@void</span>:<span className="text-blue-400">~</span>$ awaiting command_<span className="animate-pulse">▊</span>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}