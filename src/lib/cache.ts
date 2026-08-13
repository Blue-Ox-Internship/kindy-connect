/**
 * Server-Side High-Performance Cache & SWR Engine
 * Provides memory caching, tag-based invalidation, and metrics for Noble Edu
 */

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  staleAt: number;
  tags: string[];
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  revalidations: number;
  invalidations: number;
  itemCount: number;
  estimatedMemoryBytes: number;
  lastInvalidatedAt: string | null;
}

class ServerCacheManager {
  private cache = new Map<string, CacheEntry>();
  private tagToKeys = new Map<string, Set<string>>();
  private hits = 0;
  private misses = 0;
  private revalidations = 0;
  private invalidations = 0;
  private lastInvalidatedAt: string | null = null;
  private maxItems = 1000;

  /**
   * Fetch data with cache wrapper and Stale-While-Revalidate pattern
   */
  async cachedFetch<T>(
    key: string,
    ttlSeconds: number,
    tags: string[],
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (entry) {
      // Check if entry is completely expired
      if (now < entry.expiresAt) {
        // If entry is fresh, return immediately (Cache Hit)
        if (now < entry.staleAt) {
          this.hits++;
          return entry.value as T;
        }

        // If entry is stale but not expired: return stale data immediately & revalidate asynchronously
        this.hits++;
        this.revalidations++;
        this.revalidateInBackground(key, ttlSeconds, tags, fetcher);
        return entry.value as T;
      }
    }

    // Cache Miss or hard expired -> fetch fresh
    this.misses++;
    const freshValue = await fetcher();
    this.set(key, freshValue, ttlSeconds, tags);
    return freshValue;
  }

  private async revalidateInBackground<T>(
    key: string,
    ttlSeconds: number,
    tags: string[],
    fetcher: () => Promise<T>,
  ) {
    try {
      const freshValue = await fetcher();
      this.set(key, freshValue, ttlSeconds, tags);
    } catch (err) {
      console.warn(`[ServerCache] Background revalidation failed for ${key}:`, err);
    }
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300, tags: string[] = []): void {
    const now = Date.now();
    const staleMs = Math.max(1000, (ttlSeconds / 2) * 1000); // Become stale halfway through TTL
    const expireMs = ttlSeconds * 1000;

    // Enforce MAX capacity via LRU eviction
    if (this.cache.size >= this.maxItems && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.delete(oldestKey);
    }

    const entry: CacheEntry<T> = {
      value,
      staleAt: now + staleMs,
      expiresAt: now + expireMs,
      tags,
      createdAt: now,
    };

    this.cache.set(key, entry);

    // Register tag mappings
    for (const tag of tags) {
      if (!this.tagToKeys.has(tag)) {
        this.tagToKeys.set(tag, new Set());
      }
      this.tagToKeys.get(tag)!.add(key);
    }
  }

  /**
   * Delete single key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remove from tag index
    for (const tag of entry.tags) {
      const keySet = this.tagToKeys.get(tag);
      if (keySet) {
        keySet.delete(key);
        if (keySet.size === 0) this.tagToKeys.delete(tag);
      }
    }

    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys associated with specific tag(s)
   */
  invalidateTags(tags: string[]): number {
    let invalidatedCount = 0;
    const nowStr = new Date().toISOString();

    for (const tag of tags) {
      const keySet = this.tagToKeys.get(tag);
      if (keySet) {
        const keysToEvict = Array.from(keySet);
        for (const key of keysToEvict) {
          if (this.delete(key)) {
            invalidatedCount++;
          }
        }
      }
    }

    if (invalidatedCount > 0) {
      this.invalidations += invalidatedCount;
      this.lastInvalidatedAt = nowStr;
    }

    return invalidatedCount;
  }

  /**
   * Purge entire cache
   */
  purgeAll(): void {
    this.cache.clear();
    this.tagToKeys.clear();
    this.invalidations++;
    this.lastInvalidatedAt = new Date().toISOString();
  }

  /**
   * Get current cache stats
   */
  getStats(): CacheStats {
    let estimatedMemoryBytes = 0;
    try {
      // Rough JSON serialization memory estimation
      for (const [_, entry] of this.cache) {
        estimatedMemoryBytes += JSON.stringify(entry.value).length * 2;
      }
    } catch {
      estimatedMemoryBytes = this.cache.size * 1024;
    }

    return {
      hits: this.hits,
      misses: this.misses,
      revalidations: this.revalidations,
      invalidations: this.invalidations,
      itemCount: this.cache.size,
      estimatedMemoryBytes,
      lastInvalidatedAt: this.lastInvalidatedAt,
    };
  }
}

// Global singleton instance for server process
export const serverCache = new ServerCacheManager();
