export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          brand_config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          brand_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          brand_config?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      schools: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          code?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
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
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          estimated_duration_minutes?: number;
          rating?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          estimated_duration_minutes?: number;
          rating?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      course_assignments: {
        Row: {
          id: string;
          organization_id: string;
          course_id: string;
          user_id: string;
          school_id: string | null;
          assigned_by: string | null;
          status: string;
          progress_percent: number;
          assigned_at: string;
          due_date: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          course_id: string;
          user_id: string;
          school_id?: string | null;
          assigned_by?: string | null;
          status?: string;
          progress_percent?: number;
          assigned_at?: string;
          due_date?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          course_id?: string;
          user_id?: string;
          school_id?: string | null;
          assigned_by?: string | null;
          status?: string;
          progress_percent?: number;
          assigned_at?: string;
          due_date?: string | null;
          completed_at?: string | null;
        };
      };
    };
  };
}
