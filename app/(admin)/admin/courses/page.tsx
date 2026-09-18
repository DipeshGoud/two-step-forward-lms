'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Search,
  X,
  CheckCircle2,
  Edit2,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { useAdminStore, AdminCourse } from '@/lib/data/adminStore';
import { deleteStorageFiles } from '@/lib/supabase/storage';
import NewCourseModal from '@/components/admin/NewCourseModal';
import EditCourseModal from '@/components/admin/EditCourseModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import CourseCurriculumBuilderModal from '@/components/admin/CourseCurriculumBuilderModal';

export default function AdminCoursesPage() {
  const { store, toggleCoursePublish, deleteCourse } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<AdminCourse | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<AdminCourse | null>(null);
  const [courseForCurriculum, setCourseForCurriculum] = useState<AdminCourse | null>(null);
  const [isCurriculumBuilderOpen, setIsCurriculumBuilderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCurriculumSaved = (course: AdminCourse) => {
    setFeedback(`Course "${course.title}" and its curriculum were saved successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCourseCreated = (newCourse: AdminCourse) => {
    setFeedback(`Course "${newCourse.title}" successfully created!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCourseUpdated = (updatedCourse: AdminCourse) => {
    setFeedback(`Course "${updatedCourse.title}" updated successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteConfirmed = async () => {
    if (!courseToDelete) return;
    const title = courseToDelete.title;

    // Purge all associated files (videos, pdfs, images, thumbnails) from Supabase Cloud Storage
    try {
      const filesToPurge: (string | undefined)[] = [];
      if (courseToDelete.thumbnailUrl) filesToPurge.push(courseToDelete.thumbnailUrl);
      if (courseToDelete.modules) {
        for (const mod of courseToDelete.modules) {
          for (const les of mod.lessons) {
            if (les.storagePath || les.fileUrl) filesToPurge.push(les.storagePath || les.fileUrl);
          }
        }
      }
      if (filesToPurge.length > 0) {
        await deleteStorageFiles(filesToPurge);
      }
    } catch (err) {
      console.warn('Could not purge cloud files on course delete:', err);
    }

    deleteCourse(courseToDelete.id);
    setCourseToDelete(null);
    setFeedback(`Course "${title}" and its cloud files have been deleted.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const filteredCourses = useMemo(() => {
    return store.courses.filter((course) => {
      const matchesSearch =
        searchQuery === '' ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && course.isPublished) ||
        (statusFilter === 'draft' && !course.isPublished);

      return matchesSearch && matchesStatus;
    });
  }, [store.courses, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
              Course Management
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {store.courses.length} Courses
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Build course curriculum, manage publication status, and monitor enrolled learners.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="create-course-curriculum-button"
            type="button"
            onClick={() => {
              setCourseForCurriculum(null);
              setIsCurriculumBuilderOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Course with Curriculum</span>
          </button>
        </div>
      </div>

      {/* Success Notification Feedback */}
      {feedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200/90 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by course title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs pl-8 pr-7 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs">
            {(['all', 'published', 'draft'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s === 'all' ? 'All Courses' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                <th className="py-3 px-4 sm:px-5">Course Title</th>
                <th className="py-3 px-4">Lessons & Duration</th>
                <th className="py-3 px-4">Enrolled Learners</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No courses matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const enrolledCount = store.assignments.filter(
                    (a) => a.courseId === course.id
                  ).length;

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="font-semibold text-slate-900 text-[13px] hover:text-[var(--brand-primary)] transition-colors">
                          {course.title}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            {course.totalLessons} Lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}m
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {enrolledCount} Learners
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleCoursePublish(course.id)}
                          title="Click to toggle publish status"
                          className="cursor-pointer"
                        >
                          {course.isPublished ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors">
                              <CheckCircle className="w-3 h-3" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors">
                              Draft
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            href={`/learning/courses/${course.id}?preview=true`}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                            title="Preview Course"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setCourseForCurriculum(course);
                              setIsCurriculumBuilderOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-[#7C3AED] bg-indigo-50 hover:bg-indigo-100/80 font-semibold cursor-pointer px-2.5 py-1 rounded transition-colors border border-indigo-200/60"
                            title="Edit Curriculum, Modules & Lessons"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Curriculum</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCoursePublish(course.id)}
                            className="text-xs font-semibold text-[var(--brand-primary)] hover:underline cursor-pointer px-1.5 py-1"
                          >
                            {course.isPublished ? 'Unpublish' : 'Publish'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setCourseToEdit(course)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit Course Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCourseToDelete(course)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Curriculum Builder Modal Dialog */}
      <CourseCurriculumBuilderModal
        course={courseForCurriculum}
        isOpen={isCurriculumBuilderOpen}
        onClose={() => {
          setIsCurriculumBuilderOpen(false);
          setCourseForCurriculum(null);
        }}
        onSuccess={handleCurriculumSaved}
      />

      {/* New Course Modal Dialog (Quick creation fallback) */}
      <NewCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCourseCreated}
      />

      {/* Edit Course Modal Dialog */}
      <EditCourseModal
        course={courseToEdit}
        isOpen={!!courseToEdit}
        onClose={() => setCourseToEdit(null)}
        onSuccess={handleCourseUpdated}
      />

      {/* Confirm Delete Course Modal Dialog */}
      <ConfirmDeleteModal
        isOpen={!!courseToDelete}
        title="Delete Course Curriculum"
        itemName={courseToDelete?.title || ''}
        itemType="course"
        description="Deleting this course will permanently remove its curriculum modules, quiz checkpoints, and unassign enrolled learners across all campuses."
        confirmText="Delete Course"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setCourseToDelete(null)}
      />
    </div>
  );
}
