'use client';

import { useSyncExternalStore, useMemo } from 'react';

export interface AdminSchool {
  id: string;
  name: string;
  code: string;
  location: string;
  description: string;
  activeEmployees: number;
  activeCourses: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'org_admin' | 'manager' | 'instructor';
  schools: string[];
  status: 'active' | 'inactive';
  joinedDate?: string;
  lastActive?: string;
}

export type CourseLessonType = 'video' | 'pdf' | 'image' | 'text' | 'quiz' | 'reading';

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: CourseLessonType;
  summary?: string;
  content?: string;
  textContent?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  keyTakeaways?: string[];
  quizQuestions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface AdminCourse {
  id: string;
  title: string;
  description?: string;
  totalLessons: number;
  durationMinutes: number;
  rating: number;
  isPublished: boolean;
  enrolledCount: number;
  thumbnailUrl: string | null;
  modules?: CourseModule[];
}

export interface AdminAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  courseId: string;
  courseTitle: string;
  schoolId: string;
  schoolName: string;
  status: 'yet_to_start' | 'in_progress' | 'completed';
  progress: number;
  assignedAt: string;
  dueDate: string;
}

export interface AdminStoreData {
  schools: AdminSchool[];
  users: AdminUser[];
  courses: AdminCourse[];
  assignments: AdminAssignment[];
  currentUserId?: string;
}

export function isUserAdmin(role?: string): boolean {
  return role === 'super_admin' || role === 'org_admin' || role === 'manager';
}

const SEED_SCHOOLS: AdminSchool[] = [
  {
    id: 'sch-1',
    name: 'Downtown Academy',
    code: 'DTA-01',
    description: 'Primary urban education center and main operational campus.',
    location: 'Metro Central',
    activeEmployees: 8,
    activeCourses: 5,
  },
  {
    id: 'sch-2',
    name: 'North Campus',
    code: 'NC-02',
    description: 'Regional science and technical secondary center.',
    location: 'North District',
    activeEmployees: 6,
    activeCourses: 4,
  },
  {
    id: 'sch-3',
    name: 'West Valley High',
    code: 'WVH-03',
    description: 'Vocational training and community outreach facility.',
    location: 'West Valley',
    activeEmployees: 5,
    activeCourses: 4,
  },
  {
    id: 'sch-4',
    name: 'East River Campus',
    code: 'ERC-04',
    description: 'Digital skills institute and laboratory complex.',
    location: 'East River',
    activeEmployees: 5,
    activeCourses: 3,
  },
];

const SEED_USERS: AdminUser[] = [
  {
    id: 'usr-5',
    name: 'Admin Supervisor',
    email: 'admin@twostepforward.edu',
    role: 'org_admin',
    schools: ['All Schools'],
    status: 'active',
    joinedDate: 'Nov 12, 2025',
    lastActive: 'Active now',
  },
  {
    id: 'usr-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@twostepforward.edu',
    role: 'instructor',
    schools: ['Downtown Academy', 'North Campus'],
    status: 'active',
    joinedDate: 'Jan 15, 2026',
    lastActive: '2 hours ago',
  },
  {
    id: 'usr-2',
    name: 'Michael Chen',
    email: 'm.chen@twostepforward.edu',
    role: 'instructor',
    schools: ['North Campus'],
    status: 'active',
    joinedDate: 'Feb 10, 2026',
    lastActive: 'Yesterday',
  },
  {
    id: 'usr-3',
    name: 'Aisha Patel',
    email: 'aisha.p@twostepforward.edu',
    role: 'instructor',
    schools: ['West Valley High'],
    status: 'active',
    joinedDate: 'Mar 20, 2026',
    lastActive: '3 days ago',
  },
  {
    id: 'usr-4',
    name: 'David Miller',
    email: 'd.miller@twostepforward.edu',
    role: 'manager',
    schools: ['East River Campus', 'Downtown Academy'],
    status: 'active',
    joinedDate: 'Dec 01, 2025',
    lastActive: '1 hour ago',
  },
];

