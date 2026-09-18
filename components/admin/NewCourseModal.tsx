'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import { useAdminStore, AdminCourse } from '@/lib/data/adminStore';

interface NewCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (course: AdminCourse) => void;
}

export default function NewCourseModal({
  isOpen,
  onClose,
  onSuccess,
}: NewCourseModalProps) {
  const { createCourse } = useAdminStore();

  const [title, setTitle] = useState('');
  const [totalLessons, setTotalLessons] = useState<number | string>('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);
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
    setTitle('');
    setTotalLessons('');
    setDurationMinutes('');
    setIsPublished(true);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a course title.');
      return;
    }

    const lessonsCount = Number(totalLessons) || 0;
    const duration = Number(durationMinutes) || 0;

    setIsSubmitting(true);
    try {
      const created = createCourse({
        title: trimmedTitle,
        totalLessons: Math.max(0, lessonsCount),
        durationMinutes: Math.max(0, duration),
        isPublished,
      });

      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
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
        aria-labelledby="new-course-title"
        className="relative bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg z-10 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2
                id="new-course-title"
                className="text-base font-bold text-slate-900 leading-tight"
              >
                Create New Course
              </h2>
              <p className="text-xs text-slate-500">
                Author new curriculum modules, define estimated duration, and publish.
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
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced Educational Leadership & Pedagogy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Total Lessons *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 4"
                value={totalLessons}
                onChange={(e) => setTotalLessons(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={3000}
                step={5}
                placeholder="e.g. 60"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catalog Publication Status
            </label>
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="radio"
                  name="publish_status"
                  checked={isPublished}
                  onChange={() => setIsPublished(true)}
                  className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
                />
                <span className="font-medium text-emerald-700">Publish Immediately</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="radio"
                  name="publish_status"
                  checked={!isPublished}
                  onChange={() => setIsPublished(false)}
                  className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
                />
                <span className="font-medium text-slate-600">Save as Draft</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Published courses appear in the learner curriculum catalog and assignment pickers.
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
              <span>{isSubmitting ? 'Saving...' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
