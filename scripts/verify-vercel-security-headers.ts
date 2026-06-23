import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers?: Array<{
    source?: string;
    headers?: Array<{ key?: string; value?: string }>;
  }>;
};

const globalHeaderRule = config.headers?.find((rule) => rule.source === '/(.*)');
assert.ok(globalHeaderRule, 'vercel.json must define security headers for all routes.');

const headers = new Map(globalHeaderRule.headers?.map((header) => [header.key, header.value]));

const expectedHeaders = new Map([
  ['Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.upstash.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"],
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
]);

for (const [key, value] of expectedHeaders) {
  assert.equal(headers.get(key), value, `${key} must be configured with the approved production value.`);
}

console.log('Vercel security headers verified.');
