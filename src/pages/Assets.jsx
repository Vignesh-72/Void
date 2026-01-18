import React, { useState } from 'react';
import axios from 'axios';
import { 
  Rocket, Box, Anchor, MapPin, 
  History, Info, Cpu, Disc, Database,
  ArrowLeft, Search, X, ChevronRight, AlertTriangle
} from 'lucide-react';
import Loader from '../components/Loader';

export default function Assets({ cacheContext }) {
  const { updateCache, getCache } = cacheContext || { 
    updateCache: () => {}, 
    getCache: () => null 
  };

  const [agency, setAgency] = useState('SPACEX');
  const [category, setCategory] = useState(null);
  
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const normalizeData = (cachedData) => {
    if (!cachedData) return [];
    if (Array.isArray(cachedData)) return cachedData;
    return Object.entries(cachedData)
      .filter(([key]) => !key.startsWith('_'))
      .map(([, value]) => value);
  };

  const getEndpoint = (agency, catId) => {
    if (agency === 'SPACEX') {
      const base = 'https://api.spacexdata.com/v4';
      switch (catId) {
        case 'rockets': return `${base}/rockets`;
        case 'dragons': return `${base}/dragons`;
        case 'ships': return `${base}/ships`;
        case 'launchpads': return `${base}/launchpads`;
        case 'landpads': return `${base}/landpads`;
        case 'capsules': return `${base}/capsules`;
        case 'cores': return `${base}/cores`;
        case 'history': return `${base}/history`;
        case 'payloads': return `${base}/payloads`;
        case 'roadster': return `${base}/roadster`;
        case 'info': return `${base}/company`;
        default: return null;
      }
    }
    
    // Using lldev (Dev API) - Images here are often unstable
    const base = 'https://lldev.thespacedevs.com/2.2.0';
    const agencyId = agency === 'NASA' ? '44' : '31'; // 31 = ISRO
    
    switch (catId) {
      case 'rockets': return `${base}/config/launcher/?limit=100&manufacturer__id=${agencyId}`;
      case 'launchpads': return `${base}/pad/?limit=100&agency__id=${agencyId}`;
      default: return null;
    }
  };

  const loadCategory = async (catId) => {
    const cacheKey = `ASSETS_${agency}_${catId}`;
    const cachedEntry = getCache(cacheKey);
    
    if (cachedEntry) {
        setCategory(catId);
        setData(normalizeData(cachedEntry));
        return;
    }

    const url = getEndpoint(agency, catId);
    if (!url) return;

    setLoading(true);
    setCategory(catId);
    setData([]);

    try {
      const res = await axios.get(url);
      let results = [];
      if (agency === 'SPACEX') {
        results = Array.isArray(res.data) ? res.data : [res.data];
      } else {
        results = res.data.results || [];
      }
      setData(results);
      updateCache(cacheKey, results, { ttl: 60 * 60 * 1000 });
    } catch (err) {
      console.error("Asset Link Broken:", err);
    }
    setLoading(false);
  };

  const categories = [
    { id: 'rockets', label: 'Rockets', icon: <Rocket /> },
    { id: 'dragons', label: 'Dragons', icon: <Disc /> },
    { id: 'ships', label: 'Naval Fleet', icon: <Anchor /> },
    { id: 'launchpads', label: 'Launch Pads', icon: <MapPin /> },
    { id: 'landpads', label: 'Landing Zones', icon: <MapPin /> },
    { id: 'capsules', label: 'Capsules', icon: <Box /> },
    { id: 'cores', label: 'Boosters', icon: <Cpu /> },
    { id: 'payloads', label: 'Payloads', icon: <Database /> },
    { id: 'history', label: 'History', icon: <History /> },
    { id: 'roadster', label: 'Starman', icon: <Rocket /> },
    { id: 'info', label: 'Agency Info', icon: <Info /> },
  ];

  const supportedCats = categories.filter(cat => getEndpoint(agency, cat.id) !== null);

  // 1. DASHBOARD VIEW
  if (!category) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-6 pt-4">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
          <div>
             <h2 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter">
                ASSET DATABASE
             </h2>
             <p className="text-slate-400 font-mono text-xs md:text-sm mt-1">SELECT DATA CATEGORY</p>
          </div>
          
          <div className="flex w-full md:w-auto bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            {['SPACEX', 'NASA', 'ISRO'].map(a => (
              <button
                key={a}
                onClick={() => setAgency(a)}
                className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${agency === a ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </header>

        {/* GRID DASHBOARD */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {supportedCats.map((cat) => (
            <button
              key={cat.id}
              onClick={() => loadCategory(cat.id)}
              className="group relative bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 md:gap-4 hover:bg-white/10 active:scale-95 transition-all aspect-square md:aspect-auto"
            >
              <div className="absolute top-2 right-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                 <div className="scale-[2.5]">{cat.icon}</div>
              </div>
              
              <div className="p-3 md:p-4 bg-black/40 rounded-full text-slate-300 group-hover:text-white group-hover:scale-110 transition-transform border border-white/5 shadow-inner">
                {React.cloneElement(cat.icon, { size: 24 })}
              </div>
              <span className="font-bold text-slate-200 group-hover:text-white uppercase tracking-wider text-[10px] md:text-xs text-center">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
        
        {agency !== 'SPACEX' && (
           <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center backdrop-blur-md">
              <p className="text-slate-400 text-[10px] font-mono">
                ⚠ RESTRICTED ACCESS: Deep telemetry is classified for {agency}.
              </p>
           </div>
        )}
      </div>
    );
  }

  // 2. LOADING VIEW
  if (loading) {
    return <Loader text={`DECRYPTING ${agency} ARCHIVES...`} />;
  }

  // 3. LIST VIEW
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-right-8 pb-24 px-4 md:px-6 pt-4">
      
      {/* STICKY HEADER */}
      <header className="flex items-center gap-4 border-b border-white/10 pb-4 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-30 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
        <button 
          onClick={() => { setCategory(null); setSelectedItem(null); }}
          className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white border border-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
             <h2 className="text-lg md:text-xl font-black uppercase text-white tracking-widest">{agency}</h2>
             <span className="text-slate-600">/</span>
             <h2 className="text-lg md:text-xl font-bold uppercase text-slate-300">{category}</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-mono tracking-wide">{data.length} ASSETS FOUND</p>
        </div>
      </header>

      {/* ASSET LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {data.map((item, idx) => (
          <AssetCard 
            key={item.id || idx} 
            item={item} 
            type={category} 
            onClick={() => setSelectedItem(item)} 
          />
        ))}
      </div>

      {/* FULL SCREEN MODAL */}
      {selectedItem && (
        <DetailModal 
          item={selectedItem} 
          type={category} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
}

// --- ASSET CARD WITH ERROR HANDLING ---
const AssetCard = ({ item, type, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const name = item.name || item.full_name || item.serial || item.title || "Unknown Asset";
  const status = item.status || (item.active ? 'active' : (item.active === false ? 'retired' : null));
  const image = item.flickr_images?.[0] || item.image || item.image_url || null;

  return (
    <button 
      onClick={onClick}
      className="text-left bg-white/5 border border-white/10 rounded-2xl hover:border-white/30 hover:bg-white/10 transition-all group flex flex-col relative overflow-hidden h-full active:scale-[0.98] duration-200"
    >
      {/* Status Badge */}
      {status && (
        <div className="absolute top-3 right-3 z-10">
           <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-md border shadow-lg ${['active','operational','under construction'].includes(status.toLowerCase()) ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-black/60 text-slate-400 border-white/10'}`}>
             {status}
           </span>
        </div>
      )}

      {/* Image / Placeholder */}
      <div className="h-40 w-full bg-black/40 overflow-hidden relative border-b border-white/5">
         {image && !imgError ? (
           <img 
             src={image} 
             className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
             loading="lazy"
             onError={() => setImgError(true)} // <-- FIX: Handles ORB/404 errors
           />
         ) : (
           <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Rocket size={48} />
           </div>
         )}
         
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
         
         <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-lg font-bold text-white leading-tight line-clamp-1">{name}</h3>
         </div>
      </div>

      {/* Compact Info Footer */}
      <div className="p-4 grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-slate-400 font-mono w-full">
         {item.serial && <div className="truncate">S/N: <span className="text-slate-200">{item.serial}</span></div>}
         {item.type && <div className="truncate">TYPE: <span className="text-slate-200">{item.type}</span></div>}
         {item.reuse_count !== undefined && <div>FLIGHTS: <span className="text-slate-200">{item.reuse_count}</span></div>}
         <div className="col-span-2 flex items-center gap-1 text-slate-500 mt-1">
            Tap for details <ChevronRight size={10} />
         </div>
      </div>
    </button>
  );
};

// --- DETAIL MODAL ---
const DetailModal = ({ item, type, onClose }) => {
  const [imgError, setImgError] = useState(false);
  if (!item) return null;

  const renderData = (obj) => {
    return Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) return null;
      if (['id', 'flickr_images', 'image', 'image_url', 'description', 'url'].includes(key)) return null;
      if (!value) return null;
      
      return (
        <div key={key} className="flex flex-col border-b border-white/5 py-3">
           <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">{key.replace(/_/g, ' ')}</span>
           <span className="text-xs md:text-sm font-mono text-slate-200 break-words leading-relaxed">{String(value)}</span>
        </div>
      );
    });
  };

  const name = item.name || item.full_name || item.serial || "Asset Details";
  const image = item.flickr_images?.[0] || item.image || item.image_url || null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Content */}
      <div className="bg-[#0a0a0a] md:bg-black/90 border-t md:border border-white/10 w-full md:max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in slide-in-from-bottom-10">
        
        {/* Sticky Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10 transition-all"
        >
          <X size={20} />
        </button>

        {/* Header Image */}
        <div className="h-48 md:h-64 bg-black relative shrink-0">
           {image && !imgError ? (
             <img 
               src={image} 
               className="w-full h-full object-cover opacity-60" 
               onError={() => setImgError(true)} 
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-white/5">
                <Rocket size={48} className="text-white/20" />
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
           <div className="absolute bottom-6 left-6 right-6">
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30 uppercase mb-2 inline-block">
                {type}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-none">{name}</h2>
           </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
           {item.description && (
             <div className="mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center gap-2">
                  <Info size={12} /> Briefing
                </h4>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-light">{item.description}</p>
             </div>
           )}

           <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <Database size={14} className="text-slate-500" />
             Technical Data
           </h3>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {renderData(item)}
           </div>
           
           {/* Bottom Safe Area padding for mobile */}
           <div className="h-12 md:h-0" />
        </div>

      </div>
    </div>
  );
};