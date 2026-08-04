begin;

create table public.sma_sanctioning_detail_units (
  version_id uuid not null references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  sma_unit_id bigint not null references public.sma_fiscalizable_units(sma_unit_id) on delete restrict,
  unit_name text not null check (btrim(unit_name) <> ''),
  location_text text,
  latitude numeric(12,8) check (latitude is null or latitude between -60 and -15),
  longitude numeric(12,8) check (longitude is null or longitude between -82 and -65),
  unit_url text not null check (unit_url ~ '^https://snifa[.]sma[.]gob[.]cl/UnidadFiscalizable/Ficha/[0-9]+$'),
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, sma_unit_id),
  unique (version_id, item_hash)
);

create table public.sma_sanctioning_detail_holders (
  version_id uuid not null references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  holder_name text not null check (btrim(holder_name) <> ''),
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, item_hash)
);

create table public.sma_sanctioning_detail_documents (
  version_id uuid not null references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  document_name text not null check (btrim(document_name) <> ''),
  document_type text not null check (btrim(document_type) <> ''),
  document_date date not null,
  download_id bigint not null check (download_id > 0),
  download_url text not null check (download_url ~ '^https://snifa[.]sma[.]gob[.]cl/General/Descargar/[0-9]+$'),
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, download_id),
  unique (version_id, item_hash)
);

create table public.sma_sanctioning_detail_facts (
  version_id uuid not null references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  fact_text text not null check (btrim(fact_text) <> ''),
  instrument_label text,
  instrument_url text,
  infringement_text text,
  classification_label text,
  classification_detail text,
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  validation_status text not null default 'pending'
    check (validation_status = any (array['pending'::text,'approved'::text,'rejected'::text])),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, item_hash)
);

create table public.sma_sanctioning_detail_associations (
  version_id uuid not null references public.sma_sanctioning_detail_versions(id) on delete restrict,
  association_type text not null
    check (association_type = any (array['inspection'::text,'provisional_measure'::text])),
  ordinal integer not null check (ordinal > 0),
  reference_label text,
  activity_year integer check (activity_year is null or activity_year between 2000 and 2100),
  external_id bigint check (external_id is null or external_id > 0),
  detail_url text,
  row_data jsonb not null default '{}'::jsonb,
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (version_id, association_type, ordinal),
  unique (version_id, item_hash),
  check (
    detail_url is null
    or detail_url ~ '^https://snifa[.]sma[.]gob[.]cl/(Fiscalizacion|MedidaProvisional)/Ficha/[0-9]+$'
  )
);

create table public.sma_sanctioning_detail_sanctions (
  version_id uuid not null references public.sma_sanctioning_detail_versions(id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  fact_text text not null check (btrim(fact_text) <> ''),
  instrument_label text,
  instrument_url text,
  infringement_text text,
  classification_label text,
  classification_detail text,
  sanction_text text not null check (btrim(sanction_text) <> ''),
  fine_uta numeric(18,3) check (fine_uta is null or fine_uta >= 0),
  item_hash text not null check (item_hash ~ '^[0-9a-f]{64}$'),
  validation_status text not null default 'pending'
    check (validation_status = any (array['pending'::text,'approved'::text,'rejected'::text])),
  created_at timestamptz not null default now(),
  primary key (version_id, ordinal),
  unique (version_id, item_hash)
);

commit;
