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

  new.metadata := coalesce(new.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'verifiedPeriods', verified_periods,
      'verifiedPeriodCount', jsonb_array_length(verified_periods),
      'verifiedCaptureCount', jsonb_array_length(verified_periods),
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

update public.scraper_connectors
set metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object(
    'verifiedPeriods', jsonb_build_array('2026-07'),
    'lastCapturedPeriod', '2026-07',
    'schedulingReadiness', 'first_capture_verified',
    'schedulingStatus', 'manual_until_two_verified_periods'
  ),
  status = 'manual',
  updated_at = now()
where connector_key = 'direccion-trabajo-doctrina';

update public.regulatory_sources
set metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object(
    'verifiedPeriods', jsonb_build_array('2026-07'),
    'verifiedPeriodCount', 1,
    'verifiedCaptureCount', 1,
    'verifiedCountSemantics', 'distinct_capture_periods'
  ),
  updated_at = now()
where canonical_url = 'https://www.dt.gob.cl/legislacion/1624/w3-channel.html';

commit;
