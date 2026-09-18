'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import BrandLogo from '@/components/ui/BrandLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/learning';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-7 bg-white shadow-xs border border-slate-200/90">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          placeholder="name@organization.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-normal text-[var(--brand-primary)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="md"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <div className="pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setEmail('admin@twostepforward.com');
              setPassword('Password@123');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span className="font-medium text-slate-500">Demo Login:</span>
            <span className="font-semibold text-slate-800">admin@twostepforward.com</span>
            <span className="text-slate-400">/</span>
            <span className="font-mono text-slate-700">Password@123</span>
          </button>
        </div>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F5F6F8]">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <BrandLogo size="xl" showTagline={true} tagline="Enterprise Learning Management System" />
        </div>

        {/* Form */}
        <Suspense fallback={<Card className="p-8 h-64 animate-pulse bg-white border border-slate-200" />}>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          TwoStep Forward LMS &bull; Enterprise Learning Platform
        </p>
      </div>
    </div>
  );
}
