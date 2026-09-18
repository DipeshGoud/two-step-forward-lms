-- Ensure the Supabase PostgREST roles can reach the LMS tables.
-- RLS policies remain responsible for row-level authorization.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on table
  public.organizations,
  public.profiles,
  public.schools,
  public.school_memberships,
  public.courses,
  public.course_assignments,
  public.course_modules,
  public.lessons,
  public.lesson_progress,
  public.quizzes,
  public.quiz_questions,
  public.quiz_attempts,
  public.certificates,
  public.manuals,
  public.manual_bookmarks,
  public.spaces,
  public.notifications,
  public.course_reviews
to authenticated;

grant all privileges on table
  public.organizations,
  public.profiles,
  public.schools,
  public.school_memberships,
  public.courses,
  public.course_assignments,
  public.course_modules,
  public.lessons,
  public.lesson_progress,
  public.quizzes,
  public.quiz_questions,
  public.quiz_attempts,
  public.certificates,
  public.manuals,
  public.manual_bookmarks,
  public.spaces,
  public.notifications,
  public.course_reviews
to service_role;

grant execute on function public.current_user_org_id() to authenticated, service_role;
grant execute on function public.current_user_role() to authenticated, service_role;
