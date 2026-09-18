import { createAdminClient } from '@/lib/supabase/admin';
import { canAuthorContent, getAuthContext, isAdminRole, type AuthContext } from '@/lib/auth/server';
import type { UserRole } from '@/types/auth';
import type {
  AdminAssignment,
  AdminCourse,
  AdminSchool,
  AdminStoreData,
  AdminUser,
  CourseLesson,
  CourseModule,
  CourseLessonType,
} from '@/types/admin';

export const LMS_STORAGE_BUCKET = 'lms-content';

export class LmsError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'LmsError';
    this.status = status;
  }
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};
}

function requiredString(input: UnknownRecord, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new LmsError(`${key} is required.`);
  }
  return value.trim();
}

function optionalString(input: UnknownRecord, key: string): string | undefined {
  const value = input[key];
  return typeof value === 'string' ? value.trim() : undefined;
}

function boundedNumber(input: UnknownRecord, key: string, fallback: number, min: number, max: number): number {
  const value = Number(input[key]);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function validRole(value: unknown): value is UserRole {
  return value === 'super_admin' || value === 'org_admin' || value === 'manager' || value === 'instructor' || value === 'learner';
}

function validLessonType(value: unknown): value is CourseLessonType {
  return value === 'video' || value === 'pdf' || value === 'image' || value === 'text' || value === 'quiz' || value === 'reading';
}

function parseNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === 'number' && Number.isInteger(item));
}

function storagePathFromLesson(lesson: CourseLesson): string | null {
  if (lesson.storagePath) return lesson.storagePath;
  if (!lesson.fileUrl) return null;

  if (lesson.fileUrl.startsWith('lms-content/')) return lesson.fileUrl;

  try {
    const url = new URL(lesson.fileUrl, 'http://lms.local');
    const path = url.searchParams.get('path');
    return path || null;
  } catch {
    return null;
  }
}

function normalizeModules(value: unknown): CourseModule[] {
  if (!Array.isArray(value)) return [];

  return value.map((moduleValue, moduleIndex) => {
    const moduleRecord = asRecord(moduleValue);
    const lessons = Array.isArray(moduleRecord.lessons) ? moduleRecord.lessons : [];

    return {
      id: typeof moduleRecord.id === 'string' ? moduleRecord.id : `module-${moduleIndex + 1}`,
      title: typeof moduleRecord.title === 'string' && moduleRecord.title.trim() ? moduleRecord.title.trim() : `Module ${moduleIndex + 1}`,
      lessons: lessons.map((lessonValue, lessonIndex) => {
        const lesson = asRecord(lessonValue);
        const lessonType = validLessonType(lesson.type) ? lesson.type : 'text';
        const quizQuestions = Array.isArray(lesson.quizQuestions)
          ? lesson.quizQuestions.map((questionValue, questionIndex) => {
              const question = asRecord(questionValue);
              const options = Array.isArray(question.options)
                ? question.options.filter((option): option is string => typeof option === 'string').slice(0, 20)
                : [];
              return {
                id: typeof question.id === 'string' ? question.id : `question-${questionIndex + 1}`,
                question: typeof question.question === 'string' ? question.question.trim() : '',
                options,
                correctIndex: boundedNumber(question, 'correctIndex', 0, 0, Math.max(0, options.length - 1)),
                explanation: typeof question.explanation === 'string' ? question.explanation.trim() : '',
              };
            })
          : undefined;

        return {
          id: typeof lesson.id === 'string' ? lesson.id : `lesson-${lessonIndex + 1}`,
          title: typeof lesson.title === 'string' && lesson.title.trim() ? lesson.title.trim() : `Lesson ${lessonIndex + 1}`,
          durationMinutes: boundedNumber(lesson, 'durationMinutes', 10, 1, 3000),
          type: lessonType,
          summary: typeof lesson.summary === 'string' ? lesson.summary.trim() : '',
          content: typeof lesson.content === 'string' ? lesson.content : '',
          textContent: typeof lesson.textContent === 'string' ? lesson.textContent : undefined,
          fileUrl: typeof lesson.fileUrl === 'string' ? lesson.fileUrl : undefined,
          storagePath: typeof lesson.storagePath === 'string' ? lesson.storagePath : undefined,
          fileName: typeof lesson.fileName === 'string' ? lesson.fileName : undefined,
          fileSize: typeof lesson.fileSize === 'string' ? lesson.fileSize : undefined,
          keyTakeaways: Array.isArray(lesson.keyTakeaways)
            ? lesson.keyTakeaways.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
            : [],
          quizQuestions,
        };
      }),
    };
  });
}

