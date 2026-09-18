import type { UserRole } from './auth';

export type CourseLessonType = 'video' | 'pdf' | 'image' | 'text' | 'quiz' | 'reading';

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
  role: UserRole;
  schools: string[];
  status: 'active' | 'inactive';
  joinedDate?: string;
  lastActive?: string;
}

export interface CourseQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: CourseLessonType;
  summary?: string;
  content?: string;
  textContent?: string;
  fileUrl?: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: string;
  keyTakeaways?: string[];
  quizQuestions?: CourseQuizQuestion[];
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
  completedLessons?: Record<string, string[]>;
  currentUserId?: string;
}
