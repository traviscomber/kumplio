begin;

create index sma_detail_versions_process_idx on public.sma_sanctioning_detail_versions(sma_process_id,captured_at desc);
create index sma_detail_versions_validation_idx on public.sma_sanctioning_detail_versions(validation_status,captured_at desc);
create index sma_detail_units_unit_idx on public.sma_sanctioning_detail_units(sma_unit_id,version_id);
create index sma_detail_documents_type_date_idx on public.sma_sanctioning_detail_documents(document_type,document_date desc);
create index sma_detail_documents_download_idx on public.sma_sanctioning_detail_documents(download_id);
create index sma_detail_facts_classification_idx on public.sma_sanctioning_detail_facts(classification_label,validation_status);
create index sma_detail_associations_external_idx on public.sma_sanctioning_detail_associations(association_type,external_id);
create index sma_detail_sanctions_fine_idx on public.sma_sanctioning_detail_sanctions(fine_uta desc nulls last);
create index sma_detail_sanctions_classification_idx on public.sma_sanctioning_detail_sanctions(classification_label,validation_status);

alter table public.sma_sanctioning_detail_versions enable row level security;
alter table public.sma_sanctioning_detail_heads enable row level security;
alter table public.sma_sanctioning_detail_units enable row level security;
alter table public.sma_sanctioning_detail_holders enable row level security;
alter table public.sma_sanctioning_detail_documents enable row level security;
alter table public.sma_sanctioning_detail_facts enable row level security;
alter table public.sma_sanctioning_detail_associations enable row level security;
alter table public.sma_sanctioning_detail_sanctions enable row level security;

create policy sma_detail_versions_authenticated_read on public.sma_sanctioning_detail_versions for select to authenticated using (true);
create policy sma_detail_heads_authenticated_read on public.sma_sanctioning_detail_heads for select to authenticated using (true);
create policy sma_detail_units_authenticated_read on public.sma_sanctioning_detail_units for select to authenticated using (true);
create policy sma_detail_holders_authenticated_read on public.sma_sanctioning_detail_holders for select to authenticated using (true);
create policy sma_detail_documents_authenticated_read on public.sma_sanctioning_detail_documents for select to authenticated using (true);
create policy sma_detail_facts_authenticated_read on public.sma_sanctioning_detail_facts for select to authenticated using (true);
create policy sma_detail_associations_authenticated_read on public.sma_sanctioning_detail_associations for select to authenticated using (true);
create policy sma_detail_sanctions_authenticated_read on public.sma_sanctioning_detail_sanctions for select to authenticated using (true);

revoke all on public.sma_sanctioning_detail_versions from public,anon,authenticated;
revoke all on public.sma_sanctioning_detail_heads from public,anon,authenticated;
revoke all on public.sma_sanctioning_detail_units from public,anon,authenticated;
revoke all on public.sma_sanctioning_detail_holders from public,anon,authenticated;
revoke all on public.sma_sanctioning_detail_documents from public,anon,authenticated;
revoke all on public.sma_sanctioning_detail_facts from public,anon,authenticated;
revoke all on public.sma_sanctioning_detail_associations from public,anon,authenticated;
revoke all on public.sma_sanctioning_detail_sanctions from public,anon,authenticated;

grant select on public.sma_sanctioning_detail_versions to authenticated;
grant select on public.sma_sanctioning_detail_heads to authenticated;
grant select on public.sma_sanctioning_detail_units to authenticated;
grant select on public.sma_sanctioning_detail_holders to authenticated;
grant select on public.sma_sanctioning_detail_documents to authenticated;
grant select on public.sma_sanctioning_detail_facts to authenticated;
grant select on public.sma_sanctioning_detail_associations to authenticated;
grant select on public.sma_sanctioning_detail_sanctions to authenticated;

grant all on public.sma_sanctioning_detail_versions to service_role;
grant all on public.sma_sanctioning_detail_heads to service_role;
grant all on public.sma_sanctioning_detail_units to service_role;
grant all on public.sma_sanctioning_detail_holders to service_role;
grant all on public.sma_sanctioning_detail_documents to service_role;
grant all on public.sma_sanctioning_detail_facts to service_role;
grant all on public.sma_sanctioning_detail_associations to service_role;
grant all on public.sma_sanctioning_detail_sanctions to service_role;

commit;
