do $$
declare v_secret text;
begin
  if not exists(select 1 from vault.decrypted_secrets where name='kumplio_agent_worker_token') then
    v_secret := encode(extensions.gen_random_bytes(32),'hex');
    perform vault.create_secret(v_secret,'kumplio_agent_worker_token','Capability token for durable Kumplio agent worker dispatch');
  end if;
end $$;

create or replace function private.validate_agent_worker_token(p_token text)
returns boolean
language sql
security definer
set search_path=''
as $$
  select coalesce(
    extensions.digest(pg_catalog.convert_to(coalesce(p_token,''),'UTF8'),'sha256') =
    extensions.digest(pg_catalog.convert_to(coalesce((select decrypted_secret from vault.decrypted_secrets where name='kumplio_agent_worker_token' limit 1),''),'UTF8'),'sha256'),
    false
  )
$$;

create or replace function public.validate_agent_worker_token(p_token text)
returns boolean
language sql
security invoker
set search_path=''
as $$ select private.validate_agent_worker_token(p_token) $$;

create or replace function private.dispatch_agent_worker()
returns bigint
language plpgsql
security definer
set search_path=''
as $$
declare v_token text; v_request_id bigint;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kumplio_agent_worker_token' limit 1;
  if v_token is null then raise exception 'Agent worker token missing'; end if;

  select net.http_post(
    url := 'https://www.kumplio.app/api/internal/agent-worker',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_token),
    body := '{}'::jsonb,
    timeout_milliseconds := 290000
  ) into v_request_id;
  return v_request_id;
end $$;

revoke all on function private.validate_agent_worker_token(text) from public,anon,authenticated;
revoke all on function private.dispatch_agent_worker() from public,anon,authenticated;
revoke all on function public.validate_agent_worker_token(text) from public,anon,authenticated;
grant execute on function public.validate_agent_worker_token(text) to service_role;
