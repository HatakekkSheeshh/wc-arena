import express from 'express';
import { activityRouter } from './routes/activity';
import { badgesRouter } from './routes/badges';
import { leaderboardRouter } from './routes/leaderboard';
import { leaguesRouter } from './routes/leagues';
import { matchesRouter } from './routes/matches';
import { meRouter } from './routes/me';
import { predictionsRouter } from './routes/predictions';
import { prizePoolRouter } from './routes/prizePool';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'predict-2026-api' });
});

app.use('/api', meRouter);
app.use('/api', matchesRouter);
app.use('/api', predictionsRouter);
app.use('/api', leaderboardRouter);
app.use('/api', badgesRouter);
app.use('/api', leaguesRouter);
app.use('/api', activityRouter);
app.use('/api', prizePoolRouter);

app.listen(port, () => {
  console.log(`Predict 2026 API listening on http://127.0.0.1:${port}`);
});
