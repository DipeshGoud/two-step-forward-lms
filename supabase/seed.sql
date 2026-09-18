-- ============================================================================
-- TwoStep Forward LMS — Production Seed Data
-- ============================================================================

-- 1. Default Organization
insert into public.organizations (id, name, slug, brand_config)
values (
  'a0000000-0000-0000-0000-000000000001',
  'TwoStep Forward Educational Services',
  'twostep-forward',
  '{"brand": "TwoStep Forward", "primaryColor": "#7C3AED"}'::jsonb
)
on conflict (slug) do update set
  name = excluded.name,
  brand_config = excluded.brand_config;

-- 2. Schools / Campuses
insert into public.schools (id, organization_id, name, code, description)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Downtown Academy',
    'DTA-01',
    'Primary metropolitan education and vocational training center.'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'North Campus',
    'NC-02',
    'Specialized STEM and secondary education preparatory facility.'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'West Valley High',
    'WVH-03',
    'Comprehensive public charter high school and athletic academy.'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'East River Campus',
    'ERC-04',
    'Arts, literature, and humanities focused regional campus.'
  )
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  description = excluded.description;

-- 3. Core Courses
insert into public.courses (id, organization_id, title, description, is_published, estimated_duration_minutes, rating)
values
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Child Safety & Protection Standards Training',
    'Comprehensive guidance on child protection standards, preventive screening, mandatory reporting, and incident management for educators.',
    true,
    180,
    5.00
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Workplace Code of Conduct & Ethics',
    'Essential organizational policies, professional workplace etiquette, conflict de-escalation, and inclusive campus standards.',
    true,
    120,
    5.00
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Campus Emergency Protocols & First Response',
    'Standard operating procedures for fire hazards, medical triage, severe weather alerts, and campus evacuation routines.',
    true,
    90,
    5.00
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Digital Classroom Pedagogy & Technology',
    'Best practices for modern hybrid instruction, learning analytics, collaborative software, and student engagement.',
    true,
    150,
    5.00
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  is_published = excluded.is_published,
  estimated_duration_minutes = excluded.estimated_duration_minutes;

-- 4. Course Modules (Sections for Course 1)
insert into public.course_modules (id, course_id, title, order_index)
values
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Module 1: Foundations & Core Principles',
    1
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'Module 2: Practical Implementation & Scenarios',
    2
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'Module 3: Knowledge Evaluation & Checkpoint',
    3
  )
on conflict (id) do update set
  title = excluded.title,
  order_index = excluded.order_index;

-- 5. Lessons for Course 1
insert into public.lessons (id, module_id, title, content_type, duration_minutes, order_index, is_published, content_body)
values
  (
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Overview & Essential Principles',
    'video',
    20,
    1,
    true,
    'Welcome to Child Safety & Protection Standards Training. This foundational module establishes standard practices, compliance benchmarks, and institutional responsibilities for educators and personnel.'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'Operational Guidelines & Implementation',
    'text',
    35,
    2,
    true,
    'Detailed operational protocols must be followed during daily interactions and supervisory roles. This section details routine audits, documentation routines, and escalation protocols for campus environments.'
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000002',
    'Case Study & Crisis Response Scenarios',
    'video',
    45,
    3,
    true,
    'Examine real-world case scenarios from diverse educational settings. Review how standard procedures were applied to resolve complex situational dilemmas promptly and transparently.'
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000003',
    'Knowledge Checkpoint & Assessment Quiz',
    'quiz',
    20,
    4,
    true,
    'Complete this knowledge evaluation checkpoint to verify your mastery of the curriculum topics. A passing grade certifies your readiness to implement these standards.'
  )
on conflict (id) do update set
  title = excluded.title,
  content_type = excluded.content_type,
  duration_minutes = excluded.duration_minutes;

-- 6. Quiz Configuration for Lesson 4
insert into public.quizzes (id, lesson_id, passing_score_percent, max_attempts)
values (
  'f0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000004',
  60,
  3
)
on conflict (lesson_id) do update set
  passing_score_percent = excluded.passing_score_percent;

-- 7. Quiz Questions
insert into public.quiz_questions (id, quiz_id, prompt, question_type, options, correct_answers, order_index)
values
  (
    'f0000000-0000-0000-0000-000000000011',
    'f0000000-0000-0000-0000-000000000001',
    'What is the mandatory timeframe for initiating documentation upon noticing a campus compliance concern?',
    'single_choice',
    '["Within 24 hours of the occurrence", "Immediately, but no later than the conclusion of the operational shift", "At the end of the calendar month review", "Only when requested by a supervisory audit"]'::jsonb,
    '[1]'::jsonb,
    1
  ),
  (
    'f0000000-0000-0000-0000-000000000012',
    'f0000000-0000-0000-0000-000000000001',
    'Which of the following is the primary objective of routine preventive campus inspections?',
    'single_choice',
    '["Assigning penalties to faculty members", "Proactively identifying and neutralizing hazards before harm occurs", "Replacing annual third-party audits", "Reducing scheduled instructional hours"]'::jsonb,
    '[1]'::jsonb,
    2
  ),
  (
    'f0000000-0000-0000-0000-000000000013',
    'f0000000-0000-0000-0000-000000000001',
    'When escalating an emergency protocol, who must be notified first per TwoStep Forward guidelines?',
    'single_choice',
    '["The Designated Campus Safety Lead & School Authority", "External media relations representatives", "Other educational branch affiliates", "General staff community forums"]'::jsonb,
    '[0]'::jsonb,
    3
  )
on conflict (id) do update set
  prompt = excluded.prompt,
  options = excluded.options,
  correct_answers = excluded.correct_answers;
