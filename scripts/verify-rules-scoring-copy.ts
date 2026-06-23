import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const rulesPage = readFileSync('src/Rules.tsx', 'utf8');
const resources = readFileSync('src/i18n/resources.ts', 'utf8');

assert.doesNotMatch(rulesPage, />3 \{t\('ui\.pointsShort'\)\}</, '/rules must not show the old exact-score value of 3 points.');
assert.doesNotMatch(rulesPage, />1 \{t\('ui\.pointsShort'\)\}</, '/rules must not show the old correct-outcome value of 1 point.');
assert.doesNotMatch(rulesPage, /knockoutBonus/i, '/rules must not show knockout bonus because backend scoring does not award it.');

assert.match(rulesPage, /5 \{t\('ui\.pointsShort'\)\}/, '/rules must show exact score as 5 points.');
assert.match(rulesPage, /2 \{t\('ui\.pointsShort'\)\}/, '/rules must show correct outcome as 2 points.');
assert.match(rulesPage, /goalDifferenceBonus/, '/rules must explain the goal difference bonus.');
assert.match(rulesPage, /teamScoreBonus/, '/rules must explain the team score bonus.');
assert.match(rulesPage, /riskMultiplier/, '/rules must explain the risk multiplier.');
assert.match(rulesPage, /underdogBonus/, '/rules must explain the underdog bonus.');
assert.match(rulesPage, /streakBonusRuleValue/, '/rules must show the active streak bonus value.');

assert.match(resources, /streakBonusRuleValue: '\+1'/, 'English rules copy must show streak bonus as +1.');
assert.match(resources, /riskMultiplierRuleValue: '1x–2x'/, 'English rules copy must show risk multiplier range.');
assert.match(resources, /underdogBonusRuleValue: '\+0–\+3'/, 'English rules copy must show underdog bonus range.');
assert.match(resources, /streakBonusRuleValue: '\+1'/, 'Vietnamese rules copy must show streak bonus as +1.');
assert.match(resources, /riskMultiplierRuleValue: '1x–2x'/, 'Vietnamese rules copy must show risk multiplier range.');
assert.match(resources, /underdogBonusRuleValue: '\+0–\+3'/, 'Vietnamese rules copy must show underdog bonus range.');

console.log('Rules scoring copy verified.');
