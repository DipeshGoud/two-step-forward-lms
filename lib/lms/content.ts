import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminRole, type AuthContext } from '@/lib/auth/server';
import { LMS_STORAGE_BUCKET, LmsError } from './server';

interface AuthorizedObject {
  path: string;
  contentType: string;
}

function contentTypeForLesson(type: string, path: string): string {
  if (type === 'pdf') return 'application/pdf';
  if (type === 'image') {
    if (/\.png$/i.test(path)) return 'image/png';
    if (/\.webp$/i.test(path)) return 'image/webp';
    if (/\.gif$/i.test(path)) return 'image/gif';
    return 'image/jpeg';
  }
  if (type === 'video') {
    if (/\.webm$/i.test(path)) return 'video/webm';
    if (/\.mov$/i.test(path)) return 'video/quicktime';
    return 'video/mp4';
  }
  return 'application/octet-stream';
}

export async function getAuthorizedLessonObject(context: AuthContext, lessonId: string): Promise<AuthorizedObject> {
  const admin = createAdminClient();
  const { data: lesson, error: lessonError } = await admin
    .from('lessons')
    .select('id, module_id, content_type, media_storage_path, is_published')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonError || !lesson || !lesson.media_storage_path) {
    throw new LmsError('Learning content was not found.', 404);
  }

  const { data: module, error: moduleError } = await admin
    .from('course_modules')
    .select('course_id')
    .eq('id', lesson.module_id)
    .maybeSingle();
  if (moduleError || !module) throw new LmsError('Learning content was not found.', 404);

  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('organization_id, is_published')
    .eq('id', module.course_id)
    .maybeSingle();
  if (courseError || !course || course.organization_id !== context.profile.organization_id) {
    throw new LmsError('Learning content was not found.', 404);
  }

  if (!isAdminRole(context.profile.role)) {
    if (!course.is_published || !lesson.is_published) throw new LmsError('Learning content is not available.', 403);
    const { data: assignment, error: assignmentError } = await admin
      .from('course_assignments')
      .select('id')
      .eq('organization_id', context.profile.organization_id)
      .eq('course_id', module.course_id)
      .eq('user_id', context.user.id)
      .maybeSingle();
    if (assignmentError || !assignment) throw new LmsError('You are not assigned to this course.', 403);
  }

  return {
    path: String(lesson.media_storage_path),
    contentType: contentTypeForLesson(String(lesson.content_type), String(lesson.media_storage_path)),
  };
}

export async function downloadObject(object: AuthorizedObject): Promise<Response> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(LMS_STORAGE_BUCKET).download(object.path);
  if (error || !data) throw new LmsError('Learning content could not be loaded.', 404);

  return new Response(data, {
    headers: {
      'Content-Type': object.contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
