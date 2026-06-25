import { strict as assert } from 'node:assert';
import {
  buildCommunityDistributions,
  calculatePredictionScores,
  type PredictionScoringRow,
  type TeamSignalRow,
} from '../supabase/functions/_shared/scoringRules.ts';

const teams = new Map<string, TeamSignalRow>([
  ['strong', { id: 'strong', fifa_rank: 5 }],
  ['weak', { id: 'weak', fifa_rank: 42 }],
  ['weaker', { id: 'weaker', fifa_rank: 70 }],
]);

function prediction(overrides: Partial<PredictionScoringRow>): PredictionScoringRow {
  return {
    id: 'prediction-1',
    user_id: 'user-1',
    match_id: 'match-1',
    prediction_type: 'outcome_only',
    home_score: null,
    away_score: null,
    predicted_outcome: 'home',
    is_risk_pick: false,
    matches: {
      home_score: 1,
      away_score: 0,
      kickoff_at: '2026-06-01T00:00:00.000Z',
      home_team_id: 'strong',
      away_team_id: 'weak',
      espn_home_win_pct: 55,
      espn_draw_pct: 25,
      espn_away_win_pct: 20,
    },
    ...overrides,
  };
}

const threeCorrect = calculatePredictionScores([
  prediction({ id: 'a', match_id: 'a', matches: { ...prediction({}).matches, kickoff_at: '2026-06-01T00:00:00.000Z' } }),
  prediction({ id: 'b', match_id: 'b', matches: { ...prediction({}).matches, kickoff_at: '2026-06-02T00:00:00.000Z' } }),
  prediction({ id: 'c', match_id: 'c', matches: { ...prediction({}).matches, kickoff_at: '2026-06-03T00:00:00.000Z' } }),
], { teams });
assert.deepEqual(threeCorrect.map((score) => score.streak_bonus), [0, 1, 1], 'consecutive correct predictions should earn streak bonuses after the first hit');

const resetStreak = calculatePredictionScores([
  prediction({ id: 'd', match_id: 'd', predicted_outcome: 'home', matches: { ...prediction({}).matches, kickoff_at: '2026-06-01T00:00:00.000Z', home_score: 1, away_score: 0 } }),
  prediction({ id: 'e', match_id: 'e', predicted_outcome: 'away', matches: { ...prediction({}).matches, kickoff_at: '2026-06-02T00:00:00.000Z', home_score: 1, away_score: 0 } }),
  prediction({ id: 'f', match_id: 'f', predicted_outcome: 'home', matches: { ...prediction({}).matches, kickoff_at: '2026-06-03T00:00:00.000Z', home_score: 1, away_score: 0 } }),
], { teams });
assert.deepEqual(resetStreak.map((score) => score.streak_bonus), [0, 0, 0], 'missed predictions should reset streak before the next correct pick');

const espnRisk = calculatePredictionScores([
  prediction({
    id: 'risk-28',
    is_risk_pick: true,
    predicted_outcome: 'away',
    matches: { ...prediction({}).matches, home_score: 0, away_score: 1, espn_home_win_pct: 52, espn_draw_pct: 20, espn_away_win_pct: 28 },
  }),
], { teams })[0];
assert.equal(espnRisk.risk_multiplier, 1.5, 'risk pick at 28% ESPN probability should use 1.5x multiplier');
assert.equal(espnRisk.underdog_bonus, 1, 'correct 28% ESPN outcome should get tiered underdog bonus');
assert.equal(espnRisk.total, 5, '2 base + 1 underdog at 1.5x should round to 5');

const nonRiskUnderdog = calculatePredictionScores([
  prediction({
    id: 'non-risk-underdog',
    is_risk_pick: false,
    predicted_outcome: 'away',
    matches: { ...prediction({}).matches, home_score: 0, away_score: 1, espn_home_win_pct: 70, espn_draw_pct: 18, espn_away_win_pct: 12 },
  }),
], { teams })[0];
assert.equal(nonRiskUnderdog.risk_multiplier, 1, 'non-risk picks should keep neutral multiplier');
assert.equal(nonRiskUnderdog.underdog_bonus, 3, 'correct 12% ESPN outcome should get max underdog bonus');
assert.equal(nonRiskUnderdog.total, 5, '2 base + 3 underdog should total 5 without risk multiplier');

const fifaFallbackRisk = calculatePredictionScores([
  prediction({
    id: 'fifa-risk',
    is_risk_pick: true,
    predicted_outcome: 'away',
    matches: {
      ...prediction({}).matches,
      home_score: 0,
      away_score: 1,
      home_team_id: 'strong',
      away_team_id: 'weaker',
      espn_home_win_pct: null,
      espn_draw_pct: null,
      espn_away_win_pct: null,
    },
  }),
], { teams })[0];
assert.equal(fifaFallbackRisk.risk_multiplier, 1.5, 'missing ESPN should fallback to 1.5x when predicted team is weaker by FIFA rank');
assert.equal(fifaFallbackRisk.underdog_bonus, 3, 'large FIFA rank gap should produce max fallback underdog tier');

const communityPredictions = [
  ...Array.from({ length: 8 }, (_, index) => prediction({ id: `home-${index}`, match_id: 'community', predicted_outcome: 'home' })),
  prediction({ id: 'draw-1', match_id: 'community', predicted_outcome: 'draw' }),
  prediction({ id: 'away-1', match_id: 'community', predicted_outcome: 'away' }),
];
const community = buildCommunityDistributions(communityPredictions);
const communityFallback = calculatePredictionScores([
  prediction({
    id: 'community-draw',
    match_id: 'community',
    predicted_outcome: 'draw',
    matches: {
      ...prediction({}).matches,
      home_score: 1,
      away_score: 1,
      espn_home_win_pct: null,
      espn_draw_pct: null,
      espn_away_win_pct: null,
    },
  }),
], { teams, community })[0];
assert.equal(communityFallback.underdog_bonus, 1, 'low community share should nudge fallback underdog bonus by one tier');

const missed = calculatePredictionScores([
  prediction({
    id: 'missed-risk',
    is_risk_pick: true,
    predicted_outcome: 'away',
    matches: { ...prediction({}).matches, home_score: 1, away_score: 0, espn_home_win_pct: 70, espn_draw_pct: 18, espn_away_win_pct: 12 },
  }),
], { teams })[0];
assert.equal(missed.outcome, 'missed');
assert.equal(missed.underdog_bonus, 0, 'missed picks should not receive underdog bonus');
assert.equal(missed.total, 0, 'missed picks should stay at zero even with a risk multiplier');

console.log('Smart scoring bonuses verified.');
