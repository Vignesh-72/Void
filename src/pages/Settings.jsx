import React from 'react';
import { Database, Trash2, HardDrive, ShieldCheck, Activity, Layout, Zap } from 'lucide-react';

export default function Settings({ cacheContext, settingsContext }) {
  const { cacheStats, clearAllCache } = cacheContext;
  const { 
    dynamicLayout, setDynamicLayout,
    pageTransitions, setPageTransitions 
  } = settingsContext || { 
    dynamicLayout: false, setDynamicLayout: () => {},
    pageTransitions: true, setPageTransitions: () => {} 
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter">
          SYSTEM SETTINGS
        </h2>
        <p className="text-slate-500 font-mono text-xs md:text-sm mt-1">CONFIGURE VOID PARAMETERS</p>
      </div>

      {/* INTERFACE CONFIGURATION */}
      <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Layout className="text-white" size={24} />
          <h3 className="text-lg md:text-xl font-bold text-white">Interface Configuration</h3>
        </div>

        <div className="space-y-4">
          
          {/* DYNAMIC LAYOUT TOGGLE */}
          <div className="bg-white/5 p-5 md:p-6 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                Dynamic Layout Engine
                {dynamicLayout && <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded border border-green-500/30">ACTIVE</span>}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                When enabled, the dashboard content will physically shift to accommodate the expanded navigation bar.
              </p>
            </div>

            <button 
              onClick={() => setDynamicLayout(!dynamicLayout)}
              className={`
                relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none border border-white/10 shrink-0
                ${dynamicLayout ? 'bg-white/20' : 'bg-black/40'}
              `}
            >
              <span
                className={`
                  inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-lg
                  ${dynamicLayout ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* PAGE TRANSITIONS TOGGLE */}
          <div className="bg-white/5 p-5 md:p-6 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                Cinematic Page Transitions
                {pageTransitions && <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded border border-green-500/30">ACTIVE</span>}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Enables the smooth fade-in and scale animation when switching between mission tabs. Disable for faster performance on older devices.
              </p>
            </div>

            <button 
              onClick={() => setPageTransitions(!pageTransitions)}
              className={`
                relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none border border-white/10 shrink-0
                ${pageTransitions ? 'bg-white/20' : 'bg-black/40'}
              `}
            >
              <span
                className={`
                  inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow-lg
                  ${pageTransitions ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

        </div>
      </section>

      {/* STORAGE MANAGEMENT */}
      <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Database className="text-white" size={24} />
          <h3 className="text-lg md:text-xl font-bold text-white">Storage Management</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="bg-white/5 p-5 md:p-6 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-2">
              <HardDrive size={16} /> Memory Usage
            </div>
            <p className="text-2xl md:text-3xl font-mono text-white">{cacheStats.memoryUsage}</p>
          </div>

          <div className="bg-white/5 p-5 md:p-6 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-2">
              <Activity size={16} /> Cached Items
            </div>
            <p className="text-2xl md:text-3xl font-mono text-white">{cacheStats.totalItems}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div>
            <h4 className="font-bold text-slate-300 text-sm">Purge Database</h4>
            <p className="text-xs text-slate-500">Removes all cached API data.</p>
          </div>
          <button
            onClick={clearAllCache}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-lg transition-all"
          >
            <Trash2 size={18} />
            <span className="font-bold text-xs uppercase tracking-wider">Clear Cache</span>
          </button>
        </div>
      </section>

      {/* SYSTEM STATUS */}
      <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-white" size={24} />
          <h3 className="text-lg md:text-xl font-bold text-white">System Status</h3>
        </div>

        <div className="space-y-4 font-mono text-xs md:text-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/10 pb-3 gap-1">
            <span className="text-slate-500 font-bold">SYSTEM VERSION</span>
            <span className="text-white">V1.0</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/10 pb-3 gap-1">
            <span className="text-slate-500 font-bold">BUILD TARGET</span>
            <span className="text-white">STABLE / PRODUCTION</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/10 pb-3 gap-1">
            <span className="text-slate-500 font-bold">API CONNECTIVITY</span>
            <span className="text-green-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> ACTIVE
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-1 gap-1">
            <span className="text-slate-500 font-bold">ENCRYPTION</span>
            <span className="text-slate-400">TLS 1.3 ENABLED</span>
          </div>
        </div>
      </section>

    </div>
  );
}