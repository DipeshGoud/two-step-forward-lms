export type UserRole =
  | 'super_admin'
  | 'org_admin'
  | 'manager'
  | 'instructor'
  | 'learner';

export interface UserProfile {
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

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolMembership {
  id: string;
  organization_id: string;
  school_id: string;
  user_id: string;
  role_in_school: string;
  created_at: string;
  school?: School;
  profile?: UserProfile;
}
