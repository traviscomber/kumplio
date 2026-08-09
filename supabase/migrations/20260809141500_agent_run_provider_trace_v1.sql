alter table public.agent_runs
  add column if not exists provider_request_id text,
  add column if not exists provider_organization text;

comment on column public.agent_runs.provider_request_id is 'OpenAI x-request-id captured from the successful provider response for operational traceability.';
comment on column public.agent_runs.provider_organization is 'OpenAI organization header captured from the successful provider response; not evidence of ZDR/MAM configuration.';
