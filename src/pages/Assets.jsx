import React, { useState } from 'react';
import axios from 'axios';
import { 
  Rocket, Box, Anchor, MapPin, 
  History, Info, Cpu, Disc, Database,
  ArrowLeft, Search, X
} from 'lucide-react';
// 1. IMPORT LOADER
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
    
    const base = 'https://lldev.thespacedevs.com/2.2.0';
    const agencyId = agency === 'NASA' ? '44' : '31';
    
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
    { id: 'capsules', label: 'Capsule Serial', icon: <Box /> },
    { id: 'cores', label: 'Core Boosters', icon: <Cpu /> },
    { id: 'payloads', label: 'Payloads', icon: <Database /> },
    { id: 'history', label: 'History Events', icon: <History /> },
    { id: 'roadster', label: 'Starman', icon: <Rocket /> },
    { id: 'info', label: 'Agency Info', icon: <Info /> },
  ];

  const supportedCats = categories.filter(cat => getEndpoint(agency, cat.id) !== null);

  // 1. DASHBOARD VIEW
  if (!category) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-white/10 pb-8">
          <div>
             <h2 className="text-3xl font-black italic text-white tracking-tighter">
                ASSET DATABASE
             </h2>
             <p className="text-slate-400 font-mono text-sm mt-1">LEVEL 4 CLEARANCE</p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            {['SPACEX', 'NASA', 'ISRO'].map(a => (
              <button
                key={a}
                onClick={() => setAgency(a)}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${agency === a ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {supportedCats.map((cat) => (
            <button
              key={cat.id}
              onClick={() => loadCategory(cat.id)}
              className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 hover:border-white/30 hover:bg-white/10 transition-all group relative overflow-hidden backdrop-blur-sm"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                 <span className="text-4xl font-black text-white">{cat.label[0]}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-full text-slate-200 group-hover:text-white group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/5">
                {cat.icon}
              </div>
              <span className="font-bold text-white uppercase tracking-widest text-[10px]">{cat.label}</span>
            </button>
          ))}
        </div>
        
        {agency !== 'SPACEX' && (
           <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center backdrop-blur-md">
              <p className="text-slate-300 text-xs font-mono">⚠ RESTRICTED ACCESS: Deep telemetry (Cores, Capsules) is classified for {agency}. Only Rockets & Pads available.</p>
           </div>
        )}
      </div>
    );
  }

  // 2. LOADING VIEW
  if (loading) {
    // REPLACED LOADING UI
    return <Loader text={`DECRYPTING ${agency} ARCHIVES...`} />;
  }

  // 3. LIST VIEW
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-right-8 pb-20">
      <header className="flex items-center gap-4 border-b border-white/10 pb-4 sticky top-0 bg-black/80 z-20 backdrop-blur-xl pt-2 rounded-b-xl">
        <button 
          onClick={() => { setCategory(null); setSelectedItem(null); }}
          className="p-3 hover:bg-white/10 rounded-full transition-colors text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-black uppercase text-white tracking-widest">{agency} // {category}</h2>
          <p className="text-xs text-slate-500 font-mono">{data.length} ASSETS FOUND</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item, idx) => (
          <AssetCard 
            key={item.id || idx} 
            item={item} 
            type={category} 
            onClick={() => setSelectedItem(item)} 
          />
        ))}
      </div>

      {/* FULL DETAIL MODAL */}
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

// --- SUB-COMPONENTS ---

const AssetCard = ({ item, type, onClick }) => {
  const name = item.name || item.full_name || item.serial || item.title || "Unknown Asset";
  const status = item.status || (item.active ? 'active' : 'retired');
  const image = item.flickr_images?.[0] || item.image || item.image_url || null;

  return (
    <button 
      onClick={onClick}
      className="text-left bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-white/30 hover:bg-white/10 transition-all group flex flex-col gap-4 relative overflow-hidden h-full backdrop-blur-md"
    >
      <div className="flex justify-between items-start w-full">
         <h3 className="text-lg font-bold text-white group-hover:text-slate-200 transition-colors line-clamp-1">{name}</h3>
         {item.status && (
           <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${['active','operational'].includes(status) ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>
             {status}
           </span>
         )}
      </div>

      {image && (
        <div className="h-40 w-full rounded-xl bg-black/50 overflow-hidden border border-white/5">
           <img src={image} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform grayscale hover:grayscale-0 duration-500" />
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-white/10 w-full grid grid-cols-2 gap-2 text-[10px] text-slate-400 uppercase font-mono">
         {item.serial && <div>Serial: <span className="text-white">{item.serial}</span></div>}
         {item.type && <div>Type: <span className="text-white">{item.type}</span></div>}
         {item.reuse_count !== undefined && <div>Reuses: <span className="text-white">{item.reuse_count}</span></div>}
         {item.region && <div>Region: <span className="text-white">{item.region}</span></div>}
      </div>
      
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <Search size={16} className="text-white" />
      </div>
    </button>
  );
};

const DetailModal = ({ item, type, onClose }) => {
  if (!item) return null;

  const renderData = (obj) => {
    return Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) return null;
      if (key === 'id' || key === 'flickr_images') return null;
      return (
        <div key={key} className="flex flex-col border-b border-white/10 py-2">
           <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{key.replace(/_/g, ' ')}</span>
           <span className="text-sm font-mono text-white break-words">{String(value)}</span>
        </div>
      );
    });
  };

  const name = item.name || item.full_name || item.serial || "Asset Details";
  const image = item.flickr_images?.[0] || item.image || item.image_url || null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-black/50 border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row backdrop-blur-md">
        
        <div className="w-full md:w-1/3 bg-black relative p-6 flex flex-col justify-end min-h-[200px] md:min-h-full">
           {image && (
             <>
               <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale" />
               <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
             </>
           )}
           <div className="relative z-10">
              <h2 className="text-3xl font-black text-white uppercase italic leading-none mb-2">{name}</h2>
              <p className="text-slate-400 font-mono text-xs">{type.toUpperCase()} // CLASSIFIED</p>
           </div>
        </div>

        <div className="flex-1 bg-transparent p-8 overflow-y-auto relative">
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/20 text-white rounded-full transition-all"
           >
             <X size={20} />
           </button>

           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-2">Technical Specifications</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {renderData(item)}
           </div>

           {item.description && (
             <div className="mt-8 bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="text-[10px] text-white font-bold uppercase mb-2">Description</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};