'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdminStore, AdminAssignment } from '@/lib/data/adminStore';

interface NewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (assignment: AdminAssignment) => void;
}

export default function NewAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
}: NewAssignmentModalProps) {
  const { store, createAssignment } = useAdminStore();

  const publishedCourses = store.courses.filter((c) => c.isPublished);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [customDueDate, setCustomDueDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Derive active values (falling back to first valid options if unselected)
  const employeeId = selectedEmployeeId || store.users[0]?.id || '';
  const courseId = selectedCourseId || publishedCourses[0]?.id || '';
  const schoolId = selectedSchoolId || store.schools[0]?.id || '';
  const dueDate = customDueDate || (() => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    return nextMonth.toISOString().split('T')[0];
  })();

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId || !courseId || !schoolId || !dueDate) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
       const newAsg = await createAssignment({
        employeeId,
        courseId,
        schoolId,
        dueDate,
      });

      setSuccessMessage(`Successfully assigned course to ${newAsg.employeeName}!`);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) onSuccess(newAsg);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Failed to create assignment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-white border border-slate-200/90 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-slate-900">
                New Course Assignment
              </h2>
              <p className="text-xs text-slate-500">
                Assign curriculum to an employee under a specific school scope.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200/60 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label
              htmlFor="employee-select"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Select Employee / User <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="employee-select"
                value={employeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                {store.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace('_', ' ').toUpperCase()}) — {u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Selection */}
          <div>
            <label
              htmlFor="course-select"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Select Course <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="course-select"
                value={courseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                {publishedCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.totalLessons} Lessons)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* School Scope Selection */}
          <div>
            <label
              htmlFor="school-select"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              School Campus Scope <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="school-select"
                value={schoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                required
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                {store.schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code} — {s.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date Picker */}
          <div>
            <label
              htmlFor="due-date-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Completion Target (Due Date) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setCustomDueDate(e.target.value)}
                required
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 py-2 rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Assigning...</span>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Create Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
