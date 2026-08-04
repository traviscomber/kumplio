begin;

create or replace function private.normalize_dt_verified_periods()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  capture_period text;
  verified_periods jsonb;
  verified_period_count integer;
begin
  if new.connector_key <> 'direccion-trabajo-doctrina' then
    return new;
  end if;

  capture_period := nullif(btrim(new.metadata->>'lastCapturedPeriod'), '');

  select coalesce(jsonb_agg(period order by period), '[]'::jsonb)
  into verified_periods
  from (
    select distinct value as period
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(new.metadata->'verifiedPeriods') = 'array'
          then new.metadata->'verifiedPeriods'
        else '[]'::jsonb
      end
    )
    where value ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'

    union

    select capture_period
    where capture_period ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'
      and coalesce(new.metadata->>'schedulingReadiness', '') in (
        'first_capture_verified',
        'ready'
      )
  ) periods;

  verified_period_count := jsonb_array_length(verified_periods);

  new.metadata := coalesce(new.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'verifiedPeriods', verified_periods,
      'verifiedPeriodCount', verified_period_count,
      'verifiedCaptureCount', verified_period_count,
      'verifiedCountSemantics', 'distinct_capture_periods',
      'schedulingStatus', case
        when verified_period_count >= 2 then 'manual_until_schedule_approved'
        else 'manual_until_two_verified_periods'
      end
    );
  new.status := 'manual';

  return new;
end;
$$;

create or replace function private.normalize_dt_source_verified_periods()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  capture_period text;
  verified_periods jsonb;
  verified_period_count integer;
begin
  if new.canonical_url <> 'https://www.dt.gob.cl/legislacion/1624/w3-channel.html' then
    return new;
  end if;

  capture_period := nullif(btrim(new.metadata->>'lastCapturedPeriod'), '');

  select coalesce(jsonb_agg(period order by period), '[]'::jsonb)
  into verified_periods
  from (
    select distinct value as period
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(new.metadata->'verifiedPeriods') = 'array'
          then new.metadata->'verifiedPeriods'
        else '[]'::jsonb
      end
    )
    where value ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'

    union

    select capture_period
    where capture_period ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'
      and coalesce((new.metadata->>'lastDocumentCount')::integer, 0) > 0
  ) periods;

  verified_period_count := jsonb_array_length(verified_periods);

  new.metadata := coalesce(new.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'verifiedPeriods', verified_periods,
      'verifiedPeriodCount', verified_period_count,
      'verifiedCaptureCount', verified_period_count,
      'verifiedCountSemantics', 'distinct_capture_periods'
    );

  return new;
end;
$$;

drop trigger if exists normalize_dt_verified_periods
  on public.scraper_connectors;
create trigger normalize_dt_verified_periods
  before insert or update on public.scraper_connectors
  for each row execute function private.normalize_dt_verified_periods();

drop trigger if exists normalize_dt_source_verified_periods
  on public.regulatory_sources;
create trigger normalize_dt_source_verified_periods
  before insert or update on public.regulatory_sources
  for each row execute function private.normalize_dt_source_verified_periods();

update public.scraper_connectors
set metadata = metadata,
    updated_at = now()
where connector_key = 'direccion-trabajo-doctrina';

update public.regulatory_sources
set metadata = metadata,
    updated_at = now()
where canonical_url = 'https://www.dt.gob.cl/legislacion/1624/w3-channel.html';

commit;
