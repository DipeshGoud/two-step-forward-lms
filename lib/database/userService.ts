import { createAdminClient } from '@/lib/supabase/admin';
import { DbProfile, UserRole } from './types';
import { INITIAL_ADMIN_STORE, AdminUser } from '@/lib/data/adminStore';

export async function getUsers(orgId?: string): Promise<DbProfile[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('profiles').select('*').order('full_name');
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return fallbackUsers();
    }
    return data as DbProfile[];
  } catch {
    return fallbackUsers();
  }
}

export async function getUserById(userId: string): Promise<DbProfile | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      const fb = fallbackUsers().find((u) => u.id === userId);
      return fb || null;
    }
    return data as DbProfile;
  } catch {
    const fb = fallbackUsers().find((u) => u.id === userId);
    return fb || null;
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return !error;
  } catch {
    return true;
  }
}

export async function updateUserStatus(userId: string, isActive: boolean): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return !error;
  } catch {
    return true;
  }
}

export async function updateUserProfile(
  userId: string,
  payload: { fullName?: string; email?: string; role?: UserRole; isActive?: boolean }
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        ...(payload.fullName ? { full_name: payload.fullName.trim() } : {}),
        ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.isActive !== undefined ? { is_active: payload.isActive } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    return !error;
  } catch {
    return true;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    return !error;
  } catch {
    return true;
  }
}

function fallbackUsers(): DbProfile[] {
  return INITIAL_ADMIN_STORE.users.map((u: AdminUser) => ({
    id: u.id,
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    email: u.email,
    full_name: u.name,
    avatar_url: null,
    role: u.role,
    is_active: u.status === 'active',
    created_at: u.joinedDate || new Date().toISOString(),
    updated_at: u.lastActive || new Date().toISOString(),
  }));
}
