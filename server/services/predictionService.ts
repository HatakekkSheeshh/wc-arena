import { calculatePredictionScore } from '../../src/lib/scoring';
import type { Match, MatchResult, Prediction } from '../../src/types/domain';
import type { PredictDb, PredictionPayload } from '../types';
import { addActivity } from './activityService';

export class ApiServiceError extends Error {
  constructor(public code: 'not_found' | 'validation_error' | 'locked', message: string, public status: number) {
    super(message);
  }
}

function getMatchResult(match: Match): MatchResult | undefined {
  if (typeof match.homeScore !== 'number' || typeof match.awayScore !== 'number') return undefined;
  return { homeScore: match.homeScore, awayScore: match.awayScore };
}

function validatePayload(payload: PredictionPayload) {
  if (!payload || typeof payload.matchId !== 'string') {
    throw new ApiServiceError('validation_error', 'matchId is required.', 400);
  }
  if (!Number.isInteger(payload.homeScore) || !Number.isInteger(payload.awayScore) || payload.homeScore < 0 || payload.awayScore < 0) {
    throw new ApiServiceError('validation_error', 'Scores must be non-negative integers.', 400);
  }
  if (payload.confidence !== undefined && (!Number.isInteger(payload.confidence) || payload.confidence < 0 || payload.confidence > 100)) {
    throw new ApiServiceError('validation_error', 'Confidence must be an integer from 0 to 100.', 400);
  }
}

function assertMatchEditable(match: Match) {
  if (match.status === 'locked' || match.status === 'live' || match.status === 'finished') {
    throw new ApiServiceError('locked', 'Predictions are locked for this match.', 409);
  }
  if (Date.now() >= new Date(match.lockAt).getTime()) {
    throw new ApiServiceError('locked', 'Prediction lock time has passed.', 409);
  }
}

export function savePrediction(db: PredictDb, userId: string, payload: PredictionPayload) {
  validatePayload(payload);
  const match = db.matches.find((item) => item.id === payload.matchId);
  if (!match) throw new ApiServiceError('not_found', 'Match not found.', 404);
  assertMatchEditable(match);

  const existing = db.predictions.find((prediction) => prediction.userId === userId && prediction.matchId === payload.matchId);
  const now = new Date().toISOString();

  if (existing) {
    existing.homeScore = payload.homeScore;
    existing.awayScore = payload.awayScore;
    existing.confidence = payload.confidence ?? existing.confidence;
    existing.isRiskPick = payload.isRiskPick ?? existing.isRiskPick;
    existing.updatedAt = now;
    existing.revision += 1;
    existing.status = 'submitted';
    addActivity(db, {
      type: 'prediction_locked',
      title: 'Prediction updated',
      description: `Your prediction for ${match.id} was updated before lock.`,
      userId,
      matchId: match.id,
      predictionId: existing.id,
      href: `/matches/${match.id}`,
    });
    return existing;
  }

  const prediction: Prediction = {
    id: `pred-${userId}-${payload.matchId}-${Date.now()}`,
    userId,
    matchId: payload.matchId,
    homeScore: payload.homeScore,
    awayScore: payload.awayScore,
    confidence: payload.confidence ?? 70,
    isRiskPick: payload.isRiskPick ?? false,
    createdAt: now,
    updatedAt: now,
    status: 'submitted',
    revision: 1,
  };

  db.predictions.push(prediction);
  addActivity(db, {
    type: 'prediction_locked',
    title: 'Prediction submitted',
    description: `Your exact-score prediction for ${match.id} was saved before kickoff.`,
    userId,
    matchId: match.id,
    predictionId: prediction.id,
    href: `/matches/${match.id}`,
  });
  return prediction;
}

export function updatePrediction(db: PredictDb, userId: string, predictionId: string, payload: PredictionPayload) {
  const prediction = db.predictions.find((item) => item.id === predictionId && item.userId === userId);
  if (!prediction) throw new ApiServiceError('not_found', 'Prediction not found.', 404);
  return savePrediction(db, userId, { ...payload, matchId: prediction.matchId });
}

export function getPredictionBreakdown(db: PredictDb, predictionId: string) {
  const prediction = db.predictions.find((item) => item.id === predictionId);
  if (!prediction) throw new ApiServiceError('not_found', 'Prediction not found.', 404);
  const match = db.matches.find((item) => item.id === prediction.matchId);
  if (!match) throw new ApiServiceError('not_found', 'Match not found.', 404);
  const result = getMatchResult(match);

  return {
    prediction,
    match,
    result,
    breakdown: result ? calculatePredictionScore(prediction, result, { riskMultiplier: prediction.isRiskPick ? 1 : 1 }) : undefined,
    status: result ? 'scored' : 'pending',
  };
}
