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
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [totalLessons, setTotalLessons] = useState<number | string>('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
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
    setThumbnailUrl(null);
    setIsPublished(true);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

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
      setError('Please provide a course title.');
      return;
    }

    const lessonsCount = Number(totalLessons) || 0;
    const duration = Number(durationMinutes) || 0;

    setIsSubmitting(true);
    try {
      const created = await createCourse({
        title: trimmedTitle,
        totalLessons: Math.max(0, lessonsCount),
        durationMinutes: Math.max(0, duration),
        isPublished,
        thumbnailUrl,
      });

      if (onSuccess) onSuccess(created);
      handleClose();
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
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-course-title"
        className="relative bg-white rounded-xl shadow-xl border border-slate-200/90 w-full max-w-lg z-10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
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
                Author new curriculum modules, upload cover image, and publish.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
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

          {/* Course Thumbnail Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingThumbnail}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Create Course</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
