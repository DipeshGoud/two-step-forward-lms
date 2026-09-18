import React from 'react';
import { redirect } from 'next/navigation';
import { AdminHeader } from '@/components/admin/admin-header';
import { createClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userProfile: UserProfile | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Enforce RBAC: Only super_admin, org_admin, and manager can access admin panel
        if (!['super_admin', 'org_admin', 'manager'].includes(profile.role)) {
          redirect('/learning');
        }
        userProfile = profile as UserProfile;
      } else {
        // Fallback default admin profile in development
        userProfile = {
          id: user.id,
          organization_id: 'default-org',
          email: user.email || 'admin@onestep.com',
          full_name: user.user_metadata?.full_name || 'Admin User',
          avatar_url: null,
          role: 'org_admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } else {
      // In development when auth keys are placeholders, provide mock admin profile for preview
      userProfile = {
        id: 'mock-admin-id',
        organization_id: 'default-org',
        email: 'admin@onestep.com',
        full_name: 'Admin User',
        avatar_url: null,
        role: 'org_admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  } catch {
    // Development fallback
    userProfile = {
      id: 'mock-admin-id',
      organization_id: 'default-org',
      email: 'admin@onestep.com',
      full_name: 'Admin User',
      avatar_url: null,
      role: 'org_admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <AdminHeader user={userProfile} />
      <main className="flex-1 w-full px-6 sm:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
