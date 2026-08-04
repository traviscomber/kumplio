alter table public.documents
  alter column project_id set not null,
  alter column name set not null,
  alter column file_url set not null,
  alter column upload_date set default now(),
  alter column upload_date set not null,
  alter column status set not null,
  alter column user_id set not null;

drop policy if exists documents_select_own on public.documents;
drop policy if exists documents_insert_own on public.documents;
drop policy if exists documents_update_own on public.documents;
drop policy if exists documents_delete_own on public.documents;

create policy documents_select_own
on public.documents
for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects
    where projects.id = documents.project_id
      and (
        projects.user_id = (select auth.uid())
        or projects.organization_id in (
          select organization_members.organization_id
          from public.organization_members
          where organization_members.user_id = (select auth.uid())
        )
      )
  )
);

create policy documents_insert_own
on public.documents
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects
    where projects.id = documents.project_id
      and (
        projects.user_id = (select auth.uid())
        or projects.organization_id in (
          select organization_members.organization_id
          from public.organization_members
          where organization_members.user_id = (select auth.uid())
        )
      )
  )
);

create policy documents_update_own
on public.documents
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects
    where projects.id = documents.project_id
      and (
        projects.user_id = (select auth.uid())
        or projects.organization_id in (
          select organization_members.organization_id
          from public.organization_members
          where organization_members.user_id = (select auth.uid())
        )
      )
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects
    where projects.id = documents.project_id
      and (
        projects.user_id = (select auth.uid())
        or projects.organization_id in (
          select organization_members.organization_id
          from public.organization_members
          where organization_members.user_id = (select auth.uid())
        )
      )
  )
);

create policy documents_delete_own
on public.documents
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects
    where projects.id = documents.project_id
      and (
        projects.user_id = (select auth.uid())
        or projects.organization_id in (
          select organization_members.organization_id
          from public.organization_members
          where organization_members.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists documents_update_own on storage.objects;

create policy documents_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
