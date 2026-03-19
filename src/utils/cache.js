/**
 * HIGH-PERFORMANCE DATA CACHE
 * (｡♥‿♥｡) Keeps your terminal lightning fast by reducing database strain!
 */

const cacheStore = new Map();

const cache = {
  /**
   * Get data from cache or fetch new data and store it.
   * @param {string} key - Unique key for this data
   * @param {number} ttlMs - Time to live in milliseconds
   * @param {Function} fetchFn - Async function to fetch data if not in cache
   */
  get: async (key, ttlMs, fetchFn) => {
    const now = Date.now();
    const entry = cacheStore.get(key);

    if (entry && entry.expiry > now) {
      console.log(`[Cache] HIT: "${key}" (Saving ~150ms)`);
      return entry.data;
    }

    console.log(`[Cache] MISS: "${key}" (Fetching from Source)`);
    const data = await fetchFn();
    
    cacheStore.set(key, {
      data,
      expiry: now + ttlMs
    });

    return data;
  },

  /**
   * Manually invalidate a cache entry.
   */
  invalidate: (key) => {
    cacheStore.delete(key);
  }
};

module.exports = cache;
