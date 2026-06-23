const lockOwners = new Map<string, string>();

export async function redisCommand<T>(command: unknown[]): Promise<T> {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  if (!url || !token) {
    throw new Error('Missing Upstash Redis server config');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  const body = await response.json().catch(() => null) as { result?: T; error?: string } | null;
  if (!response.ok || body?.error) {
    throw new Error(body?.error ?? `Upstash Redis request failed: ${response.status}`);
  }

  return body?.result as T;
}

export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  const lockValue = crypto.randomUUID();
  const result = await redisCommand<string | null>(['SET', key, lockValue, 'NX', 'EX', ttlSeconds]);
  if (result !== 'OK') return false;

  lockOwners.set(key, lockValue);
  return true;
}

export async function releaseLock(key: string): Promise<void> {
  const lockValue = lockOwners.get(key);
  if (!lockValue) return;

  const currentValue = await redisCommand<string | null>(['GET', key]);
  if (currentValue === lockValue) {
    await redisCommand<number>(['DEL', key]);
  }

  lockOwners.delete(key);
}

export async function getJson<T>(key: string): Promise<T | null> {
  const value = await redisCommand<string | null>(['GET', key]);
  return value ? JSON.parse(value) as T : null;
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redisCommand<string>(['SET', key, JSON.stringify(value), 'EX', ttlSeconds]);
}
