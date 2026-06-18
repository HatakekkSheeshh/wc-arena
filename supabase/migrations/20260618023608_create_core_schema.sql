create extension if not exists pgcrypto;

create table public.teams (
  id text primary key,
  name text not null,
  short_name text not null,
  country_code text not null,
  fifa_rank integer,
  group_code text
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text,
  avatar_url text,
  country_code text,
  fan_club_team_id text references public.teams(id),
  role text not null default 'user' check (role in ('user', 'admin')),
  points integer not null default 0,
  rank integer,
  accuracy numeric,
  exact_scores integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.matches (
  id text primary key,
  stage text not null check (stage in ('group', 'round16', 'quarter', 'semi', 'final')),
  group_code text,
  matchday integer,
  home_team_id text not null references public.teams(id),
  away_team_id text not null references public.teams(id),
  kickoff_at timestamptz not null,
  lock_at timestamptz not null,
  stadium text not null,
  city text not null,
  status text not null check (status in ('scheduled', 'open', 'locked', 'live', 'finished', 'postponed', 'cancelled')),
  home_score integer,
  away_score integer,
  result_updated_at timestamptz
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  confidence integer not null default 50 check (confidence between 0 and 100),
  is_risk_pick boolean not null default false,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'locked', 'scored', 'void')),
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked_at timestamptz,
  unique (user_id, match_id)
);

create table public.prediction_scores (
  prediction_id uuid primary key references public.predictions(id) on delete cascade,
  exact_score integer not null default 0,
  correct_outcome integer not null default 0,
  streak_bonus integer not null default 0,
  risk_multiplier numeric not null default 1,
  underdog_bonus integer not null default 0,
  total integer not null default 0,
  outcome text not null check (outcome in ('exact', 'correct', 'missed')),
  scoring_version text not null,
  calculated_at timestamptz not null default now()
);

create table public.leagues (
  id text primary key,
  name text not null,
  slug text not null unique,
  creator_id uuid references public.profiles(id),
  visibility text not null check (visibility in ('private', 'public')),
  invite_code text not null unique,
  member_count integer not null default 0,
  scoring_mode text not null default 'global' check (scoring_mode in ('global', 'custom')),
  prize_mode text not null default 'none' check (prize_mode in ('none', 'symbolic', 'sponsor', 'manual')),
  created_at timestamptz not null default now()
);

create table public.league_members (
  league_id text not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global', 'league')),
  league_id text references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rank integer not null,
  previous_rank integer,
  points integer not null default 0,
  exact_scores integer not null default 0,
  accuracy numeric not null default 0,
  streak integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index leaderboard_global_user_unique on public.leaderboard_entries(user_id) where scope = 'global' and league_id is null;
create unique index leaderboard_league_user_unique on public.leaderboard_entries(league_id, user_id) where scope = 'league' and league_id is not null;

create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  category text not null check (category in ('skill', 'streak', 'risk', 'rank', 'social', 'event')),
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  icon_path text,
  progress_target integer
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  progress_current integer not null default 0,
  unlocked_at timestamptz,
  primary key (user_id, badge_id)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('prediction_locked', 'score_calculated', 'badge_unlocked', 'rank_changed', 'league_joined')),
  title text not null,
  description text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  match_id text references public.matches(id),
  prediction_id uuid references public.predictions(id),
  badge_id text references public.badges(id),
  league_id text references public.leagues(id),
  href text,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null check (entity_type in ('match', 'prediction', 'leaderboard', 'user', 'reward', 'system')),
  entity_id text not null,
  description text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  created_at timestamptz not null default now()
);

create table public.reward_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  title text not null,
  period text not null,
  placement text not null,
  amount integer not null,
  currency text not null default 'USD',
  source text not null check (source in ('sponsor', 'community', 'manual')),
  status text not null check (status in ('pending', 'approved', 'paid', 'ineligible')),
  updated_at timestamptz not null default now(),
  note text not null
);

create index predictions_user_id_idx on public.predictions(user_id);
create index predictions_match_id_idx on public.predictions(match_id);
create index matches_kickoff_at_idx on public.matches(kickoff_at);
create index matches_status_idx on public.matches(status);
create index leaderboard_scope_league_rank_idx on public.leaderboard_entries(scope, league_id, rank);
create index league_members_user_id_idx on public.league_members(user_id);
create index activity_events_user_created_idx on public.activity_events(user_id, created_at desc);
create index activity_events_league_created_idx on public.activity_events(league_id, created_at desc);
create index admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);
create index reward_reviews_user_status_idx on public.reward_reviews(user_id, status);

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.prediction_scores enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.activity_events enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.reward_reviews enable row level security;

create policy teams_public_read on public.teams for select to anon, authenticated using (true);
create policy matches_public_read on public.matches for select to anon, authenticated using (true);
create policy badges_public_read on public.badges for select to anon, authenticated using (true);
create policy public_leagues_read on public.leagues for select to anon, authenticated using (visibility = 'public');
create policy global_leaderboard_public_read on public.leaderboard_entries for select to anon, authenticated using (scope = 'global');

create policy profiles_public_read on public.profiles for select to anon, authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id and role = 'user');

create policy predictions_read_own on public.predictions for select to authenticated using ((select auth.uid()) = user_id);
create policy prediction_scores_read_own on public.prediction_scores for select to authenticated using (
  exists (
    select 1 from public.predictions p
    where p.id = prediction_scores.prediction_id
    and p.user_id = (select auth.uid())
  )
);

create policy league_members_read_own on public.league_members for select to authenticated using ((select auth.uid()) = user_id);
create policy private_leagues_member_read on public.leagues for select to authenticated using (
  visibility = 'public'
  or exists (
    select 1 from public.league_members lm
    where lm.league_id = leagues.id
    and lm.user_id = (select auth.uid())
  )
);
create policy league_leaderboard_member_read on public.leaderboard_entries for select to authenticated using (
  scope = 'global'
  or exists (
    select 1 from public.league_members lm
    where lm.league_id = leaderboard_entries.league_id
    and lm.user_id = (select auth.uid())
  )
);

create policy user_badges_read_own on public.user_badges for select to authenticated using ((select auth.uid()) = user_id);
create policy activity_events_read_own on public.activity_events for select to authenticated using ((select auth.uid()) = user_id);
create policy reward_reviews_read_own on public.reward_reviews for select to authenticated using ((select auth.uid()) = user_id);

create policy admin_audit_logs_admin_read on public.admin_audit_logs for select to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
    and p.role = 'admin'
  )
);
create policy reward_reviews_admin_read on public.reward_reviews for select to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
    and p.role = 'admin'
  )
);
