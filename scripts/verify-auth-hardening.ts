import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const authRedirect = readFileSync('src/utils/authRedirect.ts', 'utf8');
assert.match(authRedirect, /const allowedAuthRedirectPaths = new Set\(/, 'Auth redirect helper must use an explicit allowlist.');
assert.match(authRedirect, /allowedAuthRedirectPaths\.has\(path\)/, 'Auth redirect helper must reject paths outside the allowlist.');
assert.match(authRedirect, /return `\$\{window\.location\.origin\}\$\{nextPath\}`;/, 'Auth redirect helper must only build origin-relative URLs from the sanitized path.');
assert.doesNotMatch(authRedirect, /return `\$\{window\.location\.origin\}\$\{path\}`;/, 'Auth redirect helper must not directly concatenate unsanitized input.');

const supabaseClient = readFileSync('src/lib/supabaseClient.ts', 'utf8');
assert.match(supabaseClient, /export function clearAuthStorage\(\)/, 'Supabase client must expose clearAuthStorage for logout cleanup.');
assert.match(supabaseClient, /window\.localStorage\.removeItem\(key\);[\s\S]*window\.sessionStorage\.removeItem\(key\);/, 'Auth cleanup must clear Supabase tokens from both localStorage and sessionStorage.');
assert.match(supabaseClient, /key\.startsWith\('sb-'\) && key\.endsWith\('-auth-token'\)/, 'Auth cleanup must target Supabase auth token keys.');

const authProvider = readFileSync('src/lib/auth.tsx', 'utf8');
assert.match(authProvider, /import \{ clearAuthStorage, supabase \} from '\.\/supabaseClient';/, 'Auth provider must import clearAuthStorage.');
assert.match(authProvider, /await supabase\.auth\.signOut\(\);[\s\S]*clearAuthStorage\(\);/, 'signOut must clear local auth storage after Supabase logout.');

console.log('Auth hardening verified.');