function mapUser(profile: UnknownRecord, schoolNames: Map<string, string[]>): AdminUser {
  const role = validRole(profile.role) ? profile.role : 'learner';
  return {
    id: String(profile.id),
    name: String(profile.full_name || 'User'),
    email: String(profile.email || ''),
    role,
    schools: schoolNames.get(String(profile.id)) || [],
    status: profile.is_active === false ? 'inactive' : 'active',
    joinedDate: typeof profile.created_at === 'string' ? profile.created_at : undefined,
    lastActive: typeof profile.updated_at === 'string' ? profile.updated_at : undefined,
  };
}

function mapSchool(school: UnknownRecord, activeEmployees: number, activeCourses: number): AdminSchool {
  return {
    id: String(school.id),
    name: String(school.name || ''),
    code: String(school.code || ''),
    location: String(school.location || ''),
    description: String(school.description || ''),
    activeEmployees,
    activeCourses,
  };
}

function mapCourse(
  course: UnknownRecord,
  modules: UnknownRecord[],
  lessonsByModule: Map<string, UnknownRecord[]>,
  quizzesByLesson: Map<string, UnknownRecord>,
  questionsByQuiz: Map<string, UnknownRecord[]>,
  enrollmentCount: number
): AdminCourse {
  const mappedModules = modules.map((module) => {
    const moduleId = String(module.id);
    const mappedLessons = (lessonsByModule.get(moduleId) || []).map((lesson) => {
      const lessonId = String(lesson.id);
      const quiz = quizzesByLesson.get(lessonId);
      const questions = quiz ? questionsByQuiz.get(String(quiz.id)) || [] : [];

      return {
        id: lessonId,
        title: String(lesson.title || ''),
        durationMinutes: Number(lesson.duration_minutes || 0),
        type: (validLessonType(lesson.content_type) ? lesson.content_type : 'text') as CourseLessonType,
        summary: String(lesson.content_body || ''),
        content: String(lesson.content_body || ''),
        fileUrl: lesson.media_storage_path ? `/api/content/lessons/${lessonId}` : undefined,
        storagePath: lesson.media_storage_path ? String(lesson.media_storage_path) : undefined,
        fileName: lesson.media_storage_path ? String(lesson.media_storage_path).split('/').pop() : undefined,
        keyTakeaways: [],
        quizQuestions: questions.length
          ? questions.map((question) => {
              const correctAnswers = parseNumberArray(question.correct_answers);
              return {
                id: String(question.id),
                question: String(question.prompt || ''),
                options: Array.isArray(question.options)
                  ? question.options.filter((option): option is string => typeof option === 'string')
                  : [],
                correctIndex: correctAnswers[0] || 0,
                explanation: '',
              };
            })
          : undefined,
      };
    });

    return {
      id: moduleId,
      title: String(module.title || ''),
      lessons: mappedLessons,
    };
  });

  return {
    id: String(course.id),
    title: String(course.title || ''),
    description: typeof course.description === 'string' ? course.description : '',
    totalLessons: mappedModules.reduce((total, module) => total + module.lessons.length, 0),
    durationMinutes: Number(course.estimated_duration_minutes || 0),
    rating: Number(course.rating || 0),
    isPublished: course.is_published === true,
    enrolledCount: enrollmentCount,
    thumbnailUrl: typeof course.thumbnail_url === 'string' ? course.thumbnail_url : null,
    modules: mappedModules,
  };
}

