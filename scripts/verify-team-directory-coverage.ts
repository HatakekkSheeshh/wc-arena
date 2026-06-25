import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const teamsService = readFileSync('src/services/teams.ts', 'utf8');
assert.doesNotMatch(teamsService, /\.limit\(64\)/, 'Team directory must not be capped at 64 rows because World Cup 2026 has more teams/placeholders.');
assert.match(teamsService, /\.limit\((?:1[2-9][8-9]|[2-9]\d{2,})\)/, 'Team directory must fetch enough rows to cover the full World Cup 2026 team set.');

const flags = readFileSync('src/utils/teamFlags.ts', 'utf8');
for (const [fifaCode, isoCode] of Object.entries({ POR: 'PT', UZB: 'UZ', PAN: 'PA', CRO: 'HR' })) {
  assert.match(flags, new RegExp(`${fifaCode}: '${isoCode}'`), `${fifaCode} must map to ${isoCode}.`);
  assert.match(flags, new RegExp(`\\b${isoCode}\\b`), `${isoCode} flag must be imported and registered.`);
}

console.log('Team directory coverage verified.');
