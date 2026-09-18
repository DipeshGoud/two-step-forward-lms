'use client';

import React from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { LMSNotification } from '@/types/lms';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: LMSNotification[];
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  // Sample realistic notifications matching Screenshot 5 if none passed
  const displayNotifications: LMSNotification[] =
    notifications.length > 0
      ? notifications
      : [
          {
            id: 'n1',
            organization_id: 'org-1',
            user_id: 'u1',
            title: 'Course Assigned',
            message: "You've been assigned course TwoStep Forward Digital Productivity & Tooling Kit by Operation Team. Start learning now!",
            type: 'course_assigned',
            link_url: '/learning/courses/course-5',
            is_read: false,
            created_at: '2026-06-18T13:50:00Z',
          },
          {
            id: 'n2',
            organization_id: 'org-1',
            user_id: 'u1',
            title: 'Course Assigned',
            message: "You've been assigned course Child Safety & Protection Standards Training by Operation Team. Start learning now!",
            type: 'course_assigned',
            link_url: '/learning/courses/course-1',
            is_read: false,
            created_at: '2026-06-14T22:23:00Z',
          },
          {
            id: 'n3',
            organization_id: 'org-1',
            user_id: 'u1',
            title: 'Course Assigned',
            message: "You've been assigned course CSR Induction Day 3 by Operation Team. Start learning now!",
            type: 'course_assigned',
            link_url: '/learning/courses/course-2',
            is_read: true,
            created_at: '2026-06-14T21:23:00Z',
          },
          {
            id: 'n4',
            organization_id: 'org-1',
            user_id: 'u1',
            title: 'Course Assigned',
            message: "You've been assigned course CSR Induction Day 2 by Operation Team. Start learning now!",
            type: 'course_assigned',
            link_url: '/learning/courses/course-3',
            is_read: true,
            created_at: '2026-06-14T21:20:00Z',
          },
          {
            id: 'n5',
            organization_id: 'org-1',
            user_id: 'u1',
            title: 'Course Assigned',
            message: "You've been assigned course CSR Online Induction Day 1 by Operation Team. Start learning now!",
            type: 'course_assigned',
            link_url: '/learning/courses/course-4',
            is_read: true,
            created_at: '2026-06-14T21:10:00Z',
          },
        ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm sm:max-w-md bg-white shadow-xl flex flex-col">
          {/* Header matching Screenshot 5 */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-[14px] font-semibold text-slate-800">
                Notifications
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications List matching Screenshot 5 */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {displayNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No notifications yet.</p>
              </div>
            ) : (
              displayNotifications.map((n) => (
                <div key={n.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <p className="text-[13px] text-slate-700 leading-relaxed font-normal">
                    {n.message}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-normal">
                    {new Date(n.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