function mapAssignment(
  assignment: UnknownRecord,
  users: Map<string, AdminUser>,
  courses: Map<string, AdminCourse>,
  schools: Map<string, AdminSchool>
): AdminAssignment {
  const user = users.get(String(assignment.user_id));
  const course = courses.get(String(assignment.course_id));
  const school = assignment.school_id ? schools.get(String(assignment.school_id)) : undefined;

  return {
    id: String(assignment.id),
    employeeId: String(assignment.user_id),
    employeeName: user?.name || 'Unknown user',
    email: user?.email || '',
    courseId: String(assignment.course_id),
    courseTitle: course?.title || 'Untitled course',
    schoolId: assignment.school_id ? String(assignment.school_id) : '',
    schoolName: school?.name || 'All Schools',
    status: assignment.status === 'completed' || assignment.status === 'in_progress' ? assignment.status : 'yet_to_start',
    progress: Number(assignment.progress_percent || 0),
    assignedAt: String(assignment.assigned_at || ''),
    dueDate: String(assignment.due_date || ''),
  };
}

export async function getBootstrap(context: AuthContext): Promise<AdminStoreData> {
  const admin = createAdminClient();
  const organizationId = context.profile.organization_id;
  const hasAdminAccess = isAdminRole(context.profile.role);

  const { data: membershipRows, error: membershipError } = await admin
    .from('school_memberships')
    .select('user_id, school_id')
    .eq('organization_id', organizationId);
  if (membershipError) throw new LmsError('Could not load school memberships.', 500);

  const { data: assignmentRows, error: assignmentError } = await admin
    .from('course_assignments')
    .select('*')
    .eq('organization_id', organizationId)
    .eq(hasAdminAccess ? 'organization_id' : 'user_id', hasAdminAccess ? organizationId : context.user.id);
  if (assignmentError) throw new LmsError('Could not load course assignments.', 500);

  const visibleAssignments = (assignmentRows || []) as UnknownRecord[];
  const visibleCourseIds = Array.from(new Set(visibleAssignments.map((assignment) => String(assignment.course_id))));

  let courseQuery = admin.from('courses').select('*').eq('organization_id', organizationId);
  if (!hasAdminAccess) {
    if (visibleCourseIds.length === 0) {
      courseQuery = admin.from('courses').select('*').eq('organization_id', organizationId).eq('id', '00000000-0000-0000-0000-000000000000');
    } else {
      courseQuery = courseQuery.in('id', visibleCourseIds);
    }
  }
  const { data: courseRows, error: courseError } = await courseQuery.order('created_at', { ascending: false });
  if (courseError) throw new LmsError('Could not load courses.', 500);
  const coursesRows = (courseRows || []) as UnknownRecord[];
  const courseIds = coursesRows.map((course) => String(course.id));

  const { data: moduleRows, error: moduleError } = courseIds.length
    ? await admin.from('course_modules').select('*').in('course_id', courseIds).order('order_index')
    : { data: [], error: null };
  if (moduleError) throw new LmsError('Could not load course modules.', 500);
  const modulesRows = (moduleRows || []) as UnknownRecord[];
  const moduleIds = modulesRows.map((module) => String(module.id));

  const { data: lessonRows, error: lessonError } = moduleIds.length
    ? await admin.from('lessons').select('*').in('module_id', moduleIds).order('order_index')
    : { data: [], error: null };
  if (lessonError) throw new LmsError('Could not load lessons.', 500);
  const lessonsRows = (lessonRows || []) as UnknownRecord[];
  const lessonIds = lessonsRows.map((lesson) => String(lesson.id));

  const { data: quizRows, error: quizError } = lessonIds.length
    ? await admin.from('quizzes').select('*').in('lesson_id', lessonIds)
    : { data: [], error: null };
  if (quizError) throw new LmsError('Could not load quiz configuration.', 500);
  const quizzesRows = (quizRows || []) as UnknownRecord[];
  const quizIds = quizzesRows.map((quiz) => String(quiz.id));

  const { data: questionRows, error: questionError } = quizIds.length
    ? await admin.from('quiz_questions').select('*').in('quiz_id', quizIds).order('order_index')
    : { data: [], error: null };
  if (questionError) throw new LmsError('Could not load quiz questions.', 500);

  const { data: schoolRows, error: schoolError } = await admin
    .from('schools')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');
  if (schoolError) throw new LmsError('Could not load schools.', 500);
  const schoolsRows = (schoolRows || []) as UnknownRecord[];

  const { data: profileRows, error: profileError } = hasAdminAccess
    ? await admin.from('profiles').select('*').eq('organization_id', organizationId).order('full_name')
    : await admin.from('profiles').select('*').eq('id', context.user.id);
  if (profileError) throw new LmsError('Could not load users.', 500);
  const profilesRows = (profileRows || []) as UnknownRecord[];

  const schoolNamesByUser = new Map<string, string[]>();
  const schoolNameById = new Map(schoolsRows.map((school) => [String(school.id), String(school.name || '')]));
  for (const membership of (membershipRows || []) as UnknownRecord[]) {
    const userId = String(membership.user_id);
    const schoolName = schoolNameById.get(String(membership.school_id));
    if (!schoolName) continue;
    const current = schoolNamesByUser.get(userId) || [];
    current.push(schoolName);
    schoolNamesByUser.set(userId, current);
  }

  const users = profilesRows.map((profile) => mapUser(profile, schoolNamesByUser));
  const usersById = new Map(users.map((user) => [user.id, user]));
  const lessonsByModule = new Map<string, UnknownRecord[]>();
  for (const lesson of lessonsRows) {
    const moduleId = String(lesson.module_id);
    const current = lessonsByModule.get(moduleId) || [];
    current.push(lesson);
    lessonsByModule.set(moduleId, current);
  }
  const quizzesByLesson = new Map(quizzesRows.map((quiz) => [String(quiz.lesson_id), quiz]));
  const questionsByQuiz = new Map<string, UnknownRecord[]>();
  for (const question of (questionRows || []) as UnknownRecord[]) {
    const quizId = String(question.quiz_id);
    const current = questionsByQuiz.get(quizId) || [];
    current.push(question);
    questionsByQuiz.set(quizId, current);
  }
  const assignmentsByCourse = new Map<string, number>();
  for (const assignment of visibleAssignments) {
    const courseId = String(assignment.course_id);
    assignmentsByCourse.set(courseId, (assignmentsByCourse.get(courseId) || 0) + 1);
  }
  const schools = schoolsRows.map((school) => {
    const schoolId = String(school.id);
    const activeEmployees = (membershipRows || []).filter((membership) => String(membership.school_id) === schoolId).length;
    const activeCourses = new Set(
      visibleAssignments
        .filter((assignment) => String(assignment.school_id || '') === schoolId)
        .map((assignment) => String(assignment.course_id))
    ).size;
    return mapSchool(school, activeEmployees, activeCourses);
  });
  const schoolsById = new Map(schools.map((school) => [school.id, school]));
  const courses = coursesRows.map((course) => {
    const courseModules = modulesRows.filter((module) => String(module.course_id) === String(course.id));
    return mapCourse(course, courseModules, lessonsByModule, quizzesByLesson, questionsByQuiz, assignmentsByCourse.get(String(course.id)) || 0);
  });
  const coursesById = new Map(courses.map((course) => [course.id, course]));
  const assignments = visibleAssignments.map((assignment) => mapAssignment(assignment, usersById, coursesById, schoolsById));

  return {
    schools,
    users,
    courses,
    assignments,
    currentUserId: context.user.id,
  };
}

