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
