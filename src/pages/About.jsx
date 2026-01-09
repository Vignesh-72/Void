import React from 'react';
import { Github, Mail, User, Code, Globe, Cpu, Layers } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black italic text-white tracking-tighter">
          ABOUT PROTOCOL
        </h2>
        <p className="text-slate-500 font-mono text-sm mt-1">CREATOR PROFILE // PROJECT SPECS</p>
      </div>

      {/* DEVELOPER CARD - FROSTED GLASS */}
      <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
          
          {/* Avatar Placeholder / Icon */}
          <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
            <User size={48} className="text-slate-300" />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-white">Vignesh S</h3>
              <p className="text-slate-400 font-mono text-sm"></p>
            </div>

            <p className="text-slate-300 leading-relaxed font-light">
              Architect of the VOID interface. Built to visualize the complexities of space exploration through a clean, monochromatic lens. Focused on performance, data accuracy, and immersive UI design.
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <a 
                href="https://github.com/Vignesh-72/Void" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all group"
              >
                <Github size={18} className="text-slate-300 group-hover:text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">GitHub Repo</span>
              </a>
              
              <a 
                href="mailto:vicky31pro@gmail.com" 
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all group"
              >
                <Mail size={18} className="text-slate-300 group-hover:text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Contact Me</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TECH STACK */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="text-white" size={20} />
            <h4 className="text-lg font-bold text-white uppercase tracking-wide">Tech Stack</h4>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-slate-400">Frontend Core</span>
              <span className="text-white font-mono">React + Vite</span>
            </li>
            <li className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-slate-400">Styling Engine</span>
              <span className="text-white font-mono">Tailwind CSS</span>
            </li>
            <li className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-slate-400">Iconography</span>
              <span className="text-white font-mono">Lucide React</span>
            </li>
            <li className="flex items-center justify-between text-sm pt-1">
              <span className="text-slate-400">State & Caching</span>
              <span className="text-white font-mono">Custom Hooks</span>
            </li>
          </ul>
        </div>

        {/* API SOURCES */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-white" size={20} />
            <h4 className="text-lg font-bold text-white uppercase tracking-wide">Data Network</h4>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-slate-400">Launch Telemetry</span>
              <span className="text-white font-mono">TheSpaceDevs API</span>
            </li>
            <li className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-slate-400">Imagery & APOD</span>
              <span className="text-white font-mono">NASA Open APIs</span>
            </li>
            <li className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-slate-400">Orbital Tracking</span>
              <span className="text-white font-mono">WhereTheISS.at</span>
            </li>
            <li className="flex items-center justify-between text-sm pt-1">
              <span className="text-slate-400">Asset Database</span>
              <span className="text-white font-mono">SpaceX API v4</span>
            </li>
          </ul>
        </div>

      </div>

      {/* FOOTER NOTE */}
      <div className="text-center pt-8 border-t border-white/5">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <Cpu size={14} className="text-slate-400" />
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            System Status: Operational // v2.2
          </span>
        </div>
      </div>

    </div>
  );
}