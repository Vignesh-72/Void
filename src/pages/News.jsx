import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ExternalLink, MessageSquare, User, Clock, ArrowUpCircle, ChevronDown, RefreshCw } from 'lucide-react';
import { CACHE_KEYS } from '../utils/cacheManager';
// IMPORT LOADER
import Loader from '../components/Loader';

export default function News({ cacheContext }) {
  const { updateCache, getCache, isCacheStale, clearCache } = cacheContext || {
    updateCache: () => {},
    getCache: () => null,
    isCacheStale: () => false,
    clearCache: () => {}
  };
  
  // --- 1. SYNC CACHE CHECK ---
  const CACHE_TTL = 10 * 60 * 1000;
  
  const normalizeData = (cachedData) => {
    if (!cachedData) return [];
    if (Array.isArray(cachedData)) return cachedData;
    return Object.entries(cachedData)
      .filter(([key]) => !key.startsWith('_'))
      .map(([, value]) => value);
  };

  const cachedEntry = getCache(CACHE_KEYS.REDDIT_NEWS);
  const isStale = isCacheStale(CACHE_KEYS.REDDIT_NEWS);
  const hasValidData = cachedEntry && !isStale;

  // --- 2. INIT STATE ---
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

  const fetchNews = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
      setError(null);
    } else if (!hasValidData) {
      setLoading(true);
    }

    try {
      if (!forceRefresh && hasValidData) {
         // Data already loaded from sync check
         setLoading(false);
         return;
      }

      const res = await axios.get('https://www.reddit.com/r/spacex/hot.json?limit=15&raw_json=1');
      
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
        updateCache(CACHE_KEYS.REDDIT_NEWS, enrichedNews, { ttl: CACHE_TTL });
      } else {
        throw new Error("Invalid API response format");
      }
      
    } catch (err) {
      console.error("News fetch error:", err);
      setError("Unable to decrypt signal. Check connection.");
      // Fallback
      if (cachedEntry) {
        setNews(normalizeData(cachedEntry));
        setUsingCachedData(true);
        setError(null);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [updateCache, getCache, isCacheStale, hasValidData]);

  useEffect(() => {
    // Only fetch if we didn't start with data
    if (!hasValidData) {
        fetchNews();
    }
  }, []); // Run once on mount

  const loadMore = useCallback(async () => {
    if (!lastToken || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      const res = await axios.get(`https://www.reddit.com/r/spacex/hot.json?limit=10&after=${lastToken}&raw_json=1`);
      
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
          updateCache(CACHE_KEYS.REDDIT_NEWS, updatedNews, { ttl: CACHE_TTL });
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

  const handleRefresh = () => {
    if (clearCache) {
      clearCache(CACHE_KEYS.REDDIT_NEWS);
    }
    fetchNews(true);
  };

  // 3. LOADER UI
  if (loading) return <Loader text="DECRYPTING INTEL FEED..." />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between gap-4 border-b border-white/10 pb-6 sticky top-0 bg-black/80 backdrop-blur-xl z-20 pt-4 rounded-b-3xl -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-black italic tracking-tighter text-white">
              NEWS FEED
            </h2>
            <div className="flex items-center gap-2">
              {usingCachedData && (
                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-1 rounded border border-white/10">
                  OFFLINE ARCHIVE
                </span>
              )}
              {isRefreshing && (
                <span className="text-[10px] bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1 border border-white/10">
                  <RefreshCw className="w-3 h-3 animate-spin" /> SYNCING
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-mono text-slate-500">SOURCE: r/SPACEX // ENCRYPTED</p>
            {lastFetchTime && (
              <p className="text-[10px] font-mono text-slate-500">
                UPDATED: {new Date(lastFetchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white disabled:opacity-50 hover:scale-105 active:scale-95 shadow-sm"
            title="Refresh news"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-white/5 border border-red-500/20 rounded-xl p-4 flex items-center justify-between backdrop-blur-md">
          <p className="text-red-300 text-sm font-mono">{error}</p>
          <button
            onClick={() => fetchNews(true)}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 text-xs font-bold rounded-lg transition-colors border border-red-500/20"
          >
            RETRY UPLINK
          </button>
        </div>
      )}

      {/* FEED GRID */}
      <div className="grid grid-cols-1 gap-4">
        {news.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
            <p className="text-slate-500 font-mono mb-4">NO INTEL FOUND IN SECTOR</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-bold text-sm border border-white/10"
            >
              FORCE REFRESH
            </button>
          </div>
        ) : (
          news.map((item, index) => {
            const post = item.data;
            const hasImage = post.thumbnail && post.thumbnail.startsWith('http');

            return (
              <a 
                key={`${post.id}-${index}`}
                href={`https://reddit.com${post.permalink}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 flex flex-col md:flex-row gap-6 overflow-hidden backdrop-blur-md shadow-lg"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {hasImage && (
                  <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden border border-white/10 shrink-0 relative bg-black/50">
                    <img 
                      src={post.thumbnail} 
                      alt="preview" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 grayscale group-hover:grayscale-0" 
                    />
                    {post.link_flair_text && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md text-[10px] font-bold text-white uppercase rounded border border-white/10">
                        {post.link_flair_text}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold text-slate-200 group-hover:text-white transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <ExternalLink className="text-slate-500 group-hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100" size={18} />
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-2 truncate">VIA: <span className="text-slate-400 hover:underline">{post.domain}</span></p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/10 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-slate-400 group-hover:text-white"><ArrowUpCircle size={12} /> {post.score > 1000 ? (post.score/1000).toFixed(1) + 'k' : post.score} PTS</span>
                    <span className="flex items-center gap-1.5"><User size={12} /> {post.author}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {getTimeAgo(post.created_utc)}</span>
                    <span className="flex items-center gap-1.5 ml-auto text-slate-500 group-hover:text-white transition-colors"><MessageSquare size={12} /> {post.num_comments} COMMENTS</span>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* LOAD MORE BUTTON */}
      {news.length > 0 && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={loadMore}
            disabled={loadingMore}
            className="group flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-full transition-all disabled:opacity-50 backdrop-blur-md"
          >
            {loadingMore ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronDown size={18} className="text-slate-400 group-hover:text-white group-hover:translate-y-1 transition-transform" />
            )}
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              {loadingMore ? "Loading..." : "Load More Intel"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}