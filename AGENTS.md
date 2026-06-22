# Repository Guidelines

## Project Structure & Module Organization

This repository contains Predict 2026, a World Cup exact-score prediction app. Frontend code lives in `src/`, with route pages in `src/pages/`, shared UI in `src/components/`, domain helpers in `src/lib/`, API clients in `src/services/`, mock data in `src/data/`, and shared types in `src/types/`. Static assets are in `public/`, `src/assets/`, and `badge_png/`.

The local Express API is under `server/`, organized by `routes/`, `services/`, and `db/`. Supabase migrations, seed data, and Edge Functions are under `supabase/`. Planning and design notes are kept in `docs/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite frontend on `http://localhost:3000`.
- `npm run server:dev`: run the local TypeScript Express API with `tsx`.
- `npm run build`: create a production Vite build in `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run `tsc --noEmit` for TypeScript validation.
- `npm run data:sync:espn` / `npm run data:sync:worldcup`: refresh World Cup data.
- `npm run supabase:types`: regenerate `src/types/supabase.ts` from the linked Supabase project.

## Coding Style & Naming Conventions

Use TypeScript, React functional components, and the Vite alias pattern (`@/...`). Follow the local style: 2-space indentation, single quotes, semicolons, and named exports where nearby files already use them. Use PascalCase for React components and page files, camelCase for functions and variables, and descriptive service names such as `predictionService.ts`.

Keep UI primitives in `src/components/ui/`, layout components in `src/components/layout/`, and route-level screens in `src/pages/`.

## Testing Guidelines

There is no dedicated test script configured. Before submitting changes, run `npm run lint` and `npm run build`. For scoring, prediction, auth, or leaderboard changes, add focused validation around the relevant helper or service if introducing tests, and document the command used.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects such as `Fix auth session persistence`. Keep commit titles concise, action-oriented, and scoped to one change.

Pull requests should include a brief summary, validation commands, linked issue or task context when available, and screenshots for visible UI changes. Note Supabase migrations, generated type updates, or environment variable changes.

## Security & Configuration Tips

Use `.env.example` as the local configuration template. Do not commit real Supabase keys, service-role secrets, local databases, or build output. Treat `src/types/supabase.ts` as generated; update it with `npm run supabase:types`.
