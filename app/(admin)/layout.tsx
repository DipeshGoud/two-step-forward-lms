import React from 'react';
import { redirect } from 'next/navigation';
import { AdminHeader } from '@/components/admin/admin-header';
import { UserProfile } from '@/types/auth';
import { getAuthContext, isAdminRole } from '@/lib/auth/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect('/login?error=profile_missing');
  if (!isAdminRole(context.profile.role)) redirect('/learning');

  const userProfile = context.profile as UserProfile;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <AdminHeader user={userProfile} />
      <main className="flex-1 w-full px-6 sm:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
