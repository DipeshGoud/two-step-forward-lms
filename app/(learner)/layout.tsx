import React from 'react';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { StoreHydrationGate } from '@/components/ui/logo-loader';
import { UserProfile } from '@/types/auth';
import { getAuthContext } from '@/lib/auth/server';

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect('/login?error=profile_missing');

  const userProfile = context.profile as UserProfile;

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      <Header user={userProfile} />
      <main className="flex-1 w-full px-6 sm:px-8 py-6">
        <StoreHydrationGate>
          {children}
        </StoreHydrationGate>
      </main>
    </div>
  );
}
