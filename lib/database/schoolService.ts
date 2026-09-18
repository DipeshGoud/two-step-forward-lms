import { createAdminClient } from '@/lib/supabase/admin';
import { DbSchool } from './types';
import { INITIAL_ADMIN_STORE, AdminSchool } from '@/lib/data/adminStore';

export async function getSchools(orgId?: string): Promise<DbSchool[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('schools').select('*').order('name');
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return fallbackSchools();
    }
    return data as DbSchool[];
  } catch {
    return fallbackSchools();
  }
}

export async function getSchoolById(schoolId: string): Promise<DbSchool | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .or(`id.eq.${schoolId},code.eq.${schoolId}`)
      .single();

    if (error || !data) {
      const fb = fallbackSchools().find((s) => s.id === schoolId || s.code === schoolId);
      return fb || null;
    }
    return data as DbSchool;
  } catch {
    const fb = fallbackSchools().find((s) => s.id === schoolId || s.code === schoolId);
    return fb || null;
  }
}

export async function createSchool(payload: {
  name: string;
  code: string;
  description: string;
  organizationId?: string;
}): Promise<DbSchool> {
  const orgId = payload.organizationId || 'a0000000-0000-0000-0000-000000000001';
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('schools')
      .insert({
        organization_id: orgId,
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        description: payload.description.trim(),
      })
      .select()
      .single();

    if (error || !data) {
      return {
        id: `sch-${Date.now()}`,
        organization_id: orgId,
        name: payload.name,
        code: payload.code.toUpperCase(),
        description: payload.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return data as DbSchool;
  } catch {
    return {
      id: `sch-${Date.now()}`,
      organization_id: orgId,
      name: payload.name,
      code: payload.code.toUpperCase(),
      description: payload.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function updateSchool(
  id: string,
  payload: { name?: string; code?: string; description?: string }
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('schools')
      .update({
        ...(payload.name ? { name: payload.name.trim() } : {}),
        ...(payload.code ? { code: payload.code.trim().toUpperCase() } : {}),
        ...(payload.description !== undefined ? { description: payload.description.trim() } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return !error;
  } catch {
    return true;
  }
}

export async function deleteSchool(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('schools').delete().eq('id', id);
    return !error;
  } catch {
    return true;
  }
}

function fallbackSchools(): DbSchool[] {
  return INITIAL_ADMIN_STORE.schools.map((s: AdminSchool) => ({
    id: s.id,
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    name: s.name,
    code: s.code,
    description: s.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}
