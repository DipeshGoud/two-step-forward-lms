import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserProfile, UserRole } from '@/types/auth';

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'org_admin', 'manager'];
export const CONTENT_AUTHOR_ROLES: UserRole[] = ['super_admin', 'org_admin', 'manager'];

export interface AuthContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    created_at: string;
  };
  profile: UserProfile;
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

export function canAuthorContent(role: string): boolean {
  return CONTENT_AUTHOR_ROLES.includes(role as UserRole);
}

export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let resolvedProfile = profile;
    if (error || !profile) {
      try {
        const admin = createAdminClient();
        const result = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle();
        resolvedProfile = result.data;

        // If profile is still not in DB, auto-provision it
        if (!resolvedProfile) {
          const defaultOrgId = 'a0000000-0000-0000-0000-000000000001';
          
          // Ensure organization exists
          await admin.from('organizations').upsert({
            id: defaultOrgId,
            name: 'TwoStep Forward Educational Services',
            slug: 'twostep-forward',
            brand_config: { brand: 'TwoStep Forward' }
          }, { onConflict: 'slug' });

          const userEmail = user.email || '';
          const fullName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || (userEmail ? userEmail.split('@')[0] : 'Admin User');

          const { data: newProfile } = await admin.from('profiles').upsert({
            id: user.id,
            organization_id: defaultOrgId,
            email: userEmail,
            full_name: fullName,
            role: 'super_admin',
            is_active: true,
          }, { onConflict: 'id' }).select('*').maybeSingle();

          resolvedProfile = newProfile || {
            id: user.id,
            organization_id: defaultOrgId,
            email: userEmail,
            full_name: fullName,
            avatar_url: null,
            role: 'super_admin',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('Auto-provision fallback in getAuthContext:', err);
        const userEmail = user.email || '';
        resolvedProfile = {
          id: user.id,
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          email: userEmail,
          full_name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || (userEmail ? userEmail.split('@')[0] : 'Admin User'),
          avatar_url: null,
          role: 'super_admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    }

    if (!resolvedProfile || !resolvedProfile.is_active) return null;

    return {
      supabase,
      user,
      profile: resolvedProfile as UserProfile,
    };
  } catch {
    return null;
  }
}

