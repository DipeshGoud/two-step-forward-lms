/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, User, Shield } from 'lucide-react';
import { UserDrawer } from './user-drawer';
import { UserProfile } from '@/types/auth';
import { isUserAdmin } from '@/lib/data/adminStore';
import BrandLogo from '@/components/ui/BrandLogo';

interface HeaderProps {
  user?: UserProfile | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);

  const navItems = [
    { label: 'Learning', href: '/learning' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="w-full px-6 sm:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Brand & Navigation */}
            <div className="flex items-center gap-9">
              {/* Brand Logo */}
              <Link href="/learning" className="group focus:outline-none py-1">
                <BrandLogo size="md" />
              </Link>

              {/* Main Nav Items */}
              <nav className="hidden md:flex items-center gap-8 h-14">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center h-full text-[13px] transition-colors ${
                        isActive
                          ? 'text-[var(--brand-primary)] font-semibold'
                          : 'text-slate-600 hover:text-slate-900 font-medium'
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand-primary)]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Search, Profile */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 stroke-[2]" />
                <span>Search</span>
              </button>

              {/* Admin Panel Link */}
              {isUserAdmin(user?.role) && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}

              {/* User Profile Avatar */}
              <button
                type="button"
                onClick={() => setIsUserDrawerOpen(true)}
                className="p-0.5 rounded-full hover:ring-2 hover:ring-slate-200 transition-all cursor-pointer"
                aria-label="User Profile"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400 stroke-[1.8]" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation (only if multiple tabs) */}
        {navItems.length > 1 && (
          <div className="md:hidden flex border-t border-slate-100 px-4 overflow-x-auto bg-white">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
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
        )}
      </header>

      {/* User Profile Drawer */}
      <UserDrawer
        isOpen={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
        user={user}
      />
    </>
  );
}
