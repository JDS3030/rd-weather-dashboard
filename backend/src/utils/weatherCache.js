'use strict';

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * In-memory cache for weather data with configurable TTL.
 * Tracks freshness so callers can warn users about stale data.
 */
class WeatherCache {
  constructor(ttl = DEFAULT_TTL_MS) {
    this._data      = null;
    this._fetchedAt = null;
    this._isStale   = false;
    this._ttl       = ttl;
  }

  /** Store new data and mark as fresh. Resets stale flag. */
  set(data) {
    this._data      = data;
    this._fetchedAt = Date.now();
    this._isStale   = false;
  }

  /** Mark current data as stale (API failed but data is still usable). */
  markStale() {
    this._isStale = true;
  }

  /** True if no fetch timestamp exists or TTL has elapsed. */
  isExpired() {
    if (!this._fetchedAt) return true;
    return Date.now() - this._fetchedAt > this._ttl;
  }

  /** True if any data has been stored (fresh or stale). */
  hasData() {
    return this._data !== null;
  }

  /**
   * Returns the cached snapshot.
   * @returns {{ data: any, isStale: boolean, staleFrom: string|null }}
   */
  get() {
    return {
      data:      this._data,
      isStale:   this._isStale,
      staleFrom: this._isStale && this._fetchedAt
        ? new Date(this._fetchedAt).toISOString()
        : null,
    };
  }

  /** Wipes all cached state. Useful for testing and explicit invalidation. */
  clear() {
    this._data      = null;
    this._fetchedAt = null;
    this._isStale   = false;
  }
}

module.exports = { WeatherCache, DEFAULT_TTL_MS };
