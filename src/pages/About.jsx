import React from 'react';
import { Github, Mail, User, Cpu, Layers, Zap, Shield, GitBranch, Network, Database, Server, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="relative max-w-6xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-24 px-4 md:px-8">
      
      {/* BKG DECORATION */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10"></div>

      {/* --- HEADER --- */}
      <div className="relative py-10 text-center">
        <h2 className="text-4xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]">
          PROTOCOL: VOID
        </h2>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_ffffff]"></span>
          <p className="text-white font-mono text-xs md:text-base uppercase tracking-[0.2em] md:tracking-[0.3em] typing-demo overflow-hidden whitespace-nowrap border-r-2 border-white pr-1">
            v1.0 Stable
          </p>
        </div>
        <div className="h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent mt-8"></div>
      </div>

      {/* --- 1. MISSION STATEMENT (MOVED UP) --- */}
      {/* Added -mt-8 to pull the card up closer to the header */}
      <section className="relative max-w-4xl mx-auto -mt-17">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 overflow-hidden group">
           <div className="absolute inset-0 bg-noise opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
           
           {/* TEXT CONTENT */}
           <div className="flex-1 text-center md:text-left relative z-10 md:pr-4">
             
             {/* TITLE LABEL */}
             <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
               <Network size={14} className="text-blue-400" />
               <p className="text-blue-400 font-mono text-xs font-bold tracking-widest uppercase">
                 About : Void
               </p>
             </div>
             
             <h3 className="text-xl md:text-3xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
               "Bridging the Void"
             </h3>
             
             <p className="text-slate-300 leading-relaxed font-light text-sm md:text-base drop-shadow-md">
               The VOID interface was engineered to translate the raw, chaotic data of space exploration into a unified, human-readable experience. By aggregating telemetry from NASA, SpaceX, and global agencies, we provide a crystal-clear window into humanity's journey amongst the stars.
             </p>
           </div>

           {/* ROCKET IMAGE SHOWCASE */}
           <div className="relative z-10 w-3/5 max-w-[240px] md:w-[200px] lg:w-[240px] mx-auto md:mx-0 shrink-0">
             <div className="absolute -inset-4 bg-gradient-to-tr from-white/10 via-transparent to-transparent blur-2xl -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
             
             <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black/50 group-hover:scale-[1.02] transition-transform duration-500">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10 pointer-events-none"></div>
               <img 
                 src="/aboutimage.png" 
                 alt="Rocket Model Showcase" 
                 className="w-full h-auto object-cover relative z-0"
               />
               <div className="absolute inset-0 border-2 border-white/5 rounded-2xl pointer-events-none z-20 m-2"></div>
             </div>
            
           </div>
        </div>
      </section>

      {/* --- 2. CREATOR PROFILE --- */}
      <section className="flex justify-center">
        <div className="w-full max-w-lg bg-[#0a0a0a] border-2 border-white/10 rounded-[2rem] p-8 relative overflow-hidden group hover:border-white/30 transition-all shadow-2xl">
          
          <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-spin-slow blur-md opacity-20 group-hover:opacity-50 transition-opacity"></div>
             <div className="relative w-full h-full bg-black border-2 border-white/20 flex items-center justify-center z-10 overflow-hidden" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
               <User size={56} className="text-slate-300 md:w-[64px] md:h-[64px]" />
             </div>
             <div className="absolute bottom-2 right-2 bg-black/90 backdrop-blur border border-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> ONLINE
             </div>
          </div>
          
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase mb-2">Vignesh S</h3>
            <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.2em]">Lead Architect // Developer</p>
          </div>

          <div className="flex gap-4 justify-center">
              <a 
                href="https://github.com/Vignesh-72/Void" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl group/btn transition-all"
              >
                <Github size={18} className="text-slate-400 group-hover/btn:text-white md:w-[20px] md:h-[20px]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">GitHub</span>
              </a>
              
              <a 
                href="mailto:vicky31pro@gmail.com" 
                className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl group/btn transition-all"
              >
                <Mail size={18} className="text-slate-400 group-hover/btn:text-white md:w-[20px] md:h-[20px]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Email</span>
              </a>
          </div>
        </div>
      </section>

      {/* --- 3. SYSTEM CAPABILITIES --- */}
      <div>
        <h4 className="text-center text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 uppercase tracking-[0.2em] mb-12">
           System Schematics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h5 className="text-xl font-bold text-white mb-3">Real-Time Telemetry</h5>
            <p className="text-sm text-slate-400 leading-relaxed">
              Live websocket connections to ISS tracking arrays and launch providers for sub-second data accuracy.
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center hover:-translate-y-2 transition-all duration-300">
             <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h5 className="text-xl font-bold text-white mb-3">Offline Resilience</h5>
            <p className="text-sm text-slate-400 leading-relaxed">
              Advanced local-first caching algorithms ensure critical mission data remains accessible even when the network goes dark.
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center hover:-translate-y-2 transition-all duration-300">
             <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h5 className="text-xl font-bold text-white mb-3">Open API Network</h5>
            <p className="text-sm text-slate-400 leading-relaxed">
              Aggregated data streams from NASA, TheSpaceDevs, and SpaceX unified into a single, coherent frontend graph.
            </p>
          </div>
        </div>
      </div>

      {/* --- 4. TECHNICAL SPECS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/10 rounded-3xl p-8 relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 text-white/5 -rotate-12 pointer-events-none">
             <Cpu size={120} />
           </div>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <Layers className="text-white" size={24} />
            <h4 className="text-xl font-bold text-white uppercase tracking-wide">Frontend Core</h4>
          </div>
          <ul className="space-y-4 font-mono text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span>REACT_ENGINE</span>
              <span className="text-white font-bold">v18.2 + Vite</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span>STYLING_SYS</span>
              <span className="text-white font-bold">Tailwind CSS</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span>GEO_RENDER</span>
              <span className="text-white font-bold">Leaflet</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/10 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-white/5 12 pointer-events-none">
             <Server size={120} />
           </div>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <Globe className="text-white" size={24} />
            <h4 className="text-xl font-bold text-white uppercase tracking-wide">Data Network</h4>
          </div>
           <ul className="space-y-4 font-mono text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span>LAUNCH_UPLINK</span>
              <span className="text-white font-bold">TheSpaceDevs API</span>
            </li>
             <li className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span>VISUAL_FEED</span>
              <span className="text-white font-bold">NASA APOD API</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span>ORBITAL_DATA</span>
              <span className="text-white font-bold">WhereTheISS.at</span>
            </li>
          </ul>
        </div>
      </div>

      {/* --- 5. RELEASE LOG --- */}
      <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[size:100%_4px] pointer-events-none z-10 opacity-30"></div>
        <div className="bg-white/5 p-3 flex items-center gap-2 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/20"></div>
            <div className="w-3 h-3 rounded-full bg-white/20"></div>
            <div className="w-3 h-3 rounded-full bg-white/20"></div>
          </div>
          <span className="font-mono text-xs text-slate-400 ml-2 flex items-center gap-2"><GitBranch size={12}/> /var/log/void_protocol.log</span>
        </div>
        
        <div className="p-6 font-mono text-sm relative z-0">
          <div className="space-y-4">
            <div>
              <p className="text-white">Isolating node... Done.</p>
              <p>
                <span className="text-white font-bold">➜</span> <span className="text-slate-300">[v1.0.0]</span> <span className="text-slate-500">2024-05-20 :: STABLE_RELEASE</span>
              </p>
              <ul className="text-slate-300 pl-6 mt-1 list-[square] marker:text-white/50">
                <li>Initial public deployment authorized.</li>
                <li>Implements enhanced caching layer (TTL logic).</li>
                <li>Integrated cinematic boot sequence.</li>
              </ul>
            </div>
          </div>
          <p className="pt-6 animate-pulse flex items-center text-white">
            <span>user@void:~$ awaiting_input</span><span className="w-2.5 h-5 bg-white ml-1"></span>
          </p>
        </div>
      </div>

    </div>
  );
}