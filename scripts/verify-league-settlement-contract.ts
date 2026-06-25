import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const sharedLeagueEvents = readFileSync('supabase/functions/_shared/leagueEvents.ts', 'utf8');
assert.match(sharedLeagueEvents, /if \(curve === 'balanced_top3'\) return \[50, 30, 20\]/, 'balanced_top3 must keep the documented 50/30/20 rank shares');
assert.match(sharedLeagueEvents, /const pointSplit = rawTotal > 0 \? \(isLast \? recognitionPool - assigned : Math\.round\(\(item\.rawPointSplit \/ rawTotal\) \* recognitionPool\)\) : 0/, 'settlement must distribute the full recognition pool across eligible winners');

const leagueEventsService = readFileSync('src/services/leagueEvents.ts', 'utf8');
assert.match(leagueEventsService, /points:\s*number/, 'settleLeagueEvent response must expose refreshed current-user points');

const leagueDetail = readFileSync('src/pages/LeagueDetail.tsx', 'utf8');
assert.match(leagueDetail, /const result = await settleLeagueEvent\(\{ eventId \}\)/, 'handleSettleEvent must keep the settle response');
assert.match(leagueDetail, /wc26:profile-points-changed[^]*detail:\s*\{ points: result\.points \}/, 'handleSettleEvent must notify AppShell with refreshed points');
assert.match(leagueDetail, /setAvailablePoints\(result\.points\)/, 'handleSettleEvent must refresh the local available points label');

console.log('League settlement contract verified.');
