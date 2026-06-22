insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', 'you@predict2026.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'goalguru@predict2026.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'netbuster@predict2026.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'pitchwizard@predict2026.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
on conflict (id) do nothing;

insert into public.teams (id, name, short_name, country_code, fifa_rank, group_code)
values
  ('bra', 'Brazil', 'BRA', 'BR', 5, 'A'),
  ('esp', 'Spain', 'ESP', 'ES', 3, 'A'),
  ('fra', 'France', 'FRA', 'FR', 2, 'B'),
  ('arg', 'Argentina', 'ARG', 'AR', 1, 'B'),
  ('jpn', 'Japan', 'JPN', 'JP', 18, 'C'),
  ('mex', 'Mexico', 'MEX', 'MX', 14, 'C'),
  ('ger', 'Germany', 'GER', 'DE', 10, 'D'),
  ('mar', 'Morocco', 'MAR', 'MA', 12, 'D'),
  ('usa', 'United States', 'USA', 'US', 16, 'E'),
  ('kor', 'South Korea', 'KOR', 'KR', 23, 'E')
on conflict (id) do nothing;

insert into public.profiles (id, username, email, avatar_url, country_code, fan_club_team_id, role, points, rank, accuracy, exact_scores, current_streak, best_streak, created_at)
values
  ('00000000-0000-0000-0000-000000000001', 'YourName', 'you@predict2026.test', null, 'US', 'usa', 'admin', 8, 124, 67, 1, 2, 3, '2026-05-01T12:00:00Z'),
  ('00000000-0000-0000-0000-000000000002', 'GoalGuru', 'goalguru@predict2026.test', 'https://i.pravatar.cc/150?u=1', 'BR', 'bra', 'user', 2450, 1, 78, 41, 7, 11, '2026-04-20T09:00:00Z'),
  ('00000000-0000-0000-0000-000000000003', 'NetBuster', 'netbuster@predict2026.test', 'https://i.pravatar.cc/150?u=2', 'ES', 'esp', 'user', 2120, 2, 73, 34, 5, 9, '2026-04-22T09:00:00Z'),
  ('00000000-0000-0000-0000-000000000004', 'PitchWizard', 'pitchwizard@predict2026.test', 'https://i.pravatar.cc/150?u=3', 'FR', 'fra', 'user', 1980, 3, 70, 32, 4, 8, '2026-04-23T09:00:00Z')
on conflict (id) do nothing;

insert into public.matches (id, stage, group_code, matchday, home_team_id, away_team_id, kickoff_at, lock_at, stadium, city, status, home_score, away_score, result_updated_at)
values
  ('m-bra-esp', 'group', 'A', 1, 'bra', 'esp', '2026-06-12T18:00:00Z', '2026-06-12T17:45:00Z', 'MetLife Stadium', 'New York, USA', 'finished', 2, 1, '2026-06-12T20:00:00Z'),
  ('m-fra-arg', 'group', 'B', 1, 'fra', 'arg', '2026-06-12T21:00:00Z', '2026-06-12T20:45:00Z', 'SoFi Stadium', 'Los Angeles, USA', 'finished', 1, 1, '2026-06-12T23:00:00Z'),
  ('m-jpn-mex', 'group', 'C', 1, 'jpn', 'mex', '2026-06-13T15:00:00Z', '2026-06-13T14:45:00Z', 'NRG Stadium', 'Houston, USA', 'finished', 0, 2, '2026-06-13T17:00:00Z'),
  ('m-ger-mar', 'group', 'D', 2, 'ger', 'mar', '2026-06-14T18:00:00Z', '2026-06-14T17:45:00Z', 'AT&T Stadium', 'Dallas, USA', 'locked', null, null, null),
  ('m-usa-kor', 'group', 'E', 2, 'usa', 'kor', '2026-06-15T21:00:00Z', '2026-06-15T20:45:00Z', 'Hard Rock Stadium', 'Miami, USA', 'open', null, null, null),
  ('m-esp-fra', 'group', 'A', 3, 'esp', 'fra', '2026-06-18T19:00:00Z', '2026-06-18T18:45:00Z', 'Mercedes-Benz Stadium', 'Atlanta, USA', 'scheduled', null, null, null)
on conflict (id) do nothing;

insert into public.predictions (id, user_id, match_id, home_score, away_score, predicted_outcome, confidence, is_risk_pick, status, revision, created_at, updated_at, locked_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'm-bra-esp', 2, 1, 'home', 82, false, 'scored', 2, '2026-06-10T10:00:00Z', '2026-06-12T12:15:00Z', '2026-06-12T17:45:00Z'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'm-fra-arg', 2, 1, 'home', 61, false, 'scored', 1, '2026-06-10T11:00:00Z', '2026-06-12T14:30:00Z', '2026-06-12T20:45:00Z'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'm-jpn-mex', 0, 2, 'away', 74, true, 'scored', 3, '2026-06-11T08:00:00Z', '2026-06-13T09:20:00Z', '2026-06-13T14:45:00Z'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'm-ger-mar', 2, 0, 'home', 68, false, 'locked', 1, '2026-06-13T13:00:00Z', '2026-06-14T08:15:00Z', '2026-06-14T17:45:00Z'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'm-usa-kor', 3, 1, 'home', 70, false, 'submitted', 1, '2026-06-14T10:00:00Z', '2026-06-14T10:00:00Z', null)
on conflict (id) do nothing;