const SEED_COURSES: AdminCourse[] = [
  {
    id: 'course-1',
    title: 'Child Safety & Protection Standards Training',
    totalLessons: 4,
    durationMinutes: 180,
    rating: 5.0,
    isPublished: true,
    enrolledCount: 12,
    thumbnailUrl: '/courses/child-safety.jpg',
  },
  {
    id: 'course-2',
    title: 'CSR Induction: Principles & Social Impact (Day 3)',
    totalLessons: 8,
    durationMinutes: 240,
    rating: 4.9,
    isPublished: true,
    enrolledCount: 15,
    thumbnailUrl: '/courses/csr-principles.jpg',
  },
  {
    id: 'course-3',
    title: 'CSR Induction: Stakeholder Engagement (Day 2)',
    totalLessons: 7,
    durationMinutes: 210,
    rating: 5.0,
    isPublished: true,
    enrolledCount: 14,
    thumbnailUrl: null,
  },
  {
    id: 'course-4',
    title: 'CSR Online Orientation (Day 1)',
    totalLessons: 2,
    durationMinutes: 90,
    rating: 4.9,
    isPublished: true,
    enrolledCount: 20,
    thumbnailUrl: null,
  },
  {
    id: 'course-5',
    title: 'TwoStep Forward Digital Productivity & Tooling Kit',
    totalLessons: 1,
    durationMinutes: 230,
    rating: 4.8,
    isPublished: false,
    enrolledCount: 0,
    thumbnailUrl: '/courses/digital-productivity.jpg',
  },
  {
    id: 'course-6',
    title: 'Applied Coding & Computational Problem Solving',
    totalLessons: 8,
    durationMinutes: 240,
    rating: 5.0,
    isPublished: true,
    enrolledCount: 11,
    thumbnailUrl: '/courses/applied-coding.jpg',
  },
];

const SEED_ASSIGNMENTS: AdminAssignment[] = [
  {
    id: 'asg-1',
    employeeId: 'usr-1',
    employeeName: 'Sarah Jenkins',
    email: 'sarah.j@onestep.edu',
    courseId: 'course-1',
    courseTitle: 'Child Safety & Protection Standards Training',
    schoolId: 'sch-1',
    schoolName: 'Downtown Academy',
    status: 'yet_to_start',
    progress: 0,
    assignedAt: '2026-09-10',
    dueDate: '2026-10-15',
  },
  {
    id: 'asg-2',
    employeeId: 'usr-2',
    employeeName: 'Michael Chen',
    email: 'm.chen@onestep.edu',
    courseId: 'course-2',
    courseTitle: 'CSR Induction: Principles & Social Impact (Day 3)',
    schoolId: 'sch-2',
    schoolName: 'North Campus',
    status: 'in_progress',
    progress: 50,
    assignedAt: '2026-09-08',
    dueDate: '2026-09-30',
  },
  {
    id: 'asg-3',
    employeeId: 'usr-3',
    employeeName: 'Aisha Patel',
    email: 'aisha.p@onestep.edu',
    courseId: 'course-3',
    courseTitle: 'CSR Induction: Stakeholder Engagement (Day 2)',
    schoolId: 'sch-3',
    schoolName: 'West Valley High',
    status: 'in_progress',
    progress: 28,
    assignedAt: '2026-09-05',
    dueDate: '2026-09-25',
  },
  {
    id: 'asg-4',
    employeeId: 'usr-4',
    employeeName: 'David Miller',
    email: 'd.miller@onestep.edu',
    courseId: 'course-4',
    courseTitle: 'CSR Online Orientation (Day 1)',
    schoolId: 'sch-4',
    schoolName: 'East River Campus',
    status: 'completed',
    progress: 100,
    assignedAt: '2026-08-20',
    dueDate: '2026-09-10',
  },
  {
    id: 'asg-5',
    employeeId: 'usr-1',
    employeeName: 'Sarah Jenkins',
    email: 'sarah.j@onestep.edu',
    courseId: 'course-6',
    courseTitle: 'Applied Coding & Computational Problem Solving',
    schoolId: 'sch-2',
    schoolName: 'North Campus',
    status: 'in_progress',
    progress: 15,
    assignedAt: '2026-09-01',
    dueDate: '2026-10-01',
  },
];

