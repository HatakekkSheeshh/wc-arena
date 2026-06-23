create or replace function public.cleanup_old_operational_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_deleted integer := 0;
  v_audit_deleted integer := 0;
begin
  delete from public.activity_events
  where created_at < now() - interval '90 days';
  get diagnostics v_activity_deleted = row_count;

  delete from public.admin_audit_logs
  where created_at < now() - interval '180 days';
  get diagnostics v_audit_deleted = row_count;

  return jsonb_build_object(
    'activity_deleted', v_activity_deleted,
    'audit_deleted', v_audit_deleted
  );
end;
$$;

revoke all on function public.cleanup_old_operational_data() from public, anon, authenticated;
