'use client';

import { useEffect, useSyncExternalStore } from 'react';
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

export type {
  AdminAssignment,
  AdminCourse,
  AdminSchool,
  AdminStoreData,
  AdminUser,
  CourseLesson,
  CourseModule,
  CourseLessonType,
};

export function isUserAdmin(role?: string): boolean {
  return role === 'super_admin' || role === 'org_admin' || role === 'manager';
}

export const INITIAL_ADMIN_STORE: AdminStoreData = {
  schools: [],
  users: [],
  courses: [],
  assignments: [],
  completedLessons: {},
};

let memoryStore = INITIAL_ADMIN_STORE;
let isReady = false;
let refreshPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function applyState(state: AdminStoreData) {
  memoryStore = state;
  isReady = true;
  emitChange();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }
  return body as T;
}

async function refresh(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch('/api/lms', { cache: 'no-store' })
    .then((response) => parseResponse<AdminStoreData>(response))
    .then((state) => applyState(state))
    .catch((error: unknown) => {
      isReady = true;
      emitChange();
      console.error('Could not load LMS data:', error);
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

interface MutationResponse {
  state: AdminStoreData;
  result?: Record<string, unknown>;
}

// Heavy admin operations get the global branded loading overlay; frequent
// background syncs (progress, quizzes) stay silent and use inline feedback.
const MUTATION_LABELS: Record<string, string> = {
  create_school: 'Creating school',
  update_school: 'Saving school',
  delete_school: 'Deleting school',
  create_user: 'Creating user',
  update_user: 'Saving user',
  delete_user: 'Deleting user',
  create_course: 'Creating course',
  update_course: 'Saving course',
  save_course_curriculum: 'Saving curriculum',
  delete_course: 'Deleting course',
  toggle_course_publish: 'Updating course',
  create_assignment: 'Assigning course',
  update_assignment_status: 'Updating assignment',
  delete_assignment: 'Removing assignment',
};

function announceMutationStart(action: string): boolean {
  const label = MUTATION_LABELS[action];
  if (!label || typeof window === 'undefined') return false;
  window.dispatchEvent(new CustomEvent('lms-mutation-start', { detail: { label } }));
  return true;
}

function announceMutationEnd(announced: boolean): void {
  if (!announced || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('lms-mutation-end'));
}

async function mutate(action: string, input: Record<string, unknown> = {}): Promise<MutationResponse> {
  const announced = announceMutationStart(action);
  try {
    const response = await fetch('/api/lms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, input }),
    });
    const body = await parseResponse<MutationResponse>(response);
    applyState(body.state);
    return body;
  } finally {
    announceMutationEnd(announced);
  }
}

function findSchool(id: string, state: AdminStoreData): AdminSchool {
  const school = state.schools.find((item) => item.id === id);
  if (!school) throw new Error('School could not be found.');
  return school;
}

function findUser(id: string, state: AdminStoreData): AdminUser {
  const user = state.users.find((item) => item.id === id);
  if (!user) throw new Error('User could not be found.');
  return user;
}

function findCourse(id: string, state: AdminStoreData): AdminCourse {
  const course = state.courses.find((item) => item.id === id);
  if (!course) throw new Error('Course could not be found.');
  return course;
}

function findAssignment(id: string, state: AdminStoreData): AdminAssignment {
  const assignment = state.assignments.find((item) => item.id === id);
  if (!assignment) throw new Error('Assignment could not be found.');
  return assignment;
}

export const adminStore = {
  getSnapshot(): AdminStoreData {
    return memoryStore;
  },

  getReadySnapshot(): boolean {
    return isReady;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  refresh,

  async createSchool(payload: {
    name: string;
    code: string;
    location: string;
    description: string;
  }): Promise<AdminSchool> {
    await mutate('create_school', payload);
    return memoryStore.schools.find((school) => school.code === payload.code.toUpperCase()) || memoryStore.schools[0];
  },

  async updateSchool(schoolId: string, payload: Partial<Omit<AdminSchool, 'id'>>): Promise<AdminSchool> {
    const current = findSchool(schoolId, memoryStore);
    await mutate('update_school', {
      id: schoolId,
      name: payload.name ?? current.name,
      code: payload.code ?? current.code,
      location: payload.location ?? current.location,
      description: payload.description ?? current.description,
    });
    return findSchool(schoolId, memoryStore);
  },

  async deleteSchool(schoolId: string): Promise<void> {
    await mutate('delete_school', { id: schoolId });
  },

  async createUser(payload: {
    name: string;
    email: string;
    role: 'super_admin' | 'org_admin' | 'manager' | 'instructor' | 'learner';
    schools: string[];
  }): Promise<{ user: AdminUser; temporaryPassword: string }> {
    const response = await mutate('create_user', payload);
    const userId = String(response.result?.id || '');
    return {
      user: findUser(userId, memoryStore),
      temporaryPassword: String(response.result?.temporaryPassword || ''),
    };
  },

  async updateUser(userId: string, payload: Partial<Omit<AdminUser, 'id'>>): Promise<AdminUser> {
    const current = findUser(userId, memoryStore);
    await mutate('update_user', {
      id: userId,
      name: payload.name ?? current.name,
      email: payload.email ?? current.email,
      role: payload.role ?? current.role,
      status: payload.status ?? current.status,
      schools: payload.schools ?? current.schools,
    });
    return findUser(userId, memoryStore);
  },

  async deleteUser(userId: string): Promise<void> {
    await mutate('delete_user', { id: userId });
  },

  async createCourse(payload: {
    title: string;
    totalLessons: number;
    durationMinutes: number;
    isPublished: boolean;
    thumbnailUrl?: string | null;
  }): Promise<AdminCourse> {
    const response = await mutate('create_course', payload);
    return findCourse(String(response.result?.id || ''), memoryStore);
  },

  async updateCourse(courseId: string, payload: Partial<Omit<AdminCourse, 'id'>>): Promise<AdminCourse> {
    const current = findCourse(courseId, memoryStore);
    await mutate('update_course', {
      id: courseId,
      title: payload.title ?? current.title,
      totalLessons: payload.totalLessons ?? current.totalLessons,
      durationMinutes: payload.durationMinutes ?? current.durationMinutes,
      isPublished: payload.isPublished ?? current.isPublished,
      thumbnailUrl: payload.thumbnailUrl ?? current.thumbnailUrl,
    });
    return findCourse(courseId, memoryStore);
  },

  async saveCourseWithCurriculum(payload: {
    id?: string;
    title: string;
    description?: string;
    thumbnailUrl?: string | null;
    isPublished: boolean;
    modules: CourseModule[];
  }): Promise<AdminCourse> {
    const response = await mutate('save_course_curriculum', payload as unknown as Record<string, unknown>);
    return findCourse(String(response.result?.id || payload.id || ''), memoryStore);
  },

  async deleteCourse(courseId: string): Promise<void> {
    await mutate('delete_course', { id: courseId });
  },

  async toggleCoursePublish(courseId: string): Promise<AdminCourse> {
    await mutate('toggle_course_publish', { id: courseId });
    return findCourse(courseId, memoryStore);
  },

  async createAssignment(payload: {
    employeeId: string;
    courseId: string;
    schoolId: string;
    dueDate: string;
  }): Promise<AdminAssignment> {
    const response = await mutate('create_assignment', payload);
    return findAssignment(String(response.result?.id || ''), memoryStore);
  },

  async updateAssignmentStatus(
    assignmentId: string,
    status: 'yet_to_start' | 'in_progress' | 'completed',
    progress?: number
  ): Promise<AdminAssignment> {
    await mutate('update_assignment_status', { id: assignmentId, status, progress });
    return findAssignment(assignmentId, memoryStore);
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    await mutate('delete_assignment', { id: assignmentId });
  },

  async updateLearnerCourseProgress(
    employeeId: string,
    courseId: string,
    progressPercent: number,
    lessonId?: string,
    isCompleted?: boolean
  ): Promise<{ certificateNumber?: string }> {
    const response = await mutate('update_progress', { employeeId, courseId, progressPercent, lessonId, isCompleted });
    const result = (response.result || {}) as { certificateNumber?: string };
    return { certificateNumber: result.certificateNumber };
  },

  async submitQuizAttempt(
    lessonId: string,
    answers: Record<string, number>
  ): Promise<{
    scorePercent: number;
    isPassed: boolean;
    passingScorePercent: number;
    attemptsUsed: number;
    maxAttempts: number;
  }> {
    const response = await mutate('submit_quiz_attempt', { lessonId, answers });
    return response.result as {
      scorePercent: number;
      isPassed: boolean;
      passingScorePercent: number;
      attemptsUsed: number;
      maxAttempts: number;
    };
  },

  async enrollLearnerInCourse(employeeId: string, courseId: string, schoolId?: string): Promise<AdminAssignment> {
    const selectedSchoolId = schoolId || memoryStore.schools[0]?.id;
    if (!selectedSchoolId) throw new Error('A school is required for enrollment.');
    const response = await mutate('create_assignment', {
      employeeId,
      courseId,
      schoolId: selectedSchoolId,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    return findAssignment(String(response.result?.id || ''), memoryStore);
  },

  async updateMyProfile(payload: { name: string; avatarUrl?: string }): Promise<void> {
    await mutate('update_my_profile', payload);
  },
};

export function useAdminStore() {
  const store = useSyncExternalStore(
    adminStore.subscribe,
    adminStore.getSnapshot,
    () => INITIAL_ADMIN_STORE
  );
  const isHydrated = useSyncExternalStore(
    adminStore.subscribe,
    adminStore.getReadySnapshot,
    () => false
  );

  useEffect(() => {
    void adminStore.refresh();
  }, []);

  const totalSchools = store.schools.length;
  const totalEmployees = store.users.length;
  const activeCourses = store.courses.filter((course) => course.isPublished).length;
  const totalAssignments = store.assignments.length;
  const completedCount = store.assignments.filter((assignment) => assignment.status === 'completed').length;
  const inProgressCount = store.assignments.filter((assignment) => assignment.status === 'in_progress').length;
  const yetToStartCount = store.assignments.filter((assignment) => assignment.status === 'yet_to_start').length;

  return {
    isHydrated,
    store,
    metrics: {
      totalSchools,
      totalEmployees,
      activeCourses,
      totalAssignments,
      completedCount,
      inProgressCount,
      yetToStartCount,
      complianceRate: totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0,
    },
    createSchool: adminStore.createSchool,
    updateSchool: adminStore.updateSchool,
    deleteSchool: adminStore.deleteSchool,
    createUser: adminStore.createUser,
    updateUser: adminStore.updateUser,
    deleteUser: adminStore.deleteUser,
    createCourse: adminStore.createCourse,
    updateCourse: adminStore.updateCourse,
    saveCourseWithCurriculum: adminStore.saveCourseWithCurriculum,
    deleteCourse: adminStore.deleteCourse,
    toggleCoursePublish: adminStore.toggleCoursePublish,
    createAssignment: adminStore.createAssignment,
    updateAssignmentStatus: adminStore.updateAssignmentStatus,
    deleteAssignment: adminStore.deleteAssignment,
    updateLearnerCourseProgress: adminStore.updateLearnerCourseProgress,
    submitQuizAttempt: adminStore.submitQuizAttempt,
    enrollLearnerInCourse: adminStore.enrollLearnerInCourse,
    updateMyProfile: adminStore.updateMyProfile,
  };
}
