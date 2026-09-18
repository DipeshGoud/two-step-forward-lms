'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { School, Plus, Users, MapPin, CheckCircle2, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import { useAdminStore, AdminSchool } from '@/lib/data/adminStore';
import NewSchoolModal from '@/components/admin/NewSchoolModal';
import EditSchoolModal from '@/components/admin/EditSchoolModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

export default function AdminSchoolsPage() {
  const { store, deleteSchool } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState<AdminSchool | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<AdminSchool | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSchoolAdded = (newSchool: AdminSchool) => {
    setFeedback(`Campus "${newSchool.name}" successfully registered!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSchoolUpdated = (updatedSchool: AdminSchool) => {
    setFeedback(`Campus "${updatedSchool.name}" updated successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteConfirmed = () => {
    if (!schoolToDelete) return;
    const name = schoolToDelete.name;
    deleteSchool(schoolToDelete.id);
    setSchoolToDelete(null);
    setFeedback(`Campus "${name}" has been removed.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
              Schools Management
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {store.schools.length} Campuses
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage school branches, campus locations, and staff assignments.
          </p>
        </div>

        <button
          id="add-school-button"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add School</span>
        </button>
      </div>

      {/* Success Notification Feedback */}
      {feedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Schools Card Grid — individual cards keep a sensible width at any count */}
      {store.schools.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <School className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">No Campuses Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Register your first school campus to start organizing staff and courses.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add School</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {store.schools.map((school) => {
            // Dynamic calculation of assigned staff & active assignments
            const assignedStaff = store.users.filter(
              (u) => u.schools.includes(school.name) || u.schools.includes('All Schools')
            ).length;

            const assignedCoursesCount = new Set(
              store.assignments.filter((a) => a.schoolId === school.id).map((a) => a.courseId)
            ).size || store.courses.filter((c) => c.isPublished).length;

            return (
              <div
                key={school.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        href={`/admin/schools/${school.id}`}
                        className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80 flex items-center justify-center shrink-0 transition-colors"
                      >
                        <School className="w-5 h-5 stroke-[1.8]" />
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/schools/${school.id}`}
                          className="text-[15px] font-bold text-slate-900 hover:text-[var(--brand-primary)] transition-colors block truncate"
                        >
                          {school.name}
                        </Link>
                        <span className="inline-block text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 border border-slate-200/60">
                          {school.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSchoolToEdit(school)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="Edit Campus Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchoolToDelete(school)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete Campus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200/60">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[200px]">{school.location || 'No location set'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-3">
                    {school.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{assignedStaff}</span> Staff
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-600">
                      {assignedCoursesCount} Courses
                    </span>
                    <Link
                      href={`/admin/schools/${school.id}`}
                      className="font-semibold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>View Info</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New School Modal Dialog */}
      <NewSchoolModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSchoolAdded}
      />

      {/* Edit School Modal Dialog */}
      <EditSchoolModal
        school={schoolToEdit}
        isOpen={!!schoolToEdit}
        onClose={() => setSchoolToEdit(null)}
        onSuccess={handleSchoolUpdated}
      />

      {/* Confirm Delete School Modal Dialog */}
      <ConfirmDeleteModal
        isOpen={!!schoolToDelete}
        title="Delete School Campus"
        itemName={schoolToDelete?.name || ''}
        itemType="school"
        description="Removing this school campus will unassign faculty attached solely to this location and archive active course allocations."
        confirmText="Delete Campus"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setSchoolToDelete(null)}
      />
    </div>
  );
}
