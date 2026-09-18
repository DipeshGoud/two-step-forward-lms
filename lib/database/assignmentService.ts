import { createAdminClient } from '@/lib/supabase/admin';
import { DbCourseAssignment } from './types';
import { INITIAL_ADMIN_STORE, AdminAssignment } from '@/lib/data/adminStore';

export interface EnrichedAssignment extends DbCourseAssignment {
  courseTitle: string;
  employeeName: string;
  employeeEmail: string;
  schoolName: string;
}

interface AssignmentRow extends Record<string, unknown> {
  course?: { title?: string; estimated_duration_minutes?: number; thumbnail_url?: string | null; rating?: number };
  profile?: { full_name?: string; email?: string };
  school?: { name?: string };
}

export async function getAssignments(orgId?: string): Promise<EnrichedAssignment[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('course_assignments').select(`
      *,
      course:courses(title),
      profile:profiles(full_name, email),
      school:schools(name)
    `);

    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return fallbackAssignments();
    }

    return data.map((row: AssignmentRow) => ({
      ...row,
      courseTitle: row.course?.title || 'Untitled Course',
      employeeName: row.profile?.full_name || 'Unknown Staff',
      employeeEmail: row.profile?.email || '',
      schoolName: row.school?.name || 'All Schools',
    })) as EnrichedAssignment[];
  } catch {
    return fallbackAssignments();
  }
}

export async function getUserAssignments(userId: string): Promise<EnrichedAssignment[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('course_assignments')
      .select(`
        *,
        course:courses(title, estimated_duration_minutes, thumbnail_url, rating),
        profile:profiles(full_name, email),
        school:schools(name)
      `)
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      return fallbackAssignments().filter((a) => a.user_id === userId);
    }

    return data.map((row: AssignmentRow) => ({
      ...row,
      courseTitle: row.course?.title || 'Untitled Course',
      employeeName: row.profile?.full_name || 'Unknown Staff',
      employeeEmail: row.profile?.email || '',
      schoolName: row.school?.name || 'All Schools',
    })) as EnrichedAssignment[];
  } catch {
    return fallbackAssignments().filter((a) => a.user_id === userId);
  }
}

export async function updateLearnerCourseProgress(
  userId: string,
  courseId: string,
  progressPercent: number
): Promise<boolean> {
  const status =
    progressPercent >= 100
      ? 'completed'
      : progressPercent > 0
      ? 'in_progress'
      : 'yet_to_start';

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('course_assignments')
      .update({
        progress_percent: progressPercent,
        status,
        completed_at: progressPercent >= 100 ? new Date().toISOString() : null,
      })
      .match({ user_id: userId, course_id: courseId });

    return !error;
  } catch {
    return true;
  }
}

export async function createAssignment(payload: {
  employeeId: string;
  courseId: string;
  schoolId?: string;
  dueDate?: string;
  organizationId?: string;
}): Promise<DbCourseAssignment> {
  const orgId = payload.organizationId || 'a0000000-0000-0000-0000-000000000001';
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('course_assignments')
      .insert({
        organization_id: orgId,
        user_id: payload.employeeId,
        course_id: payload.courseId,
        school_id: payload.schoolId || null,
        status: 'yet_to_start',
        progress_percent: 0,
        due_date: payload.dueDate || null,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        id: `asg-${Date.now()}`,
        organization_id: orgId,
        user_id: payload.employeeId,
        course_id: payload.courseId,
        school_id: payload.schoolId || null,
        assigned_by: null,
        status: 'yet_to_start',
        progress_percent: 0,
        assigned_at: new Date().toISOString(),
        due_date: payload.dueDate || null,
        completed_at: null,
      };
    }
    return data as DbCourseAssignment;
  } catch {
    return {
      id: `asg-${Date.now()}`,
      organization_id: orgId,
      user_id: payload.employeeId,
      course_id: payload.courseId,
      school_id: payload.schoolId || null,
      assigned_by: null,
      status: 'yet_to_start',
      progress_percent: 0,
      assigned_at: new Date().toISOString(),
      due_date: payload.dueDate || null,
      completed_at: null,
    };
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('course_assignments').delete().eq('id', id);
    return !error;
  } catch {
    return true;
  }
}

function fallbackAssignments(): EnrichedAssignment[] {
  return INITIAL_ADMIN_STORE.assignments.map((a: AdminAssignment) => ({
    id: a.id,
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    course_id: a.courseId,
    user_id: a.employeeId,
    school_id: a.schoolId || null,
    assigned_by: null,
    status: a.status,
    progress_percent: a.progress,
    assigned_at: a.assignedAt || new Date().toISOString(),
    due_date: a.dueDate || null,
    completed_at: a.status === 'completed' ? new Date().toISOString() : null,
    courseTitle: a.courseTitle,
    employeeName: a.employeeName,
    employeeEmail: `${a.employeeName.toLowerCase().replace(/\s+/g, '.')}@twostepforward.edu`,
    schoolName: a.schoolName || 'All Schools',
  }));
}
