-- Backend integration hardening for the authenticated LMS data path.

-- School location is used by the admin UI and belongs in the relational model.
alter table public.schools
  add column if not exists location text not null default '';

-- Keep the application roles explicit. New accounts start as learners and are
-- promoted by an authenticated administrator through the server API.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'org_admin', 'manager', 'instructor', 'learner'));

-- Match the lesson types supported by the application.
alter table public.lessons drop constraint if exists lessons_content_type_check;
alter table public.lessons
  add constraint lessons_content_type_check
  check (content_type in ('video', 'pdf', 'image', 'text', 'reading', 'quiz'));

-- SQL Editor-created tables may not inherit Supabase's default PostgREST
-- grants. RLS remains the permission boundary for authenticated users.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all privileges on tables to service_role;
grant execute on function public.current_user_org_id() to authenticated, service_role;
grant execute on function public.current_user_role() to authenticated, service_role;

-- Instructors and learners only see published courses assigned to them.
drop policy if exists "Learners view assigned published courses; staff view all org courses" on public.courses;
create policy "Users view assigned published courses; admins view org courses"
  on public.courses for select
  using (
    organization_id = public.current_user_org_id()
    and (
      public.current_user_role() in ('super_admin', 'org_admin', 'manager')
      or (
        is_published = true
        and id in (
          select course_id
          from public.course_assignments
          where user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Users view lessons of viewable courses" on public.course_modules;
drop policy if exists "Users view lessons" on public.lessons;

create policy "Users view modules of viewable courses"
  on public.course_modules for select
  using (course_id in (select id from public.courses));

create policy "Users view lessons of viewable courses"
  on public.lessons for select
  using (
    is_published = true
    and module_id in (select id from public.course_modules)
  );

-- Never derive a privileged role from user-controlled auth metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org_id uuid;
begin
  select id into default_org_id
  from public.organizations
  where slug = 'twostep-forward'
  limit 1;

  if default_org_id is null then
    insert into public.organizations (id, name, slug, brand_config)
    values (
      'a0000000-0000-0000-0000-000000000001',
      'TwoStep Forward Educational Services',
      'twostep-forward',
      '{"brand": "TwoStep Forward"}'::jsonb
    )
    returning id into default_org_id;
  end if;

  insert into public.profiles (id, organization_id, email, full_name, role)
  values (
    new.id,
    default_org_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'learner'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Backfill accounts created before the profile trigger was installed.
insert into public.profiles (id, organization_id, email, full_name, role)
select
  u.id,
  o.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'learner'
from auth.users u
cross join lateral (
  select id from public.organizations where slug = 'twostep-forward' limit 1
) o
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- Content is private. The server API authorizes each request before using the
-- service-role client to stream an object.
update storage.buckets
set public = false,
    allowed_mime_types = array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]::text[]
where id = 'lms-content';

drop policy if exists "Public Access for LMS Content" on storage.objects;
drop policy if exists "Allow Upload to LMS Content" on storage.objects;
drop policy if exists "Allow Update to LMS Content" on storage.objects;
drop policy if exists "Allow Delete to LMS Content" on storage.objects;
drop policy if exists "Authenticated LMS Content Upload" on storage.objects;
drop policy if exists "Authenticated LMS Content Update" on storage.objects;
drop policy if exists "Authenticated LMS Content Delete" on storage.objects;

create policy "Authenticated LMS Content Upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lms-content'
    and public.current_user_role() in ('super_admin', 'org_admin', 'manager')
  );

create policy "Authenticated LMS Content Update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'lms-content'
    and public.current_user_role() in ('super_admin', 'org_admin', 'manager')
  )
  with check (
    bucket_id = 'lms-content'
    and public.current_user_role() in ('super_admin', 'org_admin', 'manager')
  );

create policy "Authenticated LMS Content Delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'lms-content'
    and public.current_user_role() in ('super_admin', 'org_admin', 'manager')
  );
