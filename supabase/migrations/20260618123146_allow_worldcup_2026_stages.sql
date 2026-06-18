alter table public.matches drop constraint if exists matches_stage_check;

alter table public.matches
  add constraint matches_stage_check
  check (stage in ('group', 'round32', 'round16', 'quarter', 'semi', 'third_place', 'final'));
