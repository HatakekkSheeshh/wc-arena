import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const landing = readFileSync('src/Landing.tsx', 'utf8');

assert.match(landing, /import \{ useAuth \} from '\.\/lib\/auth'/, 'Landing must use the shared auth state instead of blindly sending CTAs to register.');
assert.match(landing, /import \{ supabase \} from '\.\/lib\/supabaseClient'/, 'Landing CTA must be able to check the current Supabase session at click time.');
assert.match(landing, /const \{ user \} = useAuth\(\)/, 'Landing must read shared auth state for the rendered session.');
assert.match(landing, /async function handlePredictionCta\(\)/, 'Landing must centralize prediction CTA navigation in an async handler.');
assert.match(landing, /const \{ data \} = await supabase\.auth\.getSession\(\)/, 'Landing CTA must refresh the current session at click time before deciding where to route.');
assert.match(landing, /onNavigate\(data\.session\?\.user \? 'picks' : user \? 'picks' : 'register'\)/, 'Landing prediction CTAs must route any authenticated session to picks and guests to register.');

const registerButtonMatches = landing.match(/onClick=\{\(\) => onNavigate\('register'\)\}/g) ?? [];
assert.equal(registerButtonMatches.length, 0, 'Landing primary CTAs must not hardcode register navigation.');

const ctaHandlerMatches = landing.match(/onClick=\{handlePredictionCta\}/g) ?? [];
assert.ok(ctaHandlerMatches.length >= 2, 'Landing Join Now and Make Predictions CTAs must use the authenticated prediction handler.');

console.log('Landing authenticated CTAs verified.');
