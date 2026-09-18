'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import { useAdminStore, AdminUser } from '@/lib/data/adminStore';

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AdminUser) => void;
}

function EditUserModalContent({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess?: (user: AdminUser) => void;
}) {
  const { store, updateUser } = useAdminStore();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<'org_admin' | 'manager' | 'instructor' | 'learner'>(
    user.role === 'super_admin' ? 'org_admin' : user.role
  );
  const [status, setStatus] = useState<'active' | 'inactive'>(user.status);
  const [selectedSchools, setSelectedSchools] = useState<string[]>(user.schools);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

    if (!trimmedName) {
      setError('Please enter the employee or user name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }

    // Check duplicate email against other users
    const emailExists = store.users.some(
      (u) => u.id !== user.id && u.email.toLowerCase() === trimmedEmail
    );
    if (emailExists) {
      setError('Another user is already registered with this email address.');
      return;
    }

    if (selectedSchools.length === 0) {
      setError('Please assign at least one school campus or select All Schools.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await updateUser(user.id, {
        name: trimmedName,
        email: trimmedEmail,
        role,
        status,
        schools: selectedSchools,
      });

      if (updated) {
        if (onSuccess) onSuccess(updated);
        onClose();
      } else {
        setError('User record could not be found.');
      }
    } catch {
      setError('An error occurred while saving user changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 id="edit-user-title" className="text-base font-bold text-slate-900">
                Edit User & Role
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update staff profile, operational role, and campus permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="edit-user-name" className="block font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-user-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800"
            />
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="edit-user-email" className="block font-semibold text-slate-700 mb-1">
              Work Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah.j@onestep.edu"
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800"
            />
          </div>

          {/* Role & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Role selection */}
            <div>
              <label htmlFor="edit-user-role" className="block font-semibold text-slate-700 mb-1">
                Assigned Role <span className="text-rose-500">*</span>
              </label>
              <select
                id="edit-user-role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'org_admin' | 'manager' | 'instructor' | 'learner')
                }
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 cursor-pointer"
              >
                <option value="learner">Learner (Assigned Course Access)</option>
                <option value="instructor">Instructor (Assigned Course Access)</option>
                <option value="manager">Manager (School & Staff Operations)</option>
                <option value="org_admin">Organization Admin (Full Administrative Authority)</option>
              </select>
            </div>

            {/* Status selection */}
            <div>
              <label htmlFor="edit-user-status" className="block font-semibold text-slate-700 mb-1">
                Account Status
              </label>
              <select
                id="edit-user-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 cursor-pointer"
              >
                <option value="active">Active (Access Enabled)</option>
                <option value="inactive">Inactive (Access Suspended)</option>
              </select>
            </div>
          </div>

          {/* Assigned Schools */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Assigned School Campuses <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Select one or multiple school branches this staff member operates within.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200/80 rounded-md">
              {store.schools.map((school) => {
                const isSelected = selectedSchools.includes(school.name);
                return (
                  <label
                    key={school.id}
                    className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-medium'
                        : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSchool(school.name)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="truncate">{school.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer inside form */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 rounded-md transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <EditUserModalContent
      key={user.id}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
