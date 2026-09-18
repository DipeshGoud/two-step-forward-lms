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
          const DEFAULT_ORG_SLUG = 'twostep-forward';

          const { data: defaultOrg } = await admin
            .from('organizations')
            .select('id')
            .eq('slug', DEFAULT_ORG_SLUG)
            .maybeSingle();

          if (!defaultOrg?.id) {
            console.warn('Default organization is not configured; cannot auto-provision profile.');
            return null;
          }
          const defaultOrgId = String(defaultOrg.id);

          // Bootstrap: the first user ever becomes org_admin so the platform is
          // usable. Everyone else joins as a learner and must be promoted by an admin.
          const { count: adminCount } = await admin
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', defaultOrgId)
            .in('role', ['super_admin', 'org_admin']);
          const provisionedRole: UserRole = adminCount === 0 ? 'org_admin' : 'learner';

          const userEmail = user.email || '';
          const fullName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || (userEmail ? userEmail.split('@')[0] : 'New User');

          const { data: newProfile } = await admin.from('profiles').upsert({
            id: user.id,
            organization_id: defaultOrgId,
            email: userEmail,
            full_name: fullName,
            role: provisionedRole,
            is_active: true,
          }, { onConflict: 'id' }).select('*').maybeSingle();

          resolvedProfile = newProfile ?? null;
        }
      } catch (err) {
        console.warn('Auto-provision fallback in getAuthContext:', err);
        return null;
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

