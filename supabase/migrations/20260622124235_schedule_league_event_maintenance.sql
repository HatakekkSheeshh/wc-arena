create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

select cron.unschedule('league-event-maintenance-hourly')
where exists (
  select 1
  from cron.job
  where jobname = 'league-event-maintenance-hourly'
);

select cron.schedule(
  'league-event-maintenance-hourly',
  '23 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/league_event_maintenance',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'publishable_key'
      ),
      'x-sync-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'league_event_sync_secret'
      )
    ),
    body := jsonb_build_object('scheduledAt', now())
  );
  $$
);
