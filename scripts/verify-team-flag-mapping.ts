import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const teamFlags = readFileSync('src/utils/teamFlags.ts', 'utf8');
const declarations = readFileSync('src/country-flag-icons.d.ts', 'utf8');

assert.doesNotMatch(teamFlags, /ENG: 'GB'/, 'England must not map to the UK Union Jack flag.');
assert.doesNotMatch(teamFlags, /SCO: 'GB'/, 'Scotland must not map to the UK Union Jack flag.');

assert.match(teamFlags, /GB_ENG/, 'England must use the country-flag-icons GB_ENG subdivision flag.');
assert.match(teamFlags, /GB_SCT/, 'Scotland must use the country-flag-icons GB_SCT subdivision flag.');
assert.match(teamFlags, /ENG: 'GB_ENG'/, 'FIFA ENG must resolve to the England football flag.');
assert.match(teamFlags, /SCO: 'GB_SCT'/, 'FIFA SCO must resolve to the Scotland football flag.');

assert.match(declarations, /export const GB_ENG: FlagComponent;/, 'Local flag declarations must include GB_ENG.');
assert.match(declarations, /export const GB_SCT: FlagComponent;/, 'Local flag declarations must include GB_SCT.');

console.log('Team flag mapping verified.');