function requireAdmin(context: AuthContext): void {
  if (!isAdminRole(context.profile.role)) throw new LmsError('Administrator access is required.', 403);
}

function requireContentAuthor(context: AuthContext): void {
  if (!canAuthorContent(context.profile.role)) throw new LmsError('Content author access is required.', 403);
}

async function schoolNamesToIds(admin: ReturnType<typeof createAdminClient>, organizationId: string, names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const { data, error } = await admin.from('schools').select('id, name').eq('organization_id', organizationId).in('name', names);
  if (error) throw new LmsError('Could not validate school access.', 400);
  return ((data || []) as UnknownRecord[]).map((school) => String(school.id));
}

async function replaceMemberships(
  admin: ReturnType<typeof createAdminClient>,
  organizationId: string,
  userId: string,
  schoolNames: string[]
): Promise<void> {
  const schoolIds = await schoolNamesToIds(admin, organizationId, schoolNames);
  await admin.from('school_memberships').delete().eq('organization_id', organizationId).eq('user_id', userId);
  if (schoolIds.length === 0) return;
  const { error } = await admin.from('school_memberships').insert(
    schoolIds.map((schoolId) => ({ organization_id: organizationId, school_id: schoolId, user_id: userId }))
  );
  if (error) throw new LmsError('Could not save school memberships.', 400);
}