insert into public.prediction_scores (prediction_id, exact_score, correct_outcome, streak_bonus, risk_multiplier, underdog_bonus, total, outcome, scoring_version, calculated_at)
values
  ('10000000-0000-0000-0000-000000000001', 3, 0, 0, 1, 0, 3, 'exact', 'mvp-2026-06-15', '2026-06-12T20:05:00Z'),
  ('10000000-0000-0000-0000-000000000002', 0, 0, 0, 1, 0, 0, 'missed', 'mvp-2026-06-15', '2026-06-12T23:05:00Z'),
  ('10000000-0000-0000-0000-000000000003', 3, 0, 0, 1, 0, 3, 'exact', 'mvp-2026-06-15', '2026-06-13T17:05:00Z')
on conflict (prediction_id) do nothing;

insert into public.leagues (id, name, slug, creator_id, visibility, invite_code, member_count, scoring_mode, prize_mode, created_at)
values
  ('league-global', 'Global Arena', 'global-arena', '00000000-0000-0000-0000-000000000002', 'public', 'GLOBAL26', 12480, 'global', 'sponsor', '2026-04-01T09:00:00Z'),
  ('league-friends', 'Friday Football Crew', 'friday-football-crew', '00000000-0000-0000-0000-000000000001', 'private', 'FRI26', 18, 'global', 'symbolic', '2026-05-20T18:00:00Z')
on conflict (id) do nothing;

insert into public.league_members (league_id, user_id, role, joined_at)
values
  ('league-global', '00000000-0000-0000-0000-000000000001', 'member', '2026-05-01T12:00:00Z'),
  ('league-global', '00000000-0000-0000-0000-000000000002', 'owner', '2026-04-01T09:00:00Z'),
  ('league-global', '00000000-0000-0000-0000-000000000003', 'member', '2026-04-22T09:00:00Z'),
  ('league-global', '00000000-0000-0000-0000-000000000004', 'member', '2026-04-23T09:00:00Z'),
  ('league-friends', '00000000-0000-0000-0000-000000000001', 'owner', '2026-05-20T18:05:00Z')
on conflict (league_id, user_id) do nothing;

insert into public.leaderboard_entries (scope, league_id, user_id, rank, previous_rank, points, exact_scores, accuracy, streak, updated_at)
values
  ('global', null, '00000000-0000-0000-0000-000000000002', 1, 1, 2450, 41, 78, 7, '2026-06-15T22:00:00Z'),
  ('global', null, '00000000-0000-0000-0000-000000000003', 2, 3, 2120, 34, 73, 5, '2026-06-15T22:00:00Z'),
  ('global', null, '00000000-0000-0000-0000-000000000004', 3, 2, 1980, 32, 70, 4, '2026-06-15T22:00:00Z'),
  ('global', null, '00000000-0000-0000-0000-000000000001', 124, 139, 8, 1, 67, 2, '2026-06-15T22:00:00Z'),
  ('league', 'league-global', '00000000-0000-0000-0000-000000000002', 1, 1, 2450, 41, 78, 7, '2026-06-15T22:00:00Z'),
  ('league', 'league-global', '00000000-0000-0000-0000-000000000003', 2, 3, 2120, 34, 73, 5, '2026-06-15T22:00:00Z'),
  ('league', 'league-global', '00000000-0000-0000-0000-000000000004', 3, 2, 1980, 32, 70, 4, '2026-06-15T22:00:00Z'),
  ('league', 'league-global', '00000000-0000-0000-0000-000000000001', 124, 139, 8, 1, 67, 2, '2026-06-15T22:00:00Z'),
  ('league', 'league-friends', '00000000-0000-0000-0000-000000000001', 1, 2, 8, 1, 67, 2, '2026-06-15T22:00:00Z')
on conflict do nothing;

