'use client';

import React, { useState, useEffect } from 'react';
import { X, School, AlertCircle } from 'lucide-react';
import { useAdminStore, AdminSchool } from '@/lib/data/adminStore';

interface NewSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (school: AdminSchool) => void;
}

export default function NewSchoolModal({
  isOpen,
  onClose,
  onSuccess,
}: NewSchoolModalProps) {
  const { store, createSchool } = useAdminStore();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setCode('');
    setLocation('');
    setDescription('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedLoc = location.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName || !trimmedCode || !trimmedLoc) {
      setError('Please provide school name, campus code, and location.');
      return;
    }

    const codeExists = store.schools.some(
      (s) => s.code.toUpperCase() === trimmedCode
    );
    if (codeExists) {
      setError(`A campus with code "${trimmedCode}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createSchool({
        name: trimmedName,
        code: trimmedCode,
        location: trimmedLoc,
        description: trimmedDesc || 'Operational campus for student curriculum instruction and faculty.',
      });

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create school');
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
        aria-labelledby="new-school-title"
        className="relative bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg z-10 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <School className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2
                id="new-school-title"
                className="text-base font-bold text-slate-900 leading-tight"
              >
                Add School Campus
              </h2>
              <p className="text-xs text-slate-500">
                Register a new school branch into the organization network.
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
              School Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Riverside STEM Academy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campus Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RSA-05"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Location / District *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Riverside District"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description & Operational Scope
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Science laboratory facilities and secondary education campus."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
            />
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
              <span>{isSubmitting ? 'Saving...' : 'Add School'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
