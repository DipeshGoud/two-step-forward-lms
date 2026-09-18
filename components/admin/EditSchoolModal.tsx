'use client';

import React, { useState, useEffect } from 'react';
import { X, School, AlertCircle } from 'lucide-react';
import { useAdminStore, AdminSchool } from '@/lib/data/adminStore';

interface EditSchoolModalProps {
  school: AdminSchool | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (school: AdminSchool) => void;
}

function EditSchoolModalContent({
  school,
  onClose,
  onSuccess,
}: {
  school: AdminSchool;
  onClose: () => void;
  onSuccess?: (school: AdminSchool) => void;
}) {
  const { updateSchool } = useAdminStore();

  const [name, setName] = useState(school.name);
  const [code, setCode] = useState(school.code);
  const [location, setLocation] = useState(school.location);
  const [description, setDescription] = useState(school.description);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedLocation = location.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError('Please enter the school or campus name.');
      return;
    }

    if (!trimmedCode) {
      setError('Please enter a campus branch code (e.g. DTA-01).');
      return;
    }

    if (!trimmedLocation) {
      setError('Please enter the campus location or city.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateSchool(school.id, {
        name: trimmedName,
        code: trimmedCode,
        location: trimmedLocation,
        description: trimmedDescription,
      });

      if (updated) {
        if (onSuccess) onSuccess(updated);
        onClose();
      } else {
        setError('School campus could not be found.');
      }
    } catch {
      setError('An error occurred while saving school changes. Please try again.');
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
        aria-labelledby="edit-school-title"
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <School className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 id="edit-school-title" className="text-base font-bold text-slate-900">
                Edit School Campus
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update branch name, code, location, and administrative details.
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

          {/* School Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              School / Campus Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Valley High"
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:bg-white"
            />
          </div>

          {/* Branch Code and Location Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Branch Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 text-xs uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Campus Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:bg-white resize-none"
            />
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

export default function EditSchoolModal({
  school,
  isOpen,
  onClose,
  onSuccess,
}: EditSchoolModalProps) {
  if (!isOpen || !school) return null;

  return (
    <EditSchoolModalContent
      key={school.id}
      school={school}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
