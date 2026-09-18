'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import { useAdminStore, AdminCourse } from '@/lib/data/adminStore';

interface EditCourseModalProps {
  course: AdminCourse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (course: AdminCourse) => void;
}

function EditCourseModalContent({
  course,
  onClose,
  onSuccess,
}: {
  course: AdminCourse;
  onClose: () => void;
  onSuccess?: (course: AdminCourse) => void;
}) {
  const { updateCourse } = useAdminStore();

  const [title, setTitle] = useState(course.title);
  const [totalLessons, setTotalLessons] = useState(course.totalLessons);
  const [durationMinutes, setDurationMinutes] = useState(course.durationMinutes);
  const [isPublished, setIsPublished] = useState(course.isPublished);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Please enter the course curriculum title.');
      return;
    }

    if (totalLessons < 1) {
      setError('Course must contain at least 1 lesson module.');
      return;
    }

    if (durationMinutes < 1) {
      setError('Duration must be at least 1 minute.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = updateCourse(course.id, {
        title: trimmedTitle,
        totalLessons,
        durationMinutes,
        isPublished,
      });

      onSuccess?.(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update course.');
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
        aria-labelledby="edit-course-title"
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 id="edit-course-title" className="text-base font-bold text-slate-900">
                Edit Course Curriculum
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update course title, lesson workload, duration, and publication status.
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

          {/* Course Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Course Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Applied AI in Modern Education"
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:bg-white"
            />
          </div>

          {/* Lessons & Duration Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Lesson Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={totalLessons}
                onChange={(e) => setTotalLessons(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Estimated Minutes <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={5}
                step={5}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:bg-white"
              />
            </div>
          </div>

          {/* Publication Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Publication Status
            </label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="course-status"
                  checked={isPublished}
                  onChange={() => setIsPublished(true)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Published (Visible in Catalog)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-500">
                <input
                  type="radio"
                  name="course-status"
                  checked={!isPublished}
                  onChange={() => setIsPublished(false)}
                  className="text-slate-600 focus:ring-slate-500"
                />
                <span>Draft (Hidden)</span>
              </label>
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

export default function EditCourseModal({
  course,
  isOpen,
  onClose,
  onSuccess,
}: EditCourseModalProps) {
  if (!isOpen || !course) return null;

  return (
    <EditCourseModalContent
      key={course.id}
      course={course}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
