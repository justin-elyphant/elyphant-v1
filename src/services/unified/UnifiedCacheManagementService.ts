import { toast } from "sonner";

export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
  key: string;
  metadata?: Record<string, any>;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  invalidationTags?: string[]; // Tags for targeted invalidation
  dependencies?: string[]; // Cache dependencies
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export class UnifiedCacheManagementService {
  private static instance: UnifiedCacheManagementService;
  private cache: Map<string, CacheEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private dependencyIndex: Map<string, Set<string>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    maxSize: 1000,
    hitRate: 0
  };

  private constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  static getInstance(): UnifiedCacheManagementService {
    if (!this.instance) {
      this.instance = new UnifiedCacheManagementService();
    }
    return this.instance;
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = 30 * 60 * 1000, invalidationTags = [], dependencies = [] } = options;
    
    // Check cache size limit
    if (this.cache.size >= this.stats.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl),
      key,
      metadata: options
    };

    this.cache.set(key, entry);
    
    // Update tag index
    invalidationTags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    // Update dependency index
    dependencies.forEach(dep => {
      if (!this.dependencyIndex.has(dep)) {
        this.dependencyIndex.set(dep, new Set());
      }
      this.dependencyIndex.get(dep)!.add(key);
    });

    this.stats.size = this.cache.size;
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let invalidated = 0;
    keys.forEach(key => {
      if (this.cache.delete(key)) {
        invalidated++;
      }
    });

    this.tagIndex.delete(tag);
    this.stats.size = this.cache.size;
    
    if (invalidated > 0) {
      console.log(`Cache: Invalidated ${invalidated} entries with tag: ${tag}`);
    }
    
    return invalidated;
  }

  /**
   * Invalidate cache entries by dependency
   */
  invalidateByDependency(dependency: string): number {
    const keys = this.dependencyIndex.get(dependency);
    if (!keys) return 0;

    let invalidated = 0;
    keys.forEach(key => {
      if (this.cache.delete(key)) {
        invalidated++;
      }
    });

    this.dependencyIndex.delete(dependency);
    this.stats.size = this.cache.size;
    
    if (invalidated > 0) {
      console.log(`Cache: Invalidated ${invalidated} entries with dependency: ${dependency}`);
    }
    
    return invalidated;
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
      console.log(`Cache: Invalidated entry: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.tagIndex.clear();
    this.dependencyIndex.clear();
    this.stats.size = 0;
    
    if (size > 0) {
      console.log(`Cache: Cleared ${size} entries`);
      toast.info("Cache cleared", {
        description: "All cached data has been refreshed"
      });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache entry with metadata
   */
  getEntry(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }

  /**
   * Update cache entry TTL
   */
  touch(key: string, ttl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const newTtl = ttl || (entry.expiresAt.getTime() - entry.timestamp.getTime());
    entry.expiresAt = new Date(Date.now() + newTtl);
    entry.timestamp = new Date();
    
    return true;
  }

  /**
   * Smart cache invalidation based on data relationships
   */
  smartInvalidate(dataType: string, operation: 'create' | 'update' | 'delete', userId?: string): void {
    const invalidationRules = {
      'profile': ['user-data', 'profile-data'],
      'wishlist': ['user-data', 'wishlist-data', 'gift-data'],
      'connection': ['user-data', 'connection-data', 'social-data'],
      'gift': ['gift-data', 'marketplace-data'],
      'order': ['order-data', 'user-data'],
      'message': ['message-data', 'conversation-data'],
      'setting': ['user-data', 'profile-data']
    };

    const tags = invalidationRules[dataType as keyof typeof invalidationRules] || [];
    
    tags.forEach(tag => {
      if (userId) {
        this.invalidateByTag(`${tag}-${userId}`);
      }
      this.invalidateByTag(tag);
    });

    // Invalidate user-specific data
    if (userId) {
      this.invalidateByDependency(`user-${userId}`);
    }
  }

  /**
   * Preload data into cache
   */
  preload<T>(key: string, dataLoader: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        const cached = this.get<T>(key);
        if (cached) {
          resolve(cached);
          return;
        }

        const data = await dataLoader();
        this.set(key, data, options);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.size = this.cache.size;
    
    if (cleaned > 0) {
      console.log(`Cache: Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp.getTime() < oldestTime) {
        oldest = key;
        oldestTime = entry.timestamp.getTime();
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

export const unifiedCacheManagementService = UnifiedCacheManagementService.getInstance();