const STORAGE_KEY = 'twostep_admin_store_v2';

export const INITIAL_ADMIN_STORE: AdminStoreData = {
  schools: SEED_SCHOOLS,
  users: SEED_USERS,
  courses: SEED_COURSES,
  assignments: SEED_ASSIGNMENTS,
  currentUserId: 'usr-5',
};

let memoryStore: AdminStoreData = INITIAL_ADMIN_STORE;

let isInitialized = false;

function ensureInitialized() {
  if (isInitialized || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryStore = JSON.parse(raw);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    }
  } catch {
    // fallback to initial seed
  }
  isInitialized = true;
}

// Listeners for reactive updates across components
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function persistStore(data: AdminStoreData) {
  memoryStore = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage quota errors
    }
  }
  emitChange();
}

export const adminStore = {
  getSnapshot(): AdminStoreData {
    ensureInitialized();
    return memoryStore;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          memoryStore = JSON.parse(e.newValue);
          emitChange();
        } catch {
          // ignore
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }
    return () => {
      listeners.delete(listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  },

  createSchool(payload: {
    name: string;
    code: string;
    location: string;
    description: string;
  }): AdminSchool {
    ensureInitialized();
    const current = memoryStore;

    const newSchool: AdminSchool = {
      id: `sch-${Date.now()}`,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      location: payload.location.trim(),
      description: payload.description.trim(),
      activeEmployees: 0,
      activeCourses: 0,
    };

    const updatedSchools = [...current.schools, newSchool];
    persistStore({
      ...current,
      schools: updatedSchools,
    });

    return newSchool;
  },

  createUser(payload: {
    name: string;
    email: string;
    role: 'org_admin' | 'manager' | 'instructor';
    schools: string[];
  }): AdminUser {
    ensureInitialized();
    const current = memoryStore;

    const newUser: AdminUser = {
      id: `usr-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      schools: payload.schools.length > 0 ? payload.schools : ['Downtown Academy'],
      status: 'active',
    };

    const updatedUsers = [...current.users, newUser];
    persistStore({
      ...current,
      users: updatedUsers,
    });

    return newUser;
  },

  createCourse(payload: {
    title: string;
    totalLessons: number;
    durationMinutes: number;
    isPublished: boolean;
  }): AdminCourse {
    ensureInitialized();
    const current = memoryStore;

    const newCourse: AdminCourse = {
      id: `course-${Date.now()}`,
      title: payload.title.trim(),
      totalLessons: payload.totalLessons || 1,
      durationMinutes: payload.durationMinutes || 60,
      rating: 5.0,
      isPublished: payload.isPublished,
      enrolledCount: 0,
      thumbnailUrl: null,
    };

    const updatedCourses = [newCourse, ...current.courses];
    persistStore({
      ...current,
      courses: updatedCourses,
    });

    return newCourse;
  },

  saveCourseWithCurriculum(payload: {
    id?: string;
    title: string;
    description?: string;
    isPublished: boolean;
    modules: CourseModule[];
  }): AdminCourse {
    ensureInitialized();
    const current = memoryStore;

    // Calculate total lessons and duration from modules
    const totalLessons = payload.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const durationMinutes = payload.modules.reduce(
      (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + (l.durationMinutes || 0), 0),
      0
    );

    if (payload.id) {
      // Update existing course
      const targetCourse = current.courses.find((c) => c.id === payload.id);
      if (!targetCourse) {
        throw new Error(`Course with ID ${payload.id} not found.`);
      }

      const updatedCourse: AdminCourse = {
        ...targetCourse,
        title: payload.title.trim(),
        description: payload.description?.trim() || '',
        totalLessons: Math.max(0, totalLessons),
        durationMinutes: Math.max(0, durationMinutes),
        isPublished: payload.isPublished,
        modules: payload.modules,
      };

      const updatedCourses = current.courses.map((c) =>
        c.id === payload.id ? updatedCourse : c
      );

      const updatedAssignments = current.assignments.map((a) =>
        a.courseId === payload.id
          ? { ...a, courseTitle: updatedCourse.title }
          : a
      );

      persistStore({
        ...current,
        courses: updatedCourses,
        assignments: updatedAssignments,
      });

      return updatedCourse;
    } else {
      // Create new course
      const newCourse: AdminCourse = {
        id: `course-${Date.now()}`,
        title: payload.title.trim(),
        description: payload.description?.trim() || '',
        totalLessons: Math.max(0, totalLessons),
        durationMinutes: Math.max(0, durationMinutes),
        rating: 5.0,
        isPublished: payload.isPublished,
        enrolledCount: 0,
        thumbnailUrl: null,
        modules: payload.modules,
      };

      const updatedCourses = [newCourse, ...current.courses];
      persistStore({
        ...current,
        courses: updatedCourses,
      });

      return newCourse;
    }
  },

  toggleCoursePublish(courseId: string): AdminCourse {
    ensureInitialized();
    const current = memoryStore;
    const targetCourse = current.courses.find((c) => c.id === courseId);
    if (!targetCourse) {
      throw new Error(`Course ${courseId} not found.`);
    }

    const updatedCourses = current.courses.map((c) =>
      c.id === courseId ? { ...c, isPublished: !c.isPublished } : c
    );

    persistStore({
      ...current,
      courses: updatedCourses,
    });

    return { ...targetCourse, isPublished: !targetCourse.isPublished };
  },

  createAssignment(payload: {
    employeeId: string;
    courseId: string;
    schoolId: string;
    dueDate: string;
  }): AdminAssignment {
    ensureInitialized();
    const current = memoryStore;
    const employee = current.users.find((u) => u.id === payload.employeeId);
    const course = current.courses.find((c) => c.id === payload.courseId);
    const school = current.schools.find((s) => s.id === payload.schoolId);

    if (!employee || !course || !school) {
      throw new Error('Invalid assignment parameters: Employee, Course, and School must exist.');
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const newAssignment: AdminAssignment = {
      id: `asg-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      email: employee.email,
      courseId: course.id,
      courseTitle: course.title,
      schoolId: school.id,
      schoolName: school.name,
      status: 'yet_to_start',
      progress: 0,
      assignedAt: todayStr,
      dueDate: payload.dueDate,
    };

    // Update course enrolled count
    const updatedCourses = current.courses.map((c) =>
      c.id === course.id ? { ...c, enrolledCount: c.enrolledCount + 1 } : c
    );

    // Update assignment list (prepend to appear at the top of recent)
    const updatedAssignments = [newAssignment, ...current.assignments];

    persistStore({
      ...current,
      courses: updatedCourses,
      assignments: updatedAssignments,
    });

    return newAssignment;
  },

  updateAssignmentStatus(
    assignmentId: string,
    status: 'yet_to_start' | 'in_progress' | 'completed',
    progress?: number
  ): AdminAssignment {
    ensureInitialized();
    const current = memoryStore;
    const targetAssignment = current.assignments.find((a) => a.id === assignmentId);
    if (!targetAssignment) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }

    let resolvedProgress = progress !== undefined ? progress : targetAssignment.progress;
    if (status === 'completed') resolvedProgress = 100;
    else if (status === 'yet_to_start') resolvedProgress = 0;
    else if (status === 'in_progress' && resolvedProgress === 0) resolvedProgress = 25;

    const updatedAssignments = current.assignments.map((a) =>
      a.id === assignmentId
        ? {
            ...a,
            status,
            progress: resolvedProgress,
          }
        : a
    );

    persistStore({
      ...current,
      assignments: updatedAssignments,
    });

    return { ...targetAssignment, status, progress: resolvedProgress };
  },

  updateUser(
    userId: string,
    payload: Partial<Omit<AdminUser, 'id'>>
  ): AdminUser {
    ensureInitialized();
    const current = memoryStore;
    const targetUser = current.users.find((u) => u.id === userId);
    if (!targetUser) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const updatedUser: AdminUser = {
      ...targetUser,
      ...payload,
      name: payload.name !== undefined ? payload.name.trim() : targetUser.name,
      email: payload.email !== undefined ? payload.email.trim().toLowerCase() : targetUser.email,
    };

    const updatedUsers = current.users.map((u) => (u.id === userId ? updatedUser : u));

    // Sync any modified name or email with existing assignments
    const updatedAssignments = current.assignments.map((a) =>
      a.employeeId === userId
        ? {
            ...a,
            employeeName: updatedUser.name,
            email: updatedUser.email,
          }
        : a
    );

    persistStore({
      ...current,
      users: updatedUsers,
      assignments: updatedAssignments,
    });

    return updatedUser;
  },

  deleteUser(userId: string): void {
    ensureInitialized();
    const current = memoryStore;
    const targetUser = current.users.find((u) => u.id === userId);
    if (!targetUser) return;

    const userAssignments = current.assignments.filter((a) => a.employeeId === userId);
    const affectedCourseIds = new Set(userAssignments.map((a) => a.courseId));

    const updatedUsers = current.users.filter((u) => u.id !== userId);
    const updatedAssignments = current.assignments.filter((a) => a.employeeId !== userId);

    const updatedCourses = current.courses.map((c) => {
      if (affectedCourseIds.has(c.id)) {
        const remainingForCourse = updatedAssignments.filter((a) => a.courseId === c.id).length;
        return { ...c, enrolledCount: remainingForCourse };
      }
      return c;
    });

    persistStore({
      ...current,
      users: updatedUsers,
      assignments: updatedAssignments,
      courses: updatedCourses,
    });
  },

  updateSchool(
    schoolId: string,
    payload: Partial<Omit<AdminSchool, 'id'>>
  ): AdminSchool {
    ensureInitialized();
    const current = memoryStore;
    const targetSchool = current.schools.find((s) => s.id === schoolId);
    if (!targetSchool) {
      throw new Error(`School with ID ${schoolId} not found.`);
    }

    const prevName = targetSchool.name;
    const updatedSchool: AdminSchool = {
      ...targetSchool,
      ...payload,
      name: payload.name !== undefined ? payload.name.trim() : targetSchool.name,
      code: payload.code !== undefined ? payload.code.trim().toUpperCase() : targetSchool.code,
      location: payload.location !== undefined ? payload.location.trim() : targetSchool.location,
      description: payload.description !== undefined ? payload.description.trim() : targetSchool.description,
    };

    const updatedSchools = current.schools.map((s) => (s.id === schoolId ? updatedSchool : s));

    // If school name changed, cascade update assignments and user school lists
    let updatedAssignments = current.assignments;
    let updatedUsers = current.users;

    if (prevName !== updatedSchool.name) {
      updatedAssignments = current.assignments.map((a) =>
        a.schoolId === schoolId || a.schoolName === prevName
          ? { ...a, schoolName: updatedSchool.name }
          : a
      );

      updatedUsers = current.users.map((u) => ({
        ...u,
        schools: u.schools.map((s) => (s === prevName ? updatedSchool.name : s)),
      }));
    }

    persistStore({
      ...current,
      schools: updatedSchools,
      assignments: updatedAssignments,
      users: updatedUsers,
    });

    return updatedSchool;
  },

  deleteSchool(schoolId: string): void {
    ensureInitialized();
    const current = memoryStore;
    const targetSchool = current.schools.find((s) => s.id === schoolId);
    if (!targetSchool) return;

    const schoolAssignments = current.assignments.filter((a) => a.schoolId === schoolId);
    const affectedCourseIds = new Set(schoolAssignments.map((a) => a.courseId));

    const updatedSchools = current.schools.filter((s) => s.id !== schoolId);
    const updatedAssignments = current.assignments.filter((a) => a.schoolId !== schoolId);

    const updatedCourses = current.courses.map((c) => {
      if (affectedCourseIds.has(c.id)) {
        const remaining = updatedAssignments.filter((a) => a.courseId === c.id).length;
        return { ...c, enrolledCount: remaining };
      }
      return c;
    });

    // Remove school name from users' school lists
    const updatedUsers = current.users.map((u) => ({
      ...u,
      schools: u.schools.filter((s) => s !== targetSchool.name),
    }));

    persistStore({
      ...current,
      schools: updatedSchools,
      assignments: updatedAssignments,
      courses: updatedCourses,
      users: updatedUsers,
    });
  },

  updateCourse(
    courseId: string,
    payload: Partial<Omit<AdminCourse, 'id'>>
  ): AdminCourse {
    ensureInitialized();
    const current = memoryStore;
    const targetCourse = current.courses.find((c) => c.id === courseId);
    if (!targetCourse) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    const updatedCourse: AdminCourse = {
      ...targetCourse,
      ...payload,
      title: payload.title !== undefined ? payload.title.trim() : targetCourse.title,
    };

    const updatedCourses = current.courses.map((c) => (c.id === courseId ? updatedCourse : c));

    const updatedAssignments = current.assignments.map((a) =>
      a.courseId === courseId
        ? { ...a, courseTitle: updatedCourse.title }
        : a
    );

    persistStore({
      ...current,
      courses: updatedCourses,
      assignments: updatedAssignments,
    });

    return updatedCourse;
  },

  deleteCourse(courseId: string): void {
    ensureInitialized();
    const current = memoryStore;
    const targetCourse = current.courses.find((c) => c.id === courseId);
    if (!targetCourse) return;

    const updatedCourses = current.courses.filter((c) => c.id !== courseId);
    const updatedAssignments = current.assignments.filter((a) => a.courseId !== courseId);

    persistStore({
      ...current,
      courses: updatedCourses,
      assignments: updatedAssignments,
    });
  },

  deleteAssignment(assignmentId: string): void {
    ensureInitialized();
    const current = memoryStore;
    const target = current.assignments.find((a) => a.id === assignmentId);
    if (!target) return;

    const updatedAssignments = current.assignments.filter((a) => a.id !== assignmentId);
    const updatedCourses = current.courses.map((c) =>
      c.id === target.courseId ? { ...c, enrolledCount: Math.max(0, c.enrolledCount - 1) } : c
    );

    persistStore({
      ...current,
      assignments: updatedAssignments,
      courses: updatedCourses,
    });
  },

  updateLearnerCourseProgress(
    employeeId: string,
    courseId: string,
    progressPercent: number
  ): AdminAssignment {
    ensureInitialized();
    const current = memoryStore;

    const clampedProgress = Math.max(0, Math.min(100, Math.round(progressPercent)));
    let resolvedStatus: 'yet_to_start' | 'in_progress' | 'completed' = 'in_progress';
    if (clampedProgress === 0) resolvedStatus = 'yet_to_start';
    else if (clampedProgress === 100) resolvedStatus = 'completed';

    const existingIndex = current.assignments.findIndex(
      (a) => a.employeeId === employeeId && a.courseId === courseId
    );

    let updatedAssignments: AdminAssignment[];

    if (existingIndex >= 0) {
      updatedAssignments = current.assignments.map((a, idx) =>
        idx === existingIndex
          ? {
              ...a,
              progress: clampedProgress,
              status: resolvedStatus,
            }
          : a
      );
    } else {
      const targetUser = current.users.find((u) => u.id === employeeId);
      const targetCourse = current.courses.find((c) => c.id === courseId);
      const newAssignment: AdminAssignment = {
        id: `asg-${Date.now()}`,
        employeeId,
        employeeName: targetUser?.name || 'Learner',
        email: targetUser?.email || 'learner@twostepforward.edu',
        courseId,
        courseTitle: targetCourse?.title || 'Learning Course',
        schoolId: 'sch-1',
        schoolName: targetUser?.schools[0] || 'Downtown Academy',
        status: resolvedStatus,
        progress: clampedProgress,
        assignedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        dueDate: 'Flexible completion',
      };
      updatedAssignments = [newAssignment, ...current.assignments];
    }

    persistStore({
      ...current,
      assignments: updatedAssignments,
    });

    return updatedAssignments.find((a) => a.employeeId === employeeId && a.courseId === courseId)!;
  },

  enrollLearnerInCourse(
    employeeId: string,
    courseId: string,
    schoolId?: string
  ): AdminAssignment {
    ensureInitialized();
    const current = memoryStore;

    const existing = current.assignments.find(
      (a) => a.employeeId === employeeId && a.courseId === courseId
    );
    if (existing) return existing;

    const targetUser = current.users.find((u) => u.id === employeeId);
    const targetCourse = current.courses.find((c) => c.id === courseId);
    const targetSchool = current.schools.find((s) => s.id === schoolId) || current.schools[0];

    const newAssignment: AdminAssignment = {
      id: `asg-${Date.now()}`,
      employeeId,
      employeeName: targetUser?.name || 'Learner',
      email: targetUser?.email || 'learner@twostepforward.edu',
      courseId,
      courseTitle: targetCourse?.title || 'Course Curriculum',
      schoolId: targetSchool?.id || 'sch-1',
      schoolName: targetSchool?.name || 'Downtown Academy',
      status: 'yet_to_start',
      progress: 0,
      assignedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      dueDate: 'Flexible completion',
    };

    const updatedCourses = current.courses.map((c) =>
      c.id === courseId ? { ...c, enrolledCount: c.enrolledCount + 1 } : c
    );

    persistStore({
      ...current,
      courses: updatedCourses,
      assignments: [newAssignment, ...current.assignments],
    });

    return newAssignment;
  },

  setCurrentUserId(userId: string) {
    ensureInitialized();
    persistStore({
      ...memoryStore,
      currentUserId: userId,
    });
  },

  resetDefaults() {
    persistStore({
      schools: SEED_SCHOOLS,
      users: SEED_USERS,
      courses: SEED_COURSES,
      assignments: SEED_ASSIGNMENTS,
      currentUserId: 'usr-5',
    });
  },
};

export const DEFAULT_LEARNER_ID = 'usr-5';

export function useAdminStore() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const store = useSyncExternalStore(
    adminStore.subscribe,
    adminStore.getSnapshot,
    () => memoryStore
  );

  const metrics = useMemo(() => {
    const totalSchools = store.schools.length;
    const totalEmployees = store.users.length;
    const activeCourses = store.courses.filter((c) => c.isPublished).length;
    const totalAssignments = store.assignments.length;

    const completedCount = store.assignments.filter((a) => a.status === 'completed').length;
    const inProgressCount = store.assignments.filter((a) => a.status === 'in_progress').length;
    const yetToStartCount = store.assignments.filter((a) => a.status === 'yet_to_start').length;

    const complianceRate =
      totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

    return {
      totalSchools,
      totalEmployees,
      activeCourses,
      totalAssignments,
      completedCount,
      inProgressCount,
      yetToStartCount,
      complianceRate,
    };
  }, [store]);

  return {
    isHydrated,
    store,
    metrics,
    setCurrentUserId: adminStore.setCurrentUserId,
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
    enrollLearnerInCourse: adminStore.enrollLearnerInCourse,
    resetDefaults: adminStore.resetDefaults,
  };
}
