-- ============================================================================
-- LMS Production Database Schema & Row Level Security (RLS)
-- Multi-Tenant, Role-Based Access Control, School & Course Relational Matrix
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ORGANIZATIONS (Multi-Tenant Root)
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    logo_url text,
    brand_config jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. PROFILES (Extends auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    organization_id uuid not null references public.organizations(id) on delete restrict,
    email text not null,
    full_name text not null,
    avatar_url text,
    role text not null default 'instructor' check (role in ('super_admin', 'org_admin', 'manager', 'instructor')),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. SCHOOLS (Campuses / Branches)
create table if not exists public.schools (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    name text not null,
    code text,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. SCHOOL MEMBERSHIPS (Many-to-Many: Employee/User <-> Schools)
create table if not exists public.school_memberships (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    school_id uuid not null references public.schools(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role_in_school text not null default 'member',
    created_at timestamptz not null default now(),
    constraint unique_school_user unique (school_id, user_id)
);

-- 5. COURSES
create table if not exists public.courses (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    title text not null,
    description text,
    thumbnail_url text,
    is_published boolean not null default false,
    estimated_duration_minutes integer not null default 0,
    rating numeric(3, 2) not null default 5.00,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 6. COURSE ASSIGNMENTS (Many-to-Many: User <-> Course, optionally scoped to School)
create table if not exists public.course_assignments (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    school_id uuid references public.schools(id) on delete set null,
    assigned_by uuid references public.profiles(id) on delete set null,
    status text not null default 'yet_to_start' check (status in ('yet_to_start', 'in_progress', 'completed')),
    progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
    assigned_at timestamptz not null default now(),
    due_date timestamptz,
    completed_at timestamptz,
    constraint unique_course_user_school unique nulls not distinct (course_id, user_id, school_id)
);

-- 7. COURSE MODULES (Sections)
create table if not exists public.course_modules (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    title text not null,
    order_index integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 8. LESSONS (Units: Video, PDF, Text, Quiz)
create table if not exists public.lessons (
    id uuid primary key default gen_random_uuid(),
    module_id uuid not null references public.course_modules(id) on delete cascade,
    title text not null,
    content_type text not null check (content_type in ('video', 'pdf', 'text', 'quiz')),
    content_body text,
    media_storage_path text,
    duration_minutes integer not null default 0,
    order_index integer not null default 0,
    is_published boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 9. LESSON PROGRESS (Granular completion per lesson)
create table if not exists public.lesson_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    lesson_id uuid not null references public.lessons(id) on delete cascade,
    is_completed boolean not null default false,
    completed_at timestamptz,
    last_accessed_at timestamptz not null default now(),
    constraint unique_user_lesson unique (user_id, lesson_id)
);

-- 10. QUIZZES
create table if not exists public.quizzes (
    id uuid primary key default gen_random_uuid(),
    lesson_id uuid unique not null references public.lessons(id) on delete cascade,
    passing_score_percent integer not null default 70,
    max_attempts integer not null default 3,
    created_at timestamptz not null default now()
);

-- 11. QUIZ QUESTIONS
create table if not exists public.quiz_questions (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    prompt text not null,
    question_type text not null default 'single_choice' check (question_type in ('single_choice', 'multiple_choice', 'true_false')),
    options jsonb not null default '[]'::jsonb,
    correct_answers jsonb not null default '[]'::jsonb,
    order_index integer not null default 0
);

-- 12. QUIZ ATTEMPTS
create table if not exists public.quiz_attempts (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    score_percent numeric(5, 2) not null,
    is_passed boolean not null,
    answers_submitted jsonb not null default '{}'::jsonb,
    attempt_number integer not null default 1,
    completed_at timestamptz not null default now()
);

-- 13. CERTIFICATES
create table if not exists public.certificates (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    certificate_number text unique not null,
    issued_at timestamptz not null default now(),
    pdf_storage_path text
);

-- 14. MANUALS (Knowledge Base)
create table if not exists public.manuals (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    title text not null,
    description text,
    category text,
    content text,
    file_storage_path text,
    is_shared boolean not null default true,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 15. MANUAL BOOKMARKS
create table if not exists public.manual_bookmarks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    manual_id uuid not null references public.manuals(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint unique_user_manual unique (user_id, manual_id)
);

-- 16. SPACES
create table if not exists public.spaces (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    school_id uuid references public.schools(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz not null default now()
);

-- 17. NOTIFICATIONS
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null check (type in ('course_assigned', 'lesson_published', 'quiz_result', 'system')),
    link_url text,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================
create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_schools_org on public.schools(organization_id);
create index if not exists idx_memberships_school on public.school_memberships(school_id);
create index if not exists idx_memberships_user on public.school_memberships(user_id);
create index if not exists idx_courses_org on public.courses(organization_id);
create index if not exists idx_assignments_user on public.course_assignments(user_id);
create index if not exists idx_assignments_course on public.course_assignments(course_id);
create index if not exists idx_assignments_school on public.course_assignments(school_id);
create index if not exists idx_modules_course on public.course_modules(course_id);
create index if not exists idx_lessons_module on public.lessons(module_id);
create index if not exists idx_progress_user_course on public.lesson_progress(user_id, course_id);
create index if not exists idx_attempts_quiz_user on public.quiz_attempts(quiz_id, user_id);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);
create index if not exists idx_manuals_org on public.manuals(organization_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ============================================================================

create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Enable RLS on all tables
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;
alter table public.courses enable row level security;
alter table public.course_assignments enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.manuals enable row level security;
alter table public.manual_bookmarks enable row level security;
alter table public.spaces enable row level security;
alter table public.notifications enable row level security;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Organizations: users view their own organization
create policy "Users can view their organization"
    on public.organizations for select
    using (id = public.current_user_org_id());

-- Profiles: users can view members of their organization
create policy "Users can view members of same organization"
    on public.profiles for select
    using (organization_id = public.current_user_org_id());

create policy "Users can update their own profile"
    on public.profiles for update
    using (id = auth.uid());

-- Schools: visible to organization members
create policy "Users can view schools in their organization"
    on public.schools for select
    using (organization_id = public.current_user_org_id());

create policy "Admins can manage schools"
    on public.schools for all
    using (
        organization_id = public.current_user_org_id()
        and public.current_user_role() in ('super_admin', 'org_admin')
    );

-- School Memberships:
create policy "Users can view memberships in their organization"
    on public.school_memberships for select
    using (organization_id = public.current_user_org_id());

create policy "Admins can manage memberships"
    on public.school_memberships for all
    using (
        organization_id = public.current_user_org_id()
        and public.current_user_role() in ('super_admin', 'org_admin', 'manager')
    );

-- Courses:
create policy "Learners view assigned published courses; staff view all org courses"
    on public.courses for select
    using (
        organization_id = public.current_user_org_id()
        and (
            public.current_user_role() in ('super_admin', 'org_admin', 'manager', 'instructor')
            or (
                is_published = true
                and id in (select course_id from public.course_assignments where user_id = auth.uid())
            )
        )
    );

create policy "Admins and instructors can manage courses"
    on public.courses for all
    using (
        organization_id = public.current_user_org_id()
        and public.current_user_role() in ('super_admin', 'org_admin', 'instructor')
    );

-- Course Assignments:
create policy "Users view own assignments; managers/admins view org assignments"
    on public.course_assignments for select
    using (
        organization_id = public.current_user_org_id()
        and (
            user_id = auth.uid()
            or public.current_user_role() in ('super_admin', 'org_admin', 'manager')
        )
    );

create policy "Admins and managers can manage assignments"
    on public.course_assignments for all
    using (
        organization_id = public.current_user_org_id()
        and public.current_user_role() in ('super_admin', 'org_admin', 'manager')
    );

-- Modules and Lessons:
create policy "Users view lessons of viewable courses"
    on public.course_modules for select
    using (
        course_id in (select id from public.courses)
    );

create policy "Staff manage course modules"
    on public.course_modules for all
    using (
        course_id in (
            select id from public.courses
            where organization_id = public.current_user_org_id()
            and public.current_user_role() in ('super_admin', 'org_admin', 'instructor')
        )
    );

create policy "Users view lessons"
    on public.lessons for select
    using (
        module_id in (select id from public.course_modules)
    );

create policy "Staff manage lessons"
    on public.lessons for all
    using (
        module_id in (
            select m.id from public.course_modules m
            join public.courses c on c.id = m.course_id
            where c.organization_id = public.current_user_org_id()
            and public.current_user_role() in ('super_admin', 'org_admin', 'instructor')
        )
    );

-- Lesson Progress:
create policy "Users view their own progress; managers view all"
    on public.lesson_progress for select
    using (
        user_id = auth.uid()
        or public.current_user_role() in ('super_admin', 'org_admin', 'manager')
    );

create policy "Users manage their own progress"
    on public.lesson_progress for all
    using (user_id = auth.uid());

-- Quizzes and Attempts:
create policy "Users view quizzes for viewable lessons"
    on public.quizzes for select
    using (lesson_id in (select id from public.lessons));

create policy "Users view questions for viewable quizzes"
    on public.quiz_questions for select
    using (quiz_id in (select id from public.quizzes));

create policy "Users view their own attempts; managers view org attempts"
    on public.quiz_attempts for select
    using (
        user_id = auth.uid()
        or public.current_user_role() in ('super_admin', 'org_admin', 'manager')
    );

create policy "Users submit their own quiz attempts"
    on public.quiz_attempts for insert
    with check (user_id = auth.uid());

-- Notifications:
create policy "Users manage their own notifications"
    on public.notifications for all
    using (user_id = auth.uid());

-- Manuals and Bookmarks:
create policy "Users view shared manuals in their organization"
    on public.manuals for select
    using (
        organization_id = public.current_user_org_id()
        and (is_shared = true or created_by = auth.uid())
    );

create policy "Users manage own bookmarks"
    on public.manual_bookmarks for all
    using (user_id = auth.uid());

-- Spaces:
create policy "Users view spaces in their organization"
    on public.spaces for select
    using (organization_id = public.current_user_org_id());

-- ============================================================================
-- 18. COURSE REVIEWS & RATINGS
-- ============================================================================
create table if not exists public.course_reviews (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_reviews_course on public.course_reviews(course_id);
create index if not exists idx_reviews_user on public.course_reviews(user_id);
create index if not exists idx_reviews_org on public.course_reviews(organization_id);

alter table public.course_reviews enable row level security;

create policy "Org members can view course reviews"
    on public.course_reviews for select
    using (organization_id = public.current_user_org_id());

create policy "Assigned learners and faculty can post course reviews"
    on public.course_reviews for insert
    with check (
        organization_id = public.current_user_org_id()
        and user_id = auth.uid()
    );

create policy "Users can update their own course reviews"
    on public.course_reviews for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Users or Admins can delete course reviews"
    on public.course_reviews for delete
    using (
        user_id = auth.uid()
        or public.current_user_role() in ('super_admin', 'org_admin')
    );

-- ============================================================================
-- DEFAULT ORGANIZATION & AUTO-PROFILE CREATION TRIGGER (TwoStep Forward)
-- ============================================================================

-- Insert default TwoStep Forward organization
insert into public.organizations (id, name, slug, brand_config)
values (
  'a0000000-0000-0000-0000-000000000001',
  'TwoStep Forward Educational Services',
  'twostep-forward',
  '{"brand": "TwoStep Forward"}'::jsonb
)
on conflict (slug) do nothing;

-- Automatic profile creation trigger when a user is created in Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org_id uuid;
begin
  select id into default_org_id from public.organizations where slug = 'twostep-forward' limit 1;
  
  if default_org_id is null then
    insert into public.organizations (id, name, slug, brand_config)
    values (
      'a0000000-0000-0000-0000-000000000001',
      'TwoStep Forward Educational Services',
      'twostep-forward',
      '{"brand": "TwoStep Forward"}'::jsonb
    ) returning id into default_org_id;
  end if;

  insert into public.profiles (
    id,
    organization_id,
    email,
    full_name,
    role
  ) values (
    new.id,
    default_org_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'instructor')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

