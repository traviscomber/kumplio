create or replace function private.dispatch_provider_retention_probe_v1()
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_token text;
  v_request_id bigint;
begin
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name = 'kumplio_agent_worker_token'
  limit 1;

  if v_token is null then
    raise exception 'Agent worker token missing';
  end if;

  select net.http_post(
    url := 'https://www.kumplio.app/api/internal/agent-worker',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || v_token
    ),
    body := jsonb_build_object('mode','provider_retention_probe'),
    timeout_milliseconds := 120000
  ) into v_request_id;

  return v_request_id;
end;
$function$;

revoke all on function private.dispatch_provider_retention_probe_v1() from public;
revoke all on function private.dispatch_provider_retention_probe_v1() from anon;
revoke all on function private.dispatch_provider_retention_probe_v1() from authenticated;
grant execute on function private.dispatch_provider_retention_probe_v1() to service_role;
grant execute on function private.dispatch_provider_retention_probe_v1() to postgres;

comment on function private.dispatch_provider_retention_probe_v1() is
'Dispatches the bounded synthetic OpenAI retention probe through the authenticated production worker without exposing the worker token.';
