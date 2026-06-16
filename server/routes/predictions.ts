import { Router } from 'express';
import { readDb, updateDb } from '../db/jsonDb';
import { ApiServiceError, getPredictionBreakdown, savePrediction, updatePrediction } from '../services/predictionService';
import type { PredictionPayload } from '../types';

export const predictionsRouter = Router();
const currentUserId = 'user-you';

function handleError(error: unknown, res: import('express').Response) {
  if (error instanceof ApiServiceError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }
  return res.status(500).json({ error: { code: 'server_error', message: 'Unexpected server error.' } });
}

predictionsRouter.get('/predictions/me', (_req, res) => {
  const db = readDb();
  const predictions = db.predictions
    .filter((prediction) => prediction.userId === currentUserId)
    .map((prediction) => {
      const match = db.matches.find((item) => item.id === prediction.matchId);
      return { prediction, match };
    });
  res.json(predictions);
});

predictionsRouter.post('/predictions', (req, res) => {
  try {
    const prediction = updateDb((db) => savePrediction(db, currentUserId, req.body as PredictionPayload));
    return res.status(201).json(prediction);
  } catch (error) {
    return handleError(error, res);
  }
});

predictionsRouter.patch('/predictions/:id', (req, res) => {
  try {
    const prediction = updateDb((db) => updatePrediction(db, currentUserId, req.params.id, req.body as PredictionPayload));
    return res.json(prediction);
  } catch (error) {
    return handleError(error, res);
  }
});

predictionsRouter.get('/predictions/:id/breakdown', (req, res) => {
  try {
    return res.json(getPredictionBreakdown(readDb(), req.params.id));
  } catch (error) {
    return handleError(error, res);
  }
});
