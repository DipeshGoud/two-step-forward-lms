import type { UserRole } from './auth';
import type {
  AssignmentStatus,
  LessonContentType,
  QuestionType,
} from './lms';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      organizations: TableShape<{
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        brand_config: Json;
        created_at: string;
        updated_at: string;
      }>;
      profiles: TableShape<{
        id: string;
        organization_id: string;
        email: string;
        full_name: string;
        avatar_url: string | null;
        role: UserRole;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
      schools: TableShape<{
        id: string;
        organization_id: string;
        name: string;
        code: string | null;
        location: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      }>;
      school_memberships: TableShape<{
        id: string;
        organization_id: string;
        school_id: string;
        user_id: string;
        role_in_school: string;
        created_at: string;
      }>;
      courses: TableShape<{
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
      }>;
      course_assignments: TableShape<{
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
      }>;
      course_modules: TableShape<{
        id: string;
        course_id: string;
        title: string;
        order_index: number;
        created_at: string;
        updated_at: string;
      }>;
      lessons: TableShape<{
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
      }>;
      lesson_progress: TableShape<{
        id: string;
        user_id: string;
        course_id: string;
        lesson_id: string;
        is_completed: boolean;
        completed_at: string | null;
        last_accessed_at: string;
      }>;
      quizzes: TableShape<{
        id: string;
        lesson_id: string;
        passing_score_percent: number;
        max_attempts: number;
        created_at: string;
      }>;
      quiz_questions: TableShape<{
        id: string;
        quiz_id: string;
        prompt: string;
        question_type: QuestionType;
        options: Json;
        correct_answers: Json;
        order_index: number;
      }>;
      quiz_attempts: TableShape<{
        id: string;
        quiz_id: string;
        user_id: string;
        score_percent: number;
        is_passed: boolean;
        answers_submitted: Json;
        attempt_number: number;
        completed_at: string;
      }>;
      certificates: TableShape<{
        id: string;
        organization_id: string;
        course_id: string;
        user_id: string;
        certificate_number: string;
        issued_at: string;
        pdf_storage_path: string | null;
      }>;
      manuals: TableShape<{
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
      }>;
      manual_bookmarks: TableShape<{
        id: string;
        user_id: string;
        manual_id: string;
        created_at: string;
      }>;
      spaces: TableShape<{
        id: string;
        organization_id: string;
        school_id: string | null;
        name: string;
        description: string | null;
        created_at: string;
      }>;
      course_reviews: TableShape<{
        id: string;
        organization_id: string;
        course_id: string;
        user_id: string;
        rating: number;
        comment: string | null;
        created_at: string;
        updated_at: string;
      }>;
    };
  };
}
