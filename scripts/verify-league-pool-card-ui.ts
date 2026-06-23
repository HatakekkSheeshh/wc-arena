import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const leagueDetail = readFileSync('src/pages/LeagueDetail.tsx', 'utf8');

for (const label of ["{t('ui.stakePoints')}", "{t('ui.poolScorePoints')}"]) {
  const badgeStart = leagueDetail.lastIndexOf('<span', leagueDetail.indexOf(label));
  const badgeEnd = leagueDetail.indexOf('</span>', leagueDetail.indexOf(label));
  const badgeMarkup = leagueDetail.slice(badgeStart, badgeEnd);

  assert.ok(badgeStart >= 0 && badgeEnd > badgeStart, `${label} pool badge must be rendered in a span.`);
  assert.match(badgeMarkup, /rounded-sm/, `${label} pool badge must use rounded styling.`);
}

console.log('League pool card UI verified.');
