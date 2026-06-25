create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

select cron.unschedule('sync-espn-results-every-10-minutes')
where exists (
  select 1
  from cron.job
  where jobname = 'sync-espn-results-every-10-minutes'
);

select cron.schedule(
  'sync-espn-results-every-10-minutes',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/sync_espn_results',
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
        where name = 'espn_sync_secret'
      )
    ),
    body := jsonb_build_object('scheduledAt', now()),
    timeout_milliseconds := 30000
  );
  $$
);
