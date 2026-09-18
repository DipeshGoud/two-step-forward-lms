// ============================================================================
// TwoStep Forward LMS — Database Entity Types
// ============================================================================

export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'instructor';

export interface DbOrganization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSchool {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSchoolMembership {
  id: string;
  organization_id: string;
  school_id: string;
  user_id: string;
  role_in_school: string;
  created_at: string;
}

export interface DbCourse {
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
}

export interface DbCourseModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DbLesson {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'pdf' | 'image' | 'text' | 'quiz' | 'reading';
  content_body: string | null;
  media_storage_path: string | null;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCourseAssignment {
  id: string;
  organization_id: string;
  course_id: string;
  user_id: string;
  school_id: string | null;
  assigned_by: string | null;
  status: 'yet_to_start' | 'in_progress' | 'completed';
  progress_percent: number;
  assigned_at: string;
  due_date: string | null;
  completed_at: string | null;
}

export interface DbLessonProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed_at: string;
}

export interface DbQuiz {
  id: string;
  lesson_id: string;
  passing_score_percent: number;
  max_attempts: number;
  created_at: string;
}

export interface DbQuizQuestion {
  id: string;
  quiz_id: string;
  prompt: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false';
  options: string[];
  correct_answers: number[];
  order_index: number;
}

export interface DbQuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score_percent: number;
  is_passed: boolean;
  answers_submitted: Record<string, number>;
  attempt_number: number;
  completed_at: string;
}

export interface DbCertificate {
  id: string;
  organization_id: string;
  course_id: string;
  user_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_storage_path: string | null;
}

export interface DbCourseReview {
  id: string;
  organization_id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}
