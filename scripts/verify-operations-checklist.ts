import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const plan = readFileSync('PRODUCTION_HARDENING_PLAN.md', 'utf8');
const phase10 = plan.slice(plan.indexOf('## Phase 10: Monitoring and operations checklist'));

for (const requiredSection of [
  '### Daily launch checks',
  '### Weekly Supabase checks',
  '### Weekly Vercel checks',
  '### Weekly Upstash checks',
  '### Cron and Edge Function health checks',
  '### Incident response checklist',
  '### Rollback checklist',
  '### Manual recovery commands',
]) {
  assert.match(phase10, new RegExp(requiredSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Phase 10 must include ${requiredSection}.`);
}

for (const requiredText of [
  'Do not print or commit Supabase secrets, Upstash tokens, or sync secrets.',
  'supabase functions list',
  'supabase db lint --linked --schema public --fail-on error',
  'npx tsx scripts/verify-query-hardening.ts',
  'npx tsx scripts/verify-edge-auth-guards.ts',
  'npx tsx scripts/verify-upstash-rate-limits.ts',
  'npx tsx scripts/verify-redis-locks.ts',
  'npx tsx scripts/verify-client-cache.ts',
  'npx tsx scripts/verify-vercel-security-headers.ts',
  'npx tsx scripts/verify-asset-size-budget.ts',
  'npx tsx scripts/verify-auth-hardening.ts',
  'npm run lint',
  'npm run build',
  'Vercel deployment status',
  'Supabase Edge Function errors',
  'Upstash Redis command usage',
  'revert the Git commit and push a new revert commit',
]) {
  assert.ok(phase10.includes(requiredText), `Phase 10 must mention: ${requiredText}`);
}

console.log('Operations checklist verified.');
