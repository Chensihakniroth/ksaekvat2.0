/**
 * HIGH-PERFORMANCE DATA CACHE
 * (｡♥‿♥｡) Keeps your terminal lightning fast by reducing database strain!
 */

const cacheStore = new Map();

// Periodic cleanup of expired items to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiry < now) {
      cacheStore.delete(key);
    }
  }
}, 3600_000); // Clean every hour

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
      return entry.data;
    }

    const data = await fetchFn();
    
    // Safety: Don't cache undefined/null results for long periods
    const effectiveTtl = data === null || data === undefined ? 5000 : ttlMs;

    cacheStore.set(key, {
      data,
      expiry: now + effectiveTtl
    });

    return data;
  },

  /**
   * Manually invalidate a cache entry.
   */
  invalidate: (key) => {
    cacheStore.delete(key);
  },

  /**
   * Clear all cached data
   */
  clear: () => {
    cacheStore.clear();
  }
};

module.exports = cache;
