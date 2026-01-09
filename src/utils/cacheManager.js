// src/utils/cacheManager.js
export const createCacheManager = () => {
  const STORAGE_KEY = 'cosmos_cache_v1';

  // --- PERSISTENCE HELPER: Load from LocalStorage ---
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Maps cannot be directly JSON parsed, we must convert from entries
        const parsed = JSON.parse(stored);
        return new Map(parsed);
      }
    } catch (e) {
      console.warn("Failed to load cache from storage:", e);
    }
    return new Map();
  };

  // Initialize cache from storage
  const cache = loadFromStorage();

  // --- PERSISTENCE HELPER: Save to LocalStorage ---
  const saveToStorage = () => {
    try {
      // Maps must be converted to array of entries for JSON stringify
      const entries = Array.from(cache.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("Cache quota exceeded or storage error:", e);
      // Optional: Clear oldest items if quota exceeded (advanced implementation)
    }
  };

  const set = (key, data, ttl = 5 * 60 * 1000) => { // 5 minutes default
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    saveToStorage(); // Persist immediately on write
  };

  const get = (key) => {
    const item = cache.get(key);
    if (!item) return null;

    // Check if cache is stale
    const isStale = Date.now() - item.timestamp > item.ttl;
    
    // NOTE: We don't auto-delete on read even if stale, 
    // we let the UI decide to use stale data or not.
    
    return {
      data: item.data,
      isStale,
      timestamp: item.timestamp
    };
  };

  const isStale = (key) => {
    const item = cache.get(key);
    if (!item) return true;
    return Date.now() - item.timestamp > item.ttl;
  };

  const clear = (key) => {
    cache.delete(key);
    saveToStorage();
  };

  const clearAll = () => {
    cache.clear();
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    set,
    get,
    isStale,
    clear,
    clearAll,
    getAllKeys: () => Array.from(cache.keys())
  };
};

// Cache keys for different data types
export const CACHE_KEYS = {
  APOD: 'apod_data',
  NEXT_LAUNCH: 'next_launch',
  LAUNCH_MANIFEST: 'launch_manifest',
  LAUNCH_PADS: 'launch_pads',
  ISS_DATA: 'iss_current_position',
  ISS_PASSES: 'iss_passes_',
  REDDIT_NEWS: 'reddit_news',
  ASSETS_ROCKETS: 'assets_rockets_',
  ASSETS_DRAGONS: 'assets_dragons_',
  ASSETS_SHIPS: 'assets_ships_',
  GEOLOCATION: 'geolocation_'
};

// Cache TTLs in milliseconds
export const CACHE_TTLS = {
  APOD: 24 * 60 * 60 * 1000, // 24 hours
  NEXT_LAUNCH: 30 * 60 * 1000, // 30 minutes
  LAUNCH_MANIFEST: 15 * 60 * 1000, // 15 minutes
  LAUNCH_PADS: 24 * 60 * 60 * 1000, // 24 hours (static data)
  ISS_DATA: 5000, // 5 seconds (real-time)
  ISS_PASSES: 60 * 60 * 1000, // 1 hour
  REDDIT_NEWS: 10 * 60 * 1000, // 10 minutes
  ASSETS: 60 * 60 * 1000, // 1 hour
  GEOLOCATION: 7 * 24 * 60 * 60 * 1000 // 7 days
};