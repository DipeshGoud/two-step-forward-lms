'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  School,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Plus,
  MapPin,
  ExternalLink,
  Shield,
  Award,
  BookMarked,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAdminStore, AdminSchool } from '@/lib/data/adminStore';
import NewAssignmentModal from '@/components/admin/NewAssignmentModal';
import NewUserModal from '@/components/admin/NewUserModal';
import EditSchoolModal from '@/components/admin/EditSchoolModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

export default function SchoolDetailPage() {
  const params = useParams<{ schoolId: string }>();
  const router = useRouter();
  const schoolId = params?.schoolId || '';

  const { store, updateAssignmentStatus, deleteSchool } = useAdminStore();
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'yet_to_start' | 'in_progress' | 'completed'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Lookup the school by id or code
  const school = useMemo(() => {
    return store.schools.find(
      (s) => s.id === schoolId || s.code.toLowerCase() === schoolId.toLowerCase()
    );
  }, [store.schools, schoolId]);

  // Derive assigned faculty / staff for this school
  const assignedStaff = useMemo(() => {
    if (!school) return [];
    return store.users.filter(
      (u) => u.schools.includes(school.name) || u.schools.includes('All Schools')
    );
  }, [store.users, school]);

  // Derive all assignments at this school
  const schoolAssignments = useMemo(() => {
    if (!school) return [];
    return store.assignments.filter(
      (a) => a.schoolId === school.id || a.schoolName === school.name
    );
  }, [store.assignments, school]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'all') return schoolAssignments;
    return schoolAssignments.filter((a) => a.status === statusFilter);
  }, [schoolAssignments, statusFilter]);

  // Distinct courses assigned
  const distinctCourseIds = useMemo(() => {
    return new Set(schoolAssignments.map((a) => a.courseId));
  }, [schoolAssignments]);

  const distinctCourses = useMemo(() => {
    if (distinctCourseIds.size === 0) {
      return store.courses.filter((c) => c.isPublished).slice(0, 3);
    }
    return store.courses.filter((c) => distinctCourseIds.has(c.id));
  }, [store.courses, distinctCourseIds]);

  // Compliance metrics
  const completedCount = schoolAssignments.filter((a) => a.status === 'completed').length;
  const complianceRate =
    schoolAssignments.length > 0
      ? Math.round((completedCount / schoolAssignments.length) * 100)
      : 0;

  const handleSchoolUpdated = (updated: AdminSchool) => {
    setFeedback(`Campus "${updated.name}" updated successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteConfirmed = () => {
    if (!school) return;
    deleteSchool(school.id);
    setIsDeleteModalOpen(false);
    router.push('/admin/schools');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Yet to Start
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'org_admin':
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
            Manager
          </span>
        );
      case 'instructor':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
            Instructor
          </span>
        );
    }
  };

  // If school is not found or deleted
  if (!school) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/admin/schools"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Schools Management</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">Campus Not Found</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Campus Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">
            This school branch may have been removed or does not exist.
          </p>
          <Link
            href="/admin/schools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 py-2 rounded-md transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Schools Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/admin/schools"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Schools Management</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">{school.name}</span>
        </div>

        <Link
          href="/admin/assignments"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <ExternalLink className="w-3 h-3 text-slate-400" />
          <span>Assignment Matrix</span>
        </Link>
      </div>

      {/* Success Notification Feedback */}
      {feedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* School Overview Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* School Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 flex items-center justify-center shrink-0">
              <School className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {school.name}
                </h1>
                <span className="inline-block text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                  {school.code}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Campus
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {school.location}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{school.description}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit Campus, Delete Campus, Assign Staff, Assign Course */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Campus</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 px-3 py-2 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete School</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-md transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Assign Staff</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAssignmentModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Assign Course</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip - Touching Connected Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-hidden mt-6">
          <div className="p-3.5 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned Personnel</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{assignedStaff.length}</div>
            <span className="text-[11px] text-slate-400">Instructors & Staff</span>
          </div>

          <div className="p-3.5 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Active Curriculum</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{distinctCourses.length}</div>
            <span className="text-[11px] text-slate-400">Enrolled Courses</span>
          </div>

          <div className="p-3.5 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <BookMarked className="w-3.5 h-3.5 text-blue-600" />
              <span>Total Assignments</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{schoolAssignments.length}</div>
            <span className="text-[11px] text-slate-400">Active Seats</span>
          </div>

          <div className="p-3.5 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compliance Rate</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                {complianceRate}%
              </span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${complianceRate}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {completedCount} of {schoolAssignments.length} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Assigned Staff Directory */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Campus Faculty & Staff Roster</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instructors and managers currently deployed or authorized at {school.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUserModalOpen(true)}
            className="text-xs font-semibold text-[var(--brand-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Staff</span>
          </button>
        </div>

        {assignedStaff.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No instructors or staff currently assigned to this campus.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                  <th className="py-3 px-4 sm:px-5">Name & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Active Courses</th>
                  <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assignedStaff.map((staff) => {
                  const staffAssignments = schoolAssignments.filter((a) => a.employeeId === staff.id);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-5">
                        <Link
                          href={`/admin/users/${staff.id}`}
                          className="font-semibold text-slate-900 hover:text-[var(--brand-primary)] transition-colors block"
                        >
                          {staff.name}
                        </Link>
                        <span className="text-slate-400 text-[11px]">{staff.email}</span>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(staff.role)}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {staffAssignments.length} Assigned
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <Link
                          href={`/admin/users/${staff.id}`}
                          className="font-semibold text-[var(--brand-primary)] hover:underline"
                        >
                          View Profile →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Course Assignment Matrix for School */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Campus Curriculum & Training Assignments</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live records of all training courses assigned to staff at this school.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs">
              {(['all', 'yet_to_start', 'in_progress', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                    statusFilter === s
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsAssignmentModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Assign</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                <th className="py-3 px-4 sm:px-5">Staff Member</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No course assignments found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5">
                      <Link
                        href={`/admin/users/${assignment.employeeId}`}
                        className="font-semibold text-slate-900 hover:text-[var(--brand-primary)] transition-colors block"
                      >
                        {assignment.employeeName}
                      </Link>
                      <span className="text-slate-400 text-[11px]">{assignment.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900">{assignment.courseTitle}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {assignment.dueDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(assignment.status)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {assignment.status !== 'completed' ? (
                          <button
                            type="button"
                            onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                            className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                            title="Mark Completed"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateAssignmentStatus(assignment.id, 'yet_to_start')}
                            className="text-xs font-semibold text-slate-400 hover:underline cursor-pointer"
                            title="Reset Progress"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit School Modal Dialog */}
      <EditSchoolModal
        school={school}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSchoolUpdated}
      />

      {/* Confirm Delete School Modal Dialog */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete School Campus"
        itemName={school.name}
        itemType="school"
        description="Removing this school campus will unassign faculty attached solely to this location and archive active course allocations."
        confirmText="Delete Campus"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* Modals for Direct Actions on School Detail */}
      <NewAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
      />

      <NewUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />
    </div>
  );
}
