import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const app = readFileSync('src/App.tsx', 'utf8');
const navigation = readFileSync('src/config/navigation.ts', 'utf8');
const statisticsPage = readFileSync('src/pages/Statistics.tsx', 'utf8');
const resources = readFileSync('src/i18n/resources.ts', 'utf8');

assert.match(app, /const Statistics = lazy\(\(\) => import\('\.\/pages\/Statistics'\)\)/, 'Statistics page must be lazy-loaded.');
assert.match(app, /<Route path="\/stats" element=\{<Statistics themeControls=\{themeControls\} \/>\}/, 'Statistics page must be routed at /stats.');
assert.match(navigation, /labelKey: 'nav\.items\.statistics', to: '\/stats'/, 'Statistics must be attached to app navigation.');
assert.match(resources, /statistics: 'Statistics'/, 'English nav label must include Statistics.');
assert.match(resources, /statistics: 'Thống kê'/, 'Vietnamese nav label must include Thống kê.');

assert.match(statisticsPage, /<AppShell themeControls=\{themeControls\}>/, 'Statistics page must use AppShell.');
assert.match(statisticsPage, /relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0/, 'Statistics page must follow attached-card page shell spacing.');
assert.match(statisticsPage, /bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-\[6px_6px_0_0_var\(--color-shadow\)\] lg:shadow-\[8px_8px_0_0_var\(--color-shadow\)\] rounded-sm/, 'Statistics page must use the attached main card shell.');
assert.match(statisticsPage, /grid grid-cols-1 sm:grid-cols-3 border-b-4 border-main/, 'Statistics page must attach stat cards to the main card.');
assert.match(statisticsPage, /buildGroupStandings/, 'Statistics page must use the existing group standings utility.');
assert.match(statisticsPage, /keyEvents/, 'Statistics page must derive top scorers from ESPN keyEvents.');
assert.match(statisticsPage, /teamStatDefinitions/, 'Statistics page must include team stats derived from ESPN summaries.');
assert.match(statisticsPage, /function getTeamAliases/, 'Statistics top scorers must map ESPN team names to DB teams.');
assert.match(statisticsPage, /function getGoalTeamNameFromText/, 'Statistics top scorers must parse goal team names from event text.');
assert.match(statisticsPage, /getEventTeamId\(event, match, teams\)/, 'Top scorer mapping must use the team map when resolving event teams.');
assert.doesNotMatch(statisticsPage, /bg-page[^\n]*relative z-10 flex flex-col/, 'Statistics page wrapper must not hide AppShell background with bg-page.');

console.log('Statistics page Phase 1 verified.');
