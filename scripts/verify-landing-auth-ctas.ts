import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const landing = readFileSync('src/Landing.tsx', 'utf8');

assert.match(landing, /import \{ useAuth \} from '\.\/lib\/auth'/, 'Landing must use the shared auth state instead of blindly sending CTAs to register.');
assert.match(landing, /const \{ user, loading: authLoading \} = useAuth\(\)/, 'Landing must read user and auth loading state.');
assert.match(landing, /const predictionCtaTarget = authLoading \? null : user \? 'picks' : 'register'/, 'Landing must resolve prediction CTAs to picks for authenticated users and register for guests.');
assert.match(landing, /function handlePredictionCta\(\)/, 'Landing must centralize prediction CTA navigation.');
assert.match(landing, /if \(!predictionCtaTarget\) return/, 'Landing must avoid routing to auth while the session is still loading.');

const registerButtonMatches = landing.match(/onClick=\{\(\) => onNavigate\('register'\)\}/g) ?? [];
assert.equal(registerButtonMatches.length, 0, 'Landing primary CTAs must not hardcode register navigation.');

const ctaHandlerMatches = landing.match(/onClick=\{handlePredictionCta\}/g) ?? [];
assert.ok(ctaHandlerMatches.length >= 2, 'Landing Join Now and Make Predictions CTAs must use the authenticated prediction handler.');

console.log('Landing authenticated CTAs verified.');
