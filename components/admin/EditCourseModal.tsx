/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from 'lucide-react';
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
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(course.title);
  const [totalLessons, setTotalLessons] = useState(course.totalLessons);
  const [durationMinutes, setDurationMinutes] = useState(course.durationMinutes);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course.thumbnailUrl || null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
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

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Thumbnail image must be under 10MB.');
      return;
    }

    try {
      setIsUploadingThumbnail(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'thumbnails');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload thumbnail.');
      }

      setThumbnailUrl(uploadData.url as string);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Thumbnail upload failed.');
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const updated = await updateCourse(course.id, {
        title: trimmedTitle,
        totalLessons,
        durationMinutes,
        isPublished,
        thumbnailUrl,
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
        className="bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-course-title"
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 id="edit-course-title" className="text-base font-bold text-slate-900">
                Edit Course Curriculum
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update course title, cover image, lesson workload, duration, and publication status.
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Hidden File Input for Thumbnail */}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleThumbnailSelect}
          />

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

          {/* Course Thumbnail */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Course Cover / Thumbnail
            </label>
            {thumbnailUrl ? (
              <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group">
                <img
                  src={thumbnailUrl}
                  alt="Course Thumbnail Preview"
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploadingThumbnail}
                    className="px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-md shadow-xs hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl(null)}
                    disabled={isUploadingThumbnail}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md shadow-xs hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isUploadingThumbnail && thumbnailInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20 ${
                  isUploadingThumbnail ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {isUploadingThumbnail ? (
                  <div className="flex flex-col items-center justify-center py-2">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-1.5" />
                    <span className="text-xs font-medium text-slate-600">Uploading cover image...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-1">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Click to upload course cover image
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, or WebP (Recommended 16:9, max 10MB)
                    </p>
                  </div>
                )}
              </div>
            )}
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
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingThumbnail}
              className="px-4 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 rounded-md transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
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
