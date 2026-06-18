# ESPN Enrichment and Prediction Signals Design

## Goal
Enhance Predict 2026 with ESPN-powered match context and a non-betting “Community vs ESPN Signal” module, while adding explicit win/draw/loss outcome picks alongside the existing exact-score predictions.

## Product framing
Predict 2026 remains a free-to-play, skill-based prediction contest. ESPN odds-like data may be transformed into percentages, but the app must never display betting vocabulary, sportsbook/provider branding, raw odds, betting links, or disclaimers. The user-facing language is “prediction signal”, “forecast”, and “win probability”.

## Data sources
OpenFootball remains the source of truth for the complete World Cup 2026 schedule. ESPN supplements matched fixtures through existing `espn_event_id` metadata.

Use ESPN scoreboard for:
- live display clock
- status state/detail
- play-by-play availability
- attendance
- winner markers
- team logos/colors/records where present

Use ESPN summary for:
- venue: `gameInfo.venue.fullName`, `address.city`, `address.country`
- broadcasts
- team statistics
- leaders: goals, assists, shots, saves when present
- last five games / form
- news articles
- sanitized prediction percentages derived from odds-like data

## Sanitization rule
The sync layer may read ESPN `odds` or `pickcenter`, but only to derive percentages. It must not persist or render:
- raw odds
- moneyline/spread/overUnder/drawOdds values
- provider or sportsbook names
- betting links
- disclaimers
- pickcenter footer/header content

Persist only normalized fields such as:
- `espn_home_win_pct`
- `espn_draw_pct`
- `espn_away_win_pct`
- `espn_prediction_updated_at`

The percentages should be normalized to total 100% after converting source values, so the UI never exposes odds mechanics.

## Explicit outcome prediction
The current app lets users enter exact scores. That already implies an outcome, but the UX should also expose an explicit result pick:
- home win
- draw
- away win

Recommended behavior:
- The score inputs remain the primary exact-score pick.
- The outcome selector is shown next to the score inputs.
- When the user edits scores, the outcome selector auto-updates to match the score.
- If the user changes the outcome selector, it guides the score entry but does not invent a score automatically unless the score fields are empty.
- Submission stores both exact score and selected outcome.
- Validation requires score and outcome to agree before saving.

Database options:
- Add `predicted_outcome text` to `public.predictions` with values `home`, `draw`, `away`.
- Backfill existing rows from `home_score` vs `away_score`.
- Keep existing scoring intact: exact score awards exact points; correct outcome uses `predicted_outcome` for clarity and can fall back to scores during migration.

## Community vs ESPN Signal
On match detail, show a brutalist card:

```txt
COMMUNITY VS ESPN SIGNAL

Community picks
MEX 42% | Draw 28% | KOR 30%

ESPN signal
MEX 47% | Draw 25% | KOR 28%
```

Community percentages are computed from submitted predictions for the match using `predicted_outcome` or derived score outcome. ESPN percentages come from the sanitized ESPN prediction fields. If either side has no data, show a compact empty state rather than zeros.

Optional later enhancement: show this compactly on `/matches`, but first implementation should prioritize `/matches/:id` to avoid slowing the match list.

## Match detail UI additions
Add sections to `/matches/:id`:
- Live status strip: `LIVE 54'`, `HALFTIME`, `FULL TIME`, or scheduled detail.
- Venue & broadcast: stadium/city/country and ESPN broadcast names.
- Community vs ESPN Signal.
- Team form: last five games per team.
- Team leaders: goals, assists, shots, saves when available.
- Team stats: goals, assists, conceded, and similar available stats.
- News panel: ESPN articles with external links opened in a new tab and source labeled ESPN.
- Team visual polish: keep flags primary; use ESPN logos/colors only as secondary detail in match cards.

## Backend shape
Prefer a compact set of columns for high-value fields plus one sanitized JSONB payload for flexible summary content:
- scalar columns for live/status/prediction percentages used in lists or filters
- `espn_summary jsonb` for venue, broadcasts, stats, leaders, form, and news
- `espn_summary_updated_at timestamptz`

This avoids many brittle columns for ESPN sections that may be absent or partially populated.

## Verification requirements
- Dry-run ESPN sync must print matched events and sanitized summary sections.
- SQL output mode must show no raw betting/provider/link/disclaimer fields.
- Supabase query must verify prediction percentages and summary JSON exist for matched fixtures.
- TypeScript lint and production build must pass.
- Do not start another frontend dev server because the user already has one running on port 3000.
