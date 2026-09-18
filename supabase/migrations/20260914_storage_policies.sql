-- ============================================================================
-- Supabase Storage Bucket & RLS Policies for TwoStep Forward LMS Content
-- ============================================================================

-- 1. Create lms-content bucket if it doesn't already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'lms-content',
    'lms-content',
    true,
    524288000, -- 500 MB limit for lesson video files, PDFs, and slide decks
    null
)
on conflict (id) do update set public = true;

-- 2. Drop existing restrictive policies if any to prevent conflicts
drop policy if exists "Public Access for LMS Content" on storage.objects;
drop policy if exists "Authenticated Upload to LMS Content" on storage.objects;
drop policy if exists "Allow Public Upload to LMS Content" on storage.objects;
drop policy if exists "Allow Public Update to LMS Content" on storage.objects;
drop policy if exists "Allow Public Delete to LMS Content" on storage.objects;

-- 3. Allow everyone (public & authenticated) to READ/STREAM lesson content & media
create policy "Public Access for LMS Content"
on storage.objects for select
using (bucket_id = 'lms-content');

-- 4. Allow file uploads into the lms-content bucket
create policy "Allow Upload to LMS Content"
on storage.objects for insert
with check (bucket_id = 'lms-content');

-- 5. Allow updating files in the lms-content bucket
create policy "Allow Update to LMS Content"
on storage.objects for update
using (bucket_id = 'lms-content');

-- 6. Allow deleting files in the lms-content bucket
create policy "Allow Delete to LMS Content"
on storage.objects for delete
using (bucket_id = 'lms-content');
