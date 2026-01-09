import React from 'react';
import { Database, Trash2, HardDrive, ShieldCheck, Activity } from 'lucide-react';

export default function Settings({ cacheContext }) {
  const { cacheStats, clearAllCache } = cacheContext;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black italic text-white tracking-tighter">
          SYSTEM SETTINGS
        </h2>
        <p className="text-slate-500 font-mono text-sm mt-1">CONFIGURE VOID PARAMETERS // VERSION 2.2</p>
      </div>

      {/* STORAGE MANAGEMENT - FROSTED GLASS */}
      <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Database className="text-white" size={24} />
          <h3 className="text-xl font-bold text-white">Storage Management</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <HardDrive size={16} /> Memory Usage
            </div>
            <p className="text-3xl font-mono text-white">{cacheStats.memoryUsage}</p>
            <p className="text-xs text-slate-500 mt-2">Local browser storage allocated</p>
          </div>

          <div className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Activity size={16} /> Cached Items
            </div>
            <p className="text-3xl font-mono text-white">{cacheStats.totalItems}</p>
            <p className="text-xs text-slate-500 mt-2">API responses saved offline</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div>
            <h4 className="font-bold text-slate-300 text-sm">Purge Database</h4>
            <p className="text-xs text-slate-500">This will remove all cached API data. Next load will require internet.</p>
          </div>
          <button
            onClick={clearAllCache}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-lg transition-all"
          >
            <Trash2 size={18} />
            <span className="font-bold text-xs uppercase tracking-wider">Clear Cache</span>
          </button>
        </div>
      </section>

      {/* SYSTEM INFO - FROSTED GLASS */}
      <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-white" size={24} />
          <h3 className="text-xl font-bold text-white">System Status</h3>
        </div>

        <div className="space-y-4 font-mono text-sm">
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-slate-500">SYSTEM VERSION</span>
            <span className="text-white">V2.2 // MEMORY SAFE</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-slate-500">BUILD TARGET</span>
            <span className="text-white">STABLE / PRODUCTION</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-slate-500">API CONNECTIVITY</span>
            <span className="text-white font-bold">ACTIVE</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-slate-500">ENCRYPTION</span>
            <span className="text-slate-400">TLS 1.3 ENABLED</span>
          </div>
        </div>
      </section>

    </div>
  );
}