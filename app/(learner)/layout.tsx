import React from 'react';
import { Header } from '@/components/layout/header';
import { createClient } from '@/lib/supabase/server';
import { LMSNotification } from '@/types/lms';
import { UserProfile } from '@/types/auth';

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userProfile: UserProfile | null = null;
  const notifications: LMSNotification[] = [];

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
        userProfile = profile as UserProfile;
      } else {
        userProfile = {
          id: user.id,
          organization_id: '',
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Learner',
          avatar_url: null,
          role: 'instructor',
          is_active: true,
          created_at: user.created_at,
          updated_at: user.created_at,
        };
      }

      // Fetch unread notifications
      const { data: userNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (userNotifications) {
        notifications.push(...(userNotifications as LMSNotification[]));
      }
    }
  } catch {
    // Continue with fallback shell if supabase is offline
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header user={userProfile} notifications={notifications} />
      <main className="flex-1 w-full px-6 sm:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
