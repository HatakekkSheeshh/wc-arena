import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const picks = readFileSync('src/Picks.tsx', 'utf8');
const matchDetail = readFileSync('src/pages/MatchDetail.tsx', 'utf8');
const submitPrediction = readFileSync('supabase/functions/submit_prediction/index.ts', 'utf8');
const resources = readFileSync('src/i18n/resources.ts', 'utf8');

assert.doesNotMatch(picks, /updateRiskPick/, 'Picks must not expose a manual risk toggle handler.');
assert.doesNotMatch(picks, /type="checkbox"[\s\S]*riskPick/, 'Picks must not render a manual Risk Pick checkbox.');
assert.doesNotMatch(picks, /isRiskPick: prediction\.is_risk_pick/, 'Picks draft state must not preserve risk as an editable UI choice.');
assert.doesNotMatch(picks, /isRiskPick: draft\?\.isRiskPick \?\? false/, 'Picks must not submit user-selected or false risk picks.');
assert.match(picks, /submitPrediction\(\{ matchId: match\.id, predictionType, homeScore, awayScore, predictedOutcome, isRiskPick: true \}\)/, 'Picks submissions must enable automatic risk scoring.');

assert.match(matchDetail, /submitPrediction\(\{[\s\S]*predictedOutcome: nextOutcome,[\s\S]*isRiskPick: true,[\s\S]*\}\)/, 'Match detail submissions must enable automatic risk scoring.');
assert.match(matchDetail, /automaticRiskMultiplierBody/, 'Match detail must explain automatic risk multiplier scoring near prediction controls.');

assert.match(submitPrediction, /is_risk_pick: body\.isRiskPick \?\? true/, 'Backend submit_prediction must default omitted risk picks to true.');

assert.match(resources, /automaticRiskMultiplier: 'Automatic risk multiplier'/, 'English copy must label automatic risk multiplier.');
assert.match(resources, /automaticRiskMultiplierBody: 'Every saved prediction is risk-enabled by default/, 'English copy must explain risk is enabled by default.');
assert.match(resources, /automaticRiskMultiplier: 'Hệ số mạo hiểm tự động'/, 'Vietnamese copy must label automatic risk multiplier.');
assert.match(resources, /automaticRiskMultiplierBody: 'Mọi dự đoán đã lưu đều tự bật hệ số mạo hiểm/, 'Vietnamese copy must explain risk is enabled by default.');
assert.doesNotMatch(resources, /Risk picks use ESPN Signal/, 'English copy must not describe risk as a manually selected pick.');
assert.doesNotMatch(resources, /Dự đoán mạo hiểm dùng/, 'Vietnamese copy must not describe risk as a manually selected pick.');

console.log('Automatic risk pick behavior verified.');
