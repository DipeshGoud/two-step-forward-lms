import { UserProfile, School } from './auth';

export type AssignmentStatus = 'yet_to_start' | 'in_progress' | 'completed';
export type LessonContentType = 'video' | 'pdf' | 'image' | 'text' | 'quiz';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';
export type NotificationType = 'course_assigned' | 'lesson_published' | 'quiz_result' | 'system';

export interface Course {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  estimated_duration_minutes: number;
  rating: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: LessonContentType;
  content_body: string | null;
  media_storage_path: string | null;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  quiz?: Quiz;
}

export interface CourseAssignment {
  id: string;
  organization_id: string;
  course_id: string;
  user_id: string;
  school_id: string | null;
  assigned_by: string | null;
  status: AssignmentStatus;
  progress_percent: number;
  assigned_at: string;
  due_date: string | null;
  completed_at: string | null;
  course?: Course;
  school?: School | null;
  user?: UserProfile;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed_at: string;
}

export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  prompt: string;
  question_type: QuestionType;
  options: QuizQuestionOption[];
  correct_answers: string[];
  order_index: number;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  passing_score_percent: number;
  max_attempts: number;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score_percent: number;
  is_passed: boolean;
  answers_submitted: Record<string, string[]>;
  attempt_number: number;
  completed_at: string;
}

export interface Certificate {
  id: string;
  organization_id: string;
  course_id: string;
  user_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_storage_path: string | null;
  course?: Course;
  user?: UserProfile;
}

export interface Manual {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  category: string | null;
  content: string | null;
  file_storage_path: string | null;
  is_shared: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_bookmarked?: boolean;
}

export interface Space {
  id: string;
  organization_id: string;
  school_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  school?: School | null;
}

export interface LMSNotification {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}