export async function performMutation(context: AuthContext, action: string, rawInput: unknown): Promise<UnknownRecord> {
  const input = asRecord(rawInput);
  const admin = createAdminClient();
  const organizationId = context.profile.organization_id;

  if (action === 'create_school') {
    requireAdmin(context);
    const { data, error } = await admin
      .from('schools')
      .insert({
        organization_id: organizationId,
        name: requiredString(input, 'name'),
        code: requiredString(input, 'code').toUpperCase(),
        location: requiredString(input, 'location'),
        description: optionalString(input, 'description') || '',
      })
      .select()
      .single();
    if (error || !data) throw new LmsError('Could not create the school.', 400);
    return { school: data as UnknownRecord };
  }

  if (action === 'update_school') {
    requireAdmin(context);
    const id = requiredString(input, 'id');
    const { data, error } = await admin
      .from('schools')
      .update({
        name: requiredString(input, 'name'),
        code: requiredString(input, 'code').toUpperCase(),
        location: requiredString(input, 'location'),
        description: optionalString(input, 'description') || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();
    if (error || !data) throw new LmsError('Could not update the school.', 400);
    return { school: data as UnknownRecord };
  }

  if (action === 'delete_school') {
    requireAdmin(context);
    const id = requiredString(input, 'id');
    const { error } = await admin.from('schools').delete().eq('id', id).eq('organization_id', organizationId);
    if (error) throw new LmsError('Could not delete the school.', 400);
    return { id };
  }

  if (action === 'create_user') {
    if (!['super_admin', 'org_admin'].includes(context.profile.role)) throw new LmsError('Organization administrator access is required.', 403);
    const name = requiredString(input, 'name');
    const email = requiredString(input, 'email').toLowerCase();
    const role = validRole(input.role) && input.role !== 'super_admin' ? input.role : 'learner';
    const schoolNames = Array.isArray(input.schools) ? input.schools.filter((item): item is string => typeof item === 'string') : [];
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name },
    });
    if (inviteError || !invited.user) throw new LmsError(inviteError?.message || 'Could not invite the user.', 400);

    const { error: profileError } = await admin.from('profiles').upsert({
      id: invited.user.id,
      organization_id: organizationId,
      email,
      full_name: name,
      role,
      is_active: true,
    });
    if (profileError) throw new LmsError('The user was invited but the profile could not be created.', 500);
    await replaceMemberships(admin, organizationId, invited.user.id, schoolNames);
    return { id: invited.user.id };
  }

  if (action === 'update_user') {
    if (!['super_admin', 'org_admin'].includes(context.profile.role)) throw new LmsError('Organization administrator access is required.', 403);
    const id = requiredString(input, 'id');
    if (id === context.user.id && input.status === 'inactive') throw new LmsError('You cannot deactivate your own account.', 400);
    const name = requiredString(input, 'name');
    const email = requiredString(input, 'email').toLowerCase();
    const role = validRole(input.role) ? input.role : 'learner';
    const isActive = input.status !== 'inactive';
    const { data: existing, error: existingError } = await admin.from('profiles').select('email').eq('id', id).eq('organization_id', organizationId).single();
    if (existingError || !existing) throw new LmsError('User could not be found.', 404);
    if (String(existing.email).toLowerCase() !== email) {
      const { error: authError } = await admin.auth.admin.updateUserById(id, { email });
      if (authError) throw new LmsError('Could not update the authentication email.', 400);
    }
    const { error } = await admin.from('profiles').update({ full_name: name, email, role, is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId);
    if (error) throw new LmsError('Could not update the user profile.', 400);
    const schoolNames = Array.isArray(input.schools) ? input.schools.filter((item): item is string => typeof item === 'string') : [];
    await replaceMemberships(admin, organizationId, id, schoolNames);
    return { id };
  }

  if (action === 'delete_user') {
    if (!['super_admin', 'org_admin'].includes(context.profile.role)) throw new LmsError('Organization administrator access is required.', 403);
    const id = requiredString(input, 'id');
    if (id === context.user.id) throw new LmsError('You cannot delete your own account.', 400);
    const { data: target, error: targetError } = await admin.from('profiles').select('id').eq('id', id).eq('organization_id', organizationId).single();
    if (targetError || !target) throw new LmsError('User could not be found.', 404);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new LmsError('Could not delete the user account.', 400);
    return { id };
  }

  if (action === 'create_course') {
    requireContentAuthor(context);
    const { data, error } = await admin
      .from('courses')
      .insert({
        organization_id: organizationId,
        title: requiredString(input, 'title'),
        description: optionalString(input, 'description') || '',
        estimated_duration_minutes: boundedNumber(input, 'durationMinutes', 0, 0, 100000),
        is_published: input.isPublished === true,
        created_by: context.user.id,
      })
      .select()
      .single();
    if (error || !data) throw new LmsError('Could not create the course.', 400);
    return { id: String((data as UnknownRecord).id) };
  }

  if (action === 'update_course') {
    requireContentAuthor(context);
    const id = requiredString(input, 'id');
    const { data, error } = await admin
      .from('courses')
      .update({
        title: requiredString(input, 'title'),
        estimated_duration_minutes: boundedNumber(input, 'durationMinutes', 0, 0, 100000),
        is_published: input.isPublished === true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();
    if (error || !data) throw new LmsError('Could not update the course.', 400);
    return { id: String((data as UnknownRecord).id) };
  }

  if (action === 'toggle_course_publish') {
    requireContentAuthor(context);
    const id = requiredString(input, 'id');
    const { data: course, error: courseError } = await admin.from('courses').select('is_published').eq('id', id).eq('organization_id', organizationId).single();
    if (courseError || !course) throw new LmsError('Course could not be found.', 404);
    const { error } = await admin.from('courses').update({ is_published: !(course as UnknownRecord).is_published, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', organizationId);
    if (error) throw new LmsError('Could not update course publication status.', 400);
    return { id };
  }

  if (action === 'delete_course') {
    requireContentAuthor(context);
    const id = requiredString(input, 'id');
    const { error } = await admin.from('courses').delete().eq('id', id).eq('organization_id', organizationId);
    if (error) throw new LmsError('Could not delete the course.', 400);
    return { id };
  }

  if (action === 'save_course_curriculum') {
    requireContentAuthor(context);
    const modules = normalizeModules(input.modules);
    const title = requiredString(input, 'title');
    const courseId = optionalString(input, 'id');
    let resolvedCourseId = courseId;

    if (resolvedCourseId) {
      const { error } = await admin.from('courses').update({
        title,
        description: optionalString(input, 'description') || '',
        is_published: input.isPublished === true,
        estimated_duration_minutes: modules.reduce((sum, module) => sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.durationMinutes, 0), 0),
        updated_at: new Date().toISOString(),
      }).eq('id', resolvedCourseId).eq('organization_id', organizationId);
      if (error) throw new LmsError('Could not update the course curriculum.', 400);
      await admin.from('course_modules').delete().eq('course_id', resolvedCourseId);
    } else {
      const { data, error } = await admin.from('courses').insert({
        organization_id: organizationId,
        title,
        description: optionalString(input, 'description') || '',
        is_published: input.isPublished === true,
        estimated_duration_minutes: modules.reduce((sum, module) => sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.durationMinutes, 0), 0),
        created_by: context.user.id,
      }).select('id').single();
      if (error || !data) throw new LmsError('Could not create the course curriculum.', 400);
      resolvedCourseId = String((data as UnknownRecord).id);
    }

    for (const [moduleIndex, module] of modules.entries()) {
      const { data: insertedModule, error: moduleError } = await admin.from('course_modules').insert({
        course_id: resolvedCourseId,
        title: module.title,
        order_index: moduleIndex,
      }).select('id').single();
      if (moduleError || !insertedModule) throw new LmsError('Could not save a course module.', 400);
      const insertedModuleId = String((insertedModule as UnknownRecord).id);

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        const { data: insertedLesson, error: lessonError } = await admin.from('lessons').insert({
          module_id: insertedModuleId,
          title: lesson.title,
          content_type: lesson.type,
          content_body: lesson.content || lesson.summary || null,
          media_storage_path: storagePathFromLesson(lesson),
          duration_minutes: lesson.durationMinutes,
          order_index: lessonIndex,
          is_published: true,
        }).select('id').single();
        if (lessonError || !insertedLesson) throw new LmsError('Could not save a course lesson.', 400);

        if (lesson.type === 'quiz') {
          const insertedLessonId = String((insertedLesson as UnknownRecord).id);
          const { data: quiz, error: quizError } = await admin.from('quizzes').insert({ lesson_id: insertedLessonId, passing_score_percent: 60, max_attempts: 3 }).select('id').single();
          if (quizError || !quiz) throw new LmsError('Could not save the quiz configuration.', 400);
          const quizId = String((quiz as UnknownRecord).id);
          const questions = (lesson.quizQuestions || []).filter((question) => question.question.trim() && question.options.length > 0);
          if (questions.length > 0) {
            const { error: questionError } = await admin.from('quiz_questions').insert(questions.map((question, questionIndex) => ({
              quiz_id: quizId,
              prompt: question.question,
              question_type: 'single_choice',
              options: question.options,
              correct_answers: [question.correctIndex],
              order_index: questionIndex,
            })));
            if (questionError) throw new LmsError('Could not save quiz questions.', 400);
          }
        }
      }
    }

    return { id: resolvedCourseId };
  }

  if (action === 'create_assignment') {
    requireAdmin(context);
    const userId = requiredString(input, 'employeeId');
    const courseId = requiredString(input, 'courseId');
    const schoolId = requiredString(input, 'schoolId');
    const dueDate = requiredString(input, 'dueDate');
    const { data, error } = await admin.from('course_assignments').insert({
      organization_id: organizationId,
      user_id: userId,
      course_id: courseId,
      school_id: schoolId,
      assigned_by: context.user.id,
      status: 'yet_to_start',
      progress_percent: 0,
      due_date: dueDate,
    }).select('id').single();
    if (error || !data) throw new LmsError('Could not create the course assignment.', 400);
    return { id: String((data as UnknownRecord).id) };
  }

  if (action === 'update_assignment_status') {
    requireAdmin(context);
    const id = requiredString(input, 'id');
    const status = input.status === 'completed' || input.status === 'in_progress' ? input.status : 'yet_to_start';
    const progress = status === 'completed' ? 100 : status === 'in_progress' ? Math.max(25, boundedNumber(input, 'progress', 25, 1, 99)) : 0;
    const { error } = await admin.from('course_assignments').update({ status, progress_percent: progress, completed_at: status === 'completed' ? new Date().toISOString() : null }).eq('id', id).eq('organization_id', organizationId);
    if (error) throw new LmsError('Could not update the assignment.', 400);
    return { id };
  }

  if (action === 'delete_assignment') {
    requireAdmin(context);
    const id = requiredString(input, 'id');
    const { error } = await admin.from('course_assignments').delete().eq('id', id).eq('organization_id', organizationId);
    if (error) throw new LmsError('Could not delete the assignment.', 400);
    return { id };
  }

  if (action === 'update_progress') {
    const requestedUserId = optionalString(input, 'employeeId') || context.user.id;
    if (!isAdminRole(context.profile.role) && requestedUserId !== context.user.id) throw new LmsError('You can only update your own progress.', 403);
    const courseId = requiredString(input, 'courseId');
    const progress = boundedNumber(input, 'progressPercent', 0, 0, 100);
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'yet_to_start';
    const { error } = await admin.from('course_assignments').update({ progress_percent: progress, status, completed_at: progress >= 100 ? new Date().toISOString() : null }).eq('organization_id', organizationId).eq('user_id', requestedUserId).eq('course_id', courseId);
    if (error) throw new LmsError('Could not save learning progress.', 400);
    return { courseId, userId: requestedUserId, progress };
  }

  throw new LmsError('Unsupported LMS operation.', 400);
}

export async function requireLmsContext(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) throw new LmsError('Authentication is required.', 401);
  return context;
}
