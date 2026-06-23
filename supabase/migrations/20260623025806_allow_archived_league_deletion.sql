alter table public.activity_events
  drop constraint if exists activity_events_league_id_fkey;

alter table public.activity_events
  add constraint activity_events_league_id_fkey
  foreign key (league_id)
  references public.leagues(id)
  on delete set null;
