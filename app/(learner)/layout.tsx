import React from 'react';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { LMSNotification } from '@/types/lms';
import { UserProfile } from '@/types/auth';
import { getAuthContext } from '@/lib/auth/server';

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect('/login?error=profile_missing');

  const { data: userNotifications } = await context.supabase
    .from('notifications')
    .select('*')
    .eq('user_id', context.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const userProfile = context.profile as UserProfile;
  const notifications = (userNotifications || []) as LMSNotification[];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header user={userProfile} notifications={notifications} />
      <main className="flex-1 w-full px-6 sm:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
