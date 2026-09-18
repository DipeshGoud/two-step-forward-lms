'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdminStore, AdminUser } from '@/lib/data/adminStore';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AdminUser) => void;
}

export default function NewUserModal({
  isOpen,
  onClose,
  onSuccess,
}: NewUserModalProps) {
  const { store, createUser } = useAdminStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'org_admin' | 'manager' | 'instructor' | 'learner'>('learner');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('learner');
    setSelectedSchools(store.schools.length > 0 ? [store.schools[0].name] : ['Downtown Academy']);
    setError(null);
    setIssuedCredentials(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  if (issuedCredentials) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" onClick={handleClose} />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-user-success-title"
          className="relative bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg z-10 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-100 bg-emerald-50/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 id="new-user-success-title" className="text-base font-bold text-slate-900 leading-tight">
                Account created
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Share these credentials with {issuedCredentials.name}. The password is shown once.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</span>
                <span className="block text-sm font-semibold text-slate-900 break-all">{issuedCredentials.email}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Temporary password</span>
                <span className="block font-mono text-sm font-semibold text-slate-900 break-all">{issuedCredentials.password}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              The user should change this password after their first sign-in.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`Email: ${issuedCredentials.email}\nPassword: ${issuedCredentials.password}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? 'Copied' : 'Copy credentials'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleSchool = (schoolName: string) => {
    setSelectedSchools((prev) =>
      prev.includes(schoolName)
        ? prev.filter((s) => s !== schoolName)
        : [...prev, schoolName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setError('Please provide full name and email address.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    const emailExists = store.users.some(
      (u) => u.email.toLowerCase() === trimmedEmail
    );
    if (emailExists) {
      setError(`A user with email "${trimmedEmail}" already exists.`);
      return;
    }

    if (selectedSchools.length === 0 && role !== 'org_admin') {
      setError('Please assign at least one school campus for this staff member.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { user: created, temporaryPassword } = await createUser({
        name: trimmedName,
        email: trimmedEmail,
        role,
        schools: role === 'org_admin' && selectedSchools.length === 0 ? ['All Schools'] : selectedSchools,
      });

      if (onSuccess) onSuccess(created);
      setIssuedCredentials({ name: created.name, email: created.email, password: temporaryPassword });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-user-title"
        className="relative bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg z-10 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[var(--brand-primary)] flex items-center justify-center">
              <UserPlus className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2
                id="new-user-title"
                className="text-base font-bold text-slate-900 leading-tight"
              >
                Invite / Add User
              </h2>
              <p className="text-xs text-slate-500">
                Grant organization access, define permission role, and assign school branches.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Marcus Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. m.vance@onestep.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Permission Role *
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'org_admin' | 'manager' | 'instructor' | 'learner')
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
              >
                <option value="learner">Learner / Employee</option>
                <option value="instructor">Instructor / Content Author</option>
                <option value="manager">Campus Manager</option>
                <option value="org_admin">Organization Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned School Campuses
            </label>
            <div className="border border-slate-200 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-slate-50/50">
              {store.schools.map((school) => {
                const isChecked = selectedSchools.includes(school.name);
                return (
                  <label
                    key={school.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-white text-xs text-slate-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSchool(school.name)}
                      className="rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
                    />
                    <span className="font-medium">{school.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      ({school.code})
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Select all schools where this user has operational or curriculum duties.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving...' : 'Invite User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
