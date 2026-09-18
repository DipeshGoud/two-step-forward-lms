'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, User, Bell, Contact } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types/auth';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
}

export function UserDrawer({ isOpen, onClose, user }: UserDrawerProps) {
  const router = useRouter();
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>('light');

  if (!isOpen) return null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push('/login');
    router.refresh();
  };

  const displayName = user?.full_name || 'TwoStep Forward Staff';
  const displayEmail = user?.email || 'learner@twostepforward.com';
  const displayId = user?.id ? user.id.replace(/-/g, '').slice(0, 11) : '50035940404';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-xl flex flex-col justify-between">
          <div>
            {/* Top Close Button */}
            <div className="px-5 py-3.5 flex items-center justify-end">
              <button
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar & Info matching Screenshot 6 */}
            <div className="px-6 pb-6 text-center border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-2.5">
                <User className="w-8 h-8 text-slate-400 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {displayName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {displayEmail}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                User ID: {displayId}
              </p>
            </div>

            {/* Menu Links matching Screenshot 6 */}
            <div className="p-4 space-y-1 border-b border-slate-100">
              <button
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Contact className="w-3.5 h-3.5" />
                </div>
                <span>My Profile</span>
              </button>

              <button
                onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span>Notification Settings</span>
              </button>
            </div>

            {/* Appearance Section matching Screenshot 6 */}
            <div className="p-5">
              <h4 className="text-xs font-semibold text-slate-700 mb-3">
                Appearance
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Light */}
                <button
                  onClick={() => setAppearance('light')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    appearance === 'light'
                      ? 'border-indigo-600 ring-1 ring-indigo-600/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-10 bg-white border border-slate-200 rounded p-1 flex flex-col gap-1 mb-1.5 shadow-2xs">
                    <div className="w-4 h-1 bg-slate-300 rounded" />
                    <div className="w-8 h-1 bg-slate-200 rounded" />
                    <div className="w-6 h-1 bg-slate-200 rounded" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Light</span>
                </button>

                {/* Dark */}
                <button
                  onClick={() => setAppearance('dark')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    appearance === 'dark'
                      ? 'border-indigo-600 ring-1 ring-indigo-600/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-10 bg-slate-900 border border-slate-700 rounded p-1 flex flex-col gap-1 mb-1.5 shadow-2xs">
                    <div className="w-4 h-1 bg-slate-600 rounded" />
                    <div className="w-8 h-1 bg-slate-700 rounded" />
                    <div className="w-6 h-1 bg-slate-700 rounded" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">Dark</span>
                </button>

                {/* OS Default */}
                <button
                  onClick={() => setAppearance('system')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    appearance === 'system'
                      ? 'border-indigo-600 ring-1 ring-indigo-600/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full h-10 rounded border border-slate-200 flex overflow-hidden mb-1.5 shadow-2xs">
                    <div className="w-1/2 h-full bg-white p-1 flex flex-col gap-1">
                      <div className="w-3 h-1 bg-slate-300 rounded" />
                      <div className="w-4 h-1 bg-slate-200 rounded" />
                    </div>
                    <div className="w-1/2 h-full bg-slate-900 p-1 flex flex-col gap-1">
                      <div className="w-3 h-1 bg-slate-600 rounded" />
                      <div className="w-4 h-1 bg-slate-700 rounded" />
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">OS Default</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sign Out Button matching Screenshot 6 */}
          <div className="p-5 border-t border-slate-100 flex justify-center">
            <button
              onClick={handleSignOut}
              className="px-6 py-1.5 rounded border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50/50 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
