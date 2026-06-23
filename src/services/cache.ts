type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const current = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (current && current.expiresAt > Date.now()) return current.value;

  const value = await loader();
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
}
