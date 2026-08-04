begin;

alter table public.dt_document_details
  drop constraint if exists dt_document_details_document_id_details_hash_key;

create index if not exists dt_document_details_document_hash_idx
  on public.dt_document_details(document_id, details_hash);

commit;
