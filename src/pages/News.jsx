import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ExternalLink, MessageSquare, User, Clock, ArrowUpCircle, RefreshCw, ChevronDown, Zap, AlertCircle, Hash } from 'lucide-react';
import { CACHE_KEYS } from '../utils/cacheManager';
import Loader from '../components/Loader';

// --- SKELETON CARD COMPONENT ---
const SkeletonNewsCard = () => (
  <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-6 animate-pulse">
    <div className="w-full md:w-48 h-48 md:h-32 bg-white/10 rounded-xl shrink-0" />
    <div className="flex-1 space-y-4 py-1">
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-white/10 rounded" />
        <div className="h-6 w-1/2 bg-white/10 rounded" />
      </div>
      <div className="h-4 w-24 bg-white/10 rounded mt-2" />
      <div className="pt-4 mt-auto flex gap-4 border-t border-white/5">
        <div className="h-3 w-16 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded" />
      </div>
    </div>
  </div>
);

export default function News({ cacheContext }) {
  const { updateCache, getCache, isCacheStale, clearCache } = cacheContext || {
    updateCache: () => {},
    getCache: () => null,
    isCacheStale: () => false,
    clearCache: () => {}
  };
  
  const TARGET_SUBS = "space+spacex+nasa+ISRO+SpaceXLounge";
  const CACHE_KEY_NEWS = "GLOBAL_INTEL_FEED_V1"; 
  const CACHE_TTL = 10 * 60 * 1000;
  
  const normalizeData = (cachedData) => {
    if (!cachedData) return [];
    if (Array.isArray(cachedData)) return cachedData;
    return Object.entries(cachedData)
      .filter(([key]) => !key.startsWith('_'))
      .map(([, value]) => value);
  };

  const cachedEntry = getCache(CACHE_KEY_NEWS);
  const isStale = isCacheStale(CACHE_KEY_NEWS);
  const hasValidData = cachedEntry && !isStale;

  // --- STATE ---
  const [news, setNews] = useState(hasValidData ? normalizeData(cachedEntry) : []);
  const [loading, setLoading] = useState(!hasValidData);
  const [usingCachedData, setUsingCachedData] = useState(hasValidData);
  const [lastToken, setLastToken] = useState(hasValidData && news.length > 0 ? news[news.length - 1]?.data?.name : null);
  const [lastFetchTime, setLastFetchTime] = useState(hasValidData ? cachedEntry._timestamp : null);
  
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const getTimeAgo = useCallback((timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp * 1000)) / 1000);
    let interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " HOURS AGO";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " MIN AGO";
    return "JUST NOW";
  }, []);

  const getPreviewImage = (post) => {
    if (post.preview?.images?.[0]?.source?.url) {
      return post.preview.images[0].source.url.replace(/&amp;/g, '&');
    }
    if (post.thumbnail && post.thumbnail.startsWith('http')) {
      return post.thumbnail;
    }
    return null;
  };

  const fetchNews = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
      setError(null);
    } else if (!hasValidData) {
      setLoading(true);
    }

    try {
      if (!forceRefresh && hasValidData) {
         setLoading(false);
         return;
      }

      // Bypass Mobile Redirects using old.reddit.com
      const res = await axios.get(`https://old.reddit.com/r/${TARGET_SUBS}/hot.json?limit=15&raw_json=1`);
      
      if (res.data && res.data.data && Array.isArray(res.data.data.children)) {
        const cleanNews = res.data.data.children.filter(item => !item.data.stickied);
        
        const enrichedNews = cleanNews.map(item => ({
          ...item,
          _fetchedAt: new Date().toISOString()
        }));
        
        setNews(enrichedNews);
        setUsingCachedData(false);
        setError(null);
        
        if (enrichedNews.length > 0) {
          setLastToken(enrichedNews[enrichedNews.length - 1].data.name);
        }
        
        setLastFetchTime(new Date().toISOString());
        updateCache(CACHE_KEY_NEWS, enrichedNews, { ttl: CACHE_TTL });
      } else {
        throw new Error("Invalid API response format");
      }
      
    } catch (err) {
      console.error("News fetch error:", err);
      setError("Uplink Failed. Check Signal.");
      
      try {
         const fallbackRes = await axios.get(`https://www.reddit.com/r/${TARGET_SUBS}/hot.json?limit=15&raw_json=1`);
         if (fallbackRes.data && fallbackRes.data.data) {
            const cleanNews = fallbackRes.data.data.children.filter(item => !item.data.stickied);
            setNews(cleanNews);
            setError(null);
            setUsingCachedData(false);
            setLastFetchTime(new Date().toISOString());
         }
      } catch (fallbackErr) {
         if (cachedEntry) {
            setNews(normalizeData(cachedEntry));
            setUsingCachedData(true);
            setError(null);
         }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [updateCache, getCache, isCacheStale, hasValidData]);

  useEffect(() => {
    if (!hasValidData) {
        fetchNews();
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastToken || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      const res = await axios.get(`https://old.reddit.com/r/${TARGET_SUBS}/hot.json?limit=10&after=${lastToken}&raw_json=1`);
      
      if (res.data && res.data.data && Array.isArray(res.data.data.children)) {
        const newPosts = res.data.data.children.filter(item => !item.data.stickied);
        
        if (newPosts.length === 0) {
          setLoadingMore(false);
          return;
        }
        
        const enrichedNewPosts = newPosts.map(item => ({
          ...item,
          _fetchedAt: new Date().toISOString()
        }));
        
        setNews(prevNews => {
          const safePrevNews = Array.isArray(prevNews) ? prevNews : [];
          const updatedNews = [...safePrevNews, ...enrichedNewPosts];
          updateCache(CACHE_KEY_NEWS, updatedNews, { ttl: CACHE_TTL });
          return updatedNews;
        });
        
        if (enrichedNewPosts.length > 0) {
          setLastToken(enrichedNewPosts[enrichedNewPosts.length - 1].data.name);
        }
      }
      
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [lastToken, loadingMore, updateCache]);

  const handleRefresh = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (clearCache) {
      clearCache(CACHE_KEY_NEWS);
    }
    fetchNews(true);
  };

  if (loading) return <Loader text="AGGREGATING GLOBAL INTEL..." />;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-6 border-b border-white/10 pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black italic text-white tracking-tighter mb-1 md:mb-0">
            SPACEFLIGHT NEWS
          </h1>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="md:hidden flex items-center justify-center p-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors active:scale-95"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-white' : ''} />
            </button>

            <div className="h-4 w-px bg-white/10 md:hidden"></div>
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-slate-500 uppercase tracking-wide">
               <div className="flex items-center gap-1.5">
                 <span className={`w-1.5 h-1.5 rounded-full ${usingCachedData ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`}></span>
                 <span className="font-bold text-slate-400">{usingCachedData ? 'OFFLINE' : 'LIVE FEED'}</span>
               </div>
               <span className="opacity-50">/</span>
               <span>UPDATED: {lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end">
          <div className="hidden md:flex gap-1">
             {['SPACE', 'SPACEX', 'NASA', 'ISRO'].map(sub => (
                <span key={sub} className="text-[10px] font-bold px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-400">
                   r/{sub}
                </span>
             ))}
          </div>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden md:flex p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group disabled:opacity-50 items-center justify-center shadow-lg"
            title="Reload Feed"
          >
            <RefreshCw size={20} className={`text-white ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <p className="text-red-300 text-sm font-mono flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 text-xs font-bold rounded-lg transition-colors border border-red-500/30"
          >
            RETRY
          </button>
        </div>
      )}

      {/* FEED GRID */}
      <div className="flex flex-col gap-4">
        
        {!loading && news.length === 0 && (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
            <p className="text-slate-500 font-mono mb-4">NO INTEL FOUND IN SECTOR</p>
            <button onClick={handleRefresh} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-bold text-sm border border-white/10">
              FORCE REFRESH
            </button>
          </div>
        )}

        {news.map((item, index) => {
            const post = item.data;
            const imageUrl = getPreviewImage(post);

            return (
              <a 
                key={`${post.id}-${index}`}
                href={`https://reddit.com${post.permalink}`} 
                target="_blank" 
                rel="noopener noreferrer"
                // FIX: Removed 'backdrop-blur-sm' and added 'transform-gpu' for crisp text
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 md:p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-6 overflow-hidden transform-gpu"
              >
                {/* Glow Effect - pointer-events-none ensures no interaction bugs */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                {imageUrl && (
                  <div className="w-full md:w-48 h-48 md:h-32 rounded-xl overflow-hidden border border-white/10 shrink-0 relative bg-black">
                    <img 
                      src={imageUrl} 
                      alt="preview" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-between relative z-10">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded uppercase tracking-wider flex items-center gap-1">
                             <Hash size={10} /> {post.subreddit}
                           </span>
                           <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                             <span className="text-slate-600">via</span> {post.domain}
                           </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-200 group-hover:text-white transition-colors leading-snug line-clamp-2 md:line-clamp-none">
                          {post.title}
                        </h3>
                      </div>
                      
                      <div className="bg-white/5 p-2 rounded-full text-slate-500 group-hover:text-white group-hover:bg-white/20 transition-all shrink-0 -mr-2 -mt-2 group-hover:mr-0 group-hover:mt-0 opacity-0 group-hover:opacity-100">
                         <ExternalLink size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/10 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-slate-400 group-hover:text-green-400 transition-colors">
                        <ArrowUpCircle size={12} /> {post.score > 1000 ? (post.score/1000).toFixed(1) + 'k' : post.score} PTS
                    </span>
                    <span className="flex items-center gap-1.5 hidden sm:flex">
                        <User size={12} /> {post.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock size={12} /> {getTimeAgo(post.created_utc)}
                    </span>
                    <span className="flex items-center gap-1.5 ml-auto text-slate-500 group-hover:text-blue-300 transition-colors">
                        <MessageSquare size={12} /> {post.num_comments} COMMENTS
                    </span>
                  </div>
                </div>
              </a>
            );
        })}

        {loadingMore && (
           [...Array(3)].map((_, i) => <SkeletonNewsCard key={`more-${i}`} />)
        )}
      </div>

      {!loading && news.length > 0 && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={loadMore}
            disabled={loadingMore}
            className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-full transition-all disabled:opacity-50 backdrop-blur-md shadow-lg"
          >
            {loadingMore ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400 group-hover:text-white group-hover:translate-y-1 transition-transform" />
            )}
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              {loadingMore ? "Decrypting..." : "Load More Intel"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}