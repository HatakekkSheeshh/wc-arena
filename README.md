# Predict 2026

Predict 2026 is a World Cup 2026 exact-score prediction arena. Players submit score predictions, earn points from transparent scoring rules, compare rankings on leaderboards, join leagues, track achievements, and review reward eligibility in a skill-based contest experience.

The product is designed as a prediction and engagement platform, not a betting product. It avoids wagers, odds, deposits, cash balances, and gambling mechanics.

## Highlights

- Exact-score prediction flow for World Cup fixtures
- Transparent scoring engine with exact score, correct outcome, and scoring-version breakdowns
- Global leaderboard, personal prediction history, and match-level prediction details
- Profile, badges, streak-style progress, private leagues, and activity feed surfaces
- Reward and prize-trust screens focused on eligibility, sponsor/community rewards, and manual review
- Read-only admin and anti-cheat MVP with audit logs, suspicious-user signals, and leaderboard recalculation previews
- Express API backed by a local JSON database for MVP development
- Minimal brutalist UI with bold borders, strong typography, and World Cup-inspired color accents
- Light, dark, vintage, rounded-corner, and shadow theme controls

## Tech Stack

- React 19
- Vite 6
- TypeScript 5.8
- Tailwind CSS 4
- React Router
- Express 4
- `tsx` for local TypeScript server execution
- Local file-backed JSON database

## Project Structure

```txt
src/
  components/        Shared layout and UI primitives
  data/              Mock product data used by the frontend and seed database
  lib/               Scoring and domain helpers
  pages/             Route-level product pages
  types/             Shared domain types
server/
  db/                JSON DB helpers and seed creation
  routes/            Express API routes
  services/          Backend domain services
```

## Main App Routes

- `/` — Landing page
- `/login` — Login screen
- `/register` — Registration screen
- `/onboarding` — Onboarding flow
- `/matches` — Fixture list
- `/matches/:matchId` — Match detail
- `/picks` — Pick entry experience
- `/my-predictions` — User prediction history
- `/predictions/:predictionId` — Prediction scoring breakdown
- `/leaderboard` — Rankings
- `/rules` — Scoring and contest rules
- `/prize-pool` — Prize pool overview
- `/profile` — User profile
- `/badges` — Badge collection
- `/leagues` — League list
- `/leagues/:leagueId` — League detail
- `/activity` — Activity feed
- `/rewards` — Reward eligibility and trust layer
- `/admin` — Read-only admin dashboard
- `/admin/audit` — Audit log and anti-cheat checklist

## API Endpoints

The local API is mounted under `/api`.

Core endpoints include:

- `GET /api/health`
- `GET /api/me`
- `GET /api/matches`
- `GET /api/matches/:matchId`
- `GET /api/predictions/me`
- `POST /api/predictions`
- `GET /api/leaderboard`
- `GET /api/badges`
- `GET /api/leagues`
- `GET /api/activity`
- `GET /api/prize-pool`
- `GET /api/rewards/me`

Admin and review endpoints include:

- `GET /api/admin/summary`
- `GET /api/admin/audit`
- `GET /api/admin/suspicious-users`
- `POST /api/admin/leaderboard/recalculate-preview`

The admin API is intentionally read-only or preview-only in this MVP. It does not expose ban, delete, payout, force-result, or destructive leaderboard mutation controls.

## Getting Started

### Prerequisites

- Node.js 20 or newer recommended
- npm

### Install dependencies

```bash
npm install
```

### Run the frontend

```bash
npm run dev
```

The Vite app runs on:

```txt
http://localhost:3000
```

### Run the backend API

In a separate terminal:

```bash
npm run server:dev
```

The API defaults to:

```txt
http://127.0.0.1:4000
```

To run the API on another port:

```bash
API_PORT=4300 npm run server:dev
```

## Development Commands

```bash
npm run dev         # Start the frontend dev server
npm run server:dev  # Start the local Express API
npm run lint        # Type-check the project
npm run build       # Create a production frontend build
npm run preview     # Preview the production build locally
npm run clean       # Remove generated build output
```

## Data and Persistence

The MVP uses deterministic mock data from `src/data` and a local JSON database for the Express API. Runtime database files are generated under `server/db` and are ignored by git.

The JSON DB is intended for local MVP development only. A production deployment should replace it with a real database, authentication, authorization, rate limiting, observability, and hardened admin access controls.

## Scoring Model

The MVP scoring engine currently uses:

- Exact score: 3 points
- Correct match outcome: 1 point
- Missed prediction: 0 points
- Versioned scoring breakdowns for auditability

The scoring module is shared conceptually between frontend prediction breakdowns and backend leaderboard recalculation previews.

## Product Safety Notes

Predict 2026 is positioned as a skill-based prediction contest. The app should continue to avoid betting language and gambling mechanics, including odds, wagers, deposits, entry fees, account balances, or pooled-loss payout mechanics.

Reward surfaces should remain eligibility- and review-oriented, with clear sponsor/community/manual review language.

## Verification

Before shipping changes, run:

```bash
npm run lint
npm run build
```

For backend-related changes, also start the API and probe the relevant `/api` endpoints.
