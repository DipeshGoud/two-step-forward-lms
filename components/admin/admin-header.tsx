/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  UserCheck,
  ArrowUpRight,
  User,
} from 'lucide-react';
import { UserProfile } from '@/types/auth';
import BrandLogo from '@/components/ui/BrandLogo';
import { UserDrawer } from '@/components/layout/user-drawer';

interface AdminHeaderProps {
  user?: UserProfile | null;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Schools', href: '/admin/schools', icon: School, exact: false },
    { label: 'Users', href: '/admin/users', icon: Users, exact: false },
    { label: 'Courses', href: '/admin/courses', icon: BookOpen, exact: false },
    { label: 'Assignments', href: '/admin/assignments', icon: UserCheck, exact: false },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="w-full px-6 sm:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand & Admin Badge + Navigation */}
          <div className="flex items-center gap-8">
            {/* Brand Logo with Admin Tag */}
            <Link href="/admin" className="group focus:outline-none py-1">
              <BrandLogo size="md" showAdminBadge={true} />
            </Link>

            {/* Nav Items */}
            <nav className="hidden md:flex items-center gap-6 h-14">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 h-full text-[13px] transition-colors ${
                      isActive
                        ? 'text-[var(--brand-primary)] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand-primary)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Switch to Learner View & User Profile */}
          <div className="flex items-center gap-3.5">
            {/* Switch to Learner LMS button */}
            <Link
              href="/learning"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <span>Learner View</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            {/* Profile Avatar Button */}
            <button
              type="button"
              onClick={() => setIsUserDrawerOpen(true)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-85 transition-opacity"
              aria-label="User Profile"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name || 'Admin'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-slate-700">
                {user?.full_name || 'Admin'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex border-t border-slate-100 px-4 overflow-x-auto bg-white">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                  : 'text-slate-600'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User Profile Drawer */}
      <UserDrawer
        isOpen={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
        user={user}
      />
    </header>
  );
}