insert into public.badges (id, name, description, category, rarity, icon_path, progress_target)
values
  ('exact-score-merchant', 'Exact Score Merchant', 'Call five exact scores.', 'skill', 'rare', null, 5),
  ('hot-streak', 'Hot Streak', 'Hit three correct outcomes in a row.', 'streak', 'common', null, 3),
  ('risk-taker', 'Risk Taker', 'Score points with a risk pick.', 'risk', 'epic', null, 3),
  ('first-pick', 'First Pick', 'Submit your first match prediction.', 'skill', 'common', null, 1),
  ('outcome-master', 'Outcome Master', 'Call ten match outcomes correctly.', 'skill', 'rare', null, 10),
  ('group-stage', 'Group Stage Grinder', 'Submit predictions across the group stage.', 'event', 'common', null, 12),
  ('knockout', 'Knockout Specialist', 'Score points during the knockout rounds.', 'event', 'epic', null, 4),
  ('finals', 'Finals Oracle', 'Submit predictions for the final match window.', 'event', 'legendary', null, 1),
  ('top-ranker', 'Top Ranker', 'Reach a top leaderboard tier.', 'rank', 'legendary', null, 1),
  ('daily-return', 'Daily Return', 'Come back on multiple matchdays to keep predicting.', 'social', 'common', null, 7),
  ('league-player', 'League Player', 'Join a league and compete with other players.', 'social', 'rare', null, 1)
on conflict (id) do nothing;

insert into public.user_badges (user_id, badge_id, progress_current, unlocked_at)
values
  ('00000000-0000-0000-0000-000000000001', 'exact-score-merchant', 1, null),
  ('00000000-0000-0000-0000-000000000001', 'hot-streak', 3, '2026-06-13T17:05:00Z'),
  ('00000000-0000-0000-0000-000000000001', 'risk-taker', 1, null)
on conflict (user_id, badge_id) do nothing;

insert into public.activity_events (type, title, description, user_id, match_id, prediction_id, badge_id, league_id, href, created_at)
values
  ('score_calculated', 'Exact score confirmed', 'Brazil 2-1 Spain matched your prediction and added 3 points to your run.', '00000000-0000-0000-0000-000000000001', 'm-bra-esp', '10000000-0000-0000-0000-000000000001', null, null, '/predictions/10000000-0000-0000-0000-000000000001', '2026-06-12T20:05:00Z'),
  ('badge_unlocked', 'Badge unlocked: Hot Streak', 'Three correct outcomes in a row unlocked a new streak badge.', '00000000-0000-0000-0000-000000000001', null, null, 'hot-streak', null, '/badges', '2026-06-13T17:05:00Z'),
  ('prediction_locked', 'Germany vs Morocco locked', 'Your prediction is locked and waiting for the final result.', '00000000-0000-0000-0000-000000000001', 'm-ger-mar', '10000000-0000-0000-0000-000000000004', null, null, '/matches/m-ger-mar', '2026-06-14T17:45:00Z'),
  ('rank_changed', 'Rank moved up', 'Your exact score pushed you to rank #124 in the global arena.', '00000000-0000-0000-0000-000000000001', null, null, null, 'league-global', '/leagues/league-global', '2026-06-14T18:10:00Z'),
  ('league_joined', 'Joined Friday Football Crew', 'You joined a private league with global scoring and symbolic rewards.', '00000000-0000-0000-0000-000000000001', null, null, null, 'league-friends', '/leagues/league-friends', '2026-05-20T18:05:00Z');

insert into public.reward_reviews (id, user_id, title, period, placement, amount, currency, source, status, updated_at, note)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Week 1 exact-score ladder', 'Group Stage Week 1', '#124 global', 0, 'USD', 'sponsor', 'pending', '2026-06-15T22:00:00Z', 'Keep predicting to climb into the sponsor reward tiers.'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Community challenge eligibility', 'Opening Round', 'Qualified participant', 0, 'USD', 'community', 'approved', '2026-06-14T18:30:00Z', 'Eligible for non-cash community recognition and sponsor partner perks.'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Overall leaderboard prize track', 'Full Tournament', 'Outside paid tier', 0, 'USD', 'sponsor', 'ineligible', '2026-06-13T20:00:00Z', 'Reach the published leaderboard tiers to enter manual reward review.')
on conflict (id) do nothing;

insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, description, severity, created_at)
values
  ('00000000-0000-0000-0000-000000000001', 'score_recalculation_preview', 'leaderboard', 'global', 'Generated a leaderboard recalculation preview without changing stored standings.', 'info', '2026-06-15T22:20:00Z'),
  (null, 'prediction_revision_recorded', 'prediction', '10000000-0000-0000-0000-000000000005', 'Prediction revision count increased before lock time.', 'info', '2026-06-15T20:10:00Z'),
  ('00000000-0000-0000-0000-000000000001', 'reward_review_queued', 'reward', '20000000-0000-0000-0000-000000000001', 'Sponsor reward track queued for manual eligibility review.', 'warning', '2026-06-15T19:45:00Z'),
  (null, 'match_result_imported', 'match', 'm-jpn-mex', 'Finished match result imported and made available for scoring.', 'info', '2026-06-13T17:04:00Z'),
  (null, 'suspicious_user_review', 'user', '00000000-0000-0000-0000-000000000003', 'Similar pick timing pattern flagged for admin review.', 'warning', '2026-06-13T16:15:00Z');
