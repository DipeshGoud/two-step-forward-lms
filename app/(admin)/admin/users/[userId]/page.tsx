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
  Shield,
  Mail,
  Plus,
  Award,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAdminStore, AdminUser } from '@/lib/data/adminStore';
import EditUserModal from '@/components/admin/EditUserModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

export default function UserDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const userId = params?.userId || '';

  const { store, deleteUser } = useAdminStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Find user from reactive store
  const user = useMemo(() => {
    return (
      store.users.find((u) => u.id === userId) ||
      store.users.find((u) => u.name.toLowerCase().replace(/\s+/g, '-') === userId.toLowerCase())
    );
  }, [store.users, userId]);

  // Derive user's assignments from store
  const userAssignments = useMemo(() => {
    if (!user) return [];
    return store.assignments.filter(
      (a) => a.employeeId === user.id || a.employeeName.toLowerCase() === user.name.toLowerCase()
    );
  }, [store.assignments, user]);

  // Derive user's school objects from store
  const userSchools = useMemo(() => {
    if (!user) return [];
    return store.schools.filter((s) =>
      user.schools.includes(s.name) ||
      user.schools.includes(s.id) ||
      user.schools.includes('All Schools')
    );
  }, [store.schools, user]);

  const completedCount = userAssignments.filter((c) => c.status === 'completed').length;
  const inProgressCount = userAssignments.filter((c) => c.status === 'in_progress').length;

  const handleUserUpdated = (updated: AdminUser) => {
    setFeedback(`Profile and role for "${updated.name}" updated successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteConfirmed = () => {
    if (!user) return;
    deleteUser(user.id);
    setIsDeleteModalOpen(false);
    router.push('/admin/users');
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
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200/60 px-2.5 py-0.5 rounded">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded">
            Manager
          </span>
        );
      case 'instructor':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded">
            Instructor
          </span>
        );
    }
  };

  // If user not found (e.g. deleted)
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Users & Employees</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">User Not Found</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">User Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">
            This user profile may have been removed or does not exist in the directory.
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 py-2 rounded-md transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Users Directory</span>
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
            href="/admin/users"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Users & Employees</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">{user.name}</span>
        </div>

        <Link
          href="/learning"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <ExternalLink className="w-3 h-3 text-slate-400" />
          <span>Learner Portal</span>
        </Link>
      </div>

      {/* Success Feedback Banner */}
      {feedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* User Profile Overview Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* User Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-bold text-xl flex items-center justify-center shrink-0">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {user.name}
                </h1>
                {getRoleBadge(user.role)}
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    user.status === 'active'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                      : 'text-slate-600 bg-slate-100 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {user.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user.email}
                </span>
                <span className="text-slate-300">•</span>
                <span>Joined {user.joinedDate || 'Jan 2026'}</span>
                <span className="text-slate-300">•</span>
                <span>Active {user.lastActive || 'Recently'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit, Delete, Assign Course */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Profile & Role</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 px-3 py-2 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete User</span>
            </button>

            <Link
              href="/admin/assignments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Assign Course</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-hidden mt-6">
          <div className="p-3.5 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <School className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned Schools</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{user.schools.length}</div>
          </div>

          <div className="p-3.5 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Assigned Courses</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{userAssignments.length}</div>
          </div>

          <div className="p-3.5 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>In Progress</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{inProgressCount}</div>
          </div>

          <div className="p-3.5 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Section 1: Assigned Schools */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-600" />
              <span>Assigned Schools & Campuses</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Schools and branches where {user.name} has operational or instructional access.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {user.schools.length} {user.schools.length === 1 ? 'School' : 'Schools'}
          </span>
        </div>

        {userSchools.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            {user.schools.join(', ') || 'No specific schools assigned.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {userSchools.map((school) => (
              <div
                key={school.id}
                className="p-5 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <School className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <div>
                    <Link
                      href={`/admin/schools/${school.id}`}
                      className="font-semibold text-slate-900 text-sm hover:text-[var(--brand-primary)] transition-colors"
                    >
                      {school.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                        {school.code}
                      </span>
                      <span className="text-xs text-slate-500">{school.location}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {user.role === 'org_admin' ? 'Administrator' : user.role === 'manager' ? 'Branch Manager' : 'Faculty Member'}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/admin/schools/${school.id}`}
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline shrink-0"
                >
                  View School →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Assigned Courses & Progress */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Assigned Courses & Curriculum Progress</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Course enrollments, completion milestones, and school assignments for this employee.
            </p>
          </div>
          <Link
            href="/admin/assignments"
            className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Assign another course →
          </Link>
        </div>

        {userAssignments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No courses assigned to this user yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                  <th className="py-3 px-4 sm:px-5">Course</th>
                  <th className="py-3 px-4">School Scope</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-5">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {userAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-8 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-[13px] hover:text-[var(--brand-primary)] transition-colors">
                            {assignment.courseTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Assigned on {assignment.assignedAt}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        <School className="w-3 h-3 text-slate-400" />
                        {assignment.schoolName}
                      </span>
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
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 sm:w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              assignment.status === 'completed'
                                ? 'bg-emerald-500 w-full'
                                : assignment.status === 'in_progress'
                                ? 'bg-amber-500 w-1/2'
                                : 'bg-transparent w-0'
                            }`}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {assignment.status === 'completed'
                            ? '100%'
                            : assignment.status === 'in_progress'
                            ? '50%'
                            : '0%'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleUserUpdated}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete User & Staff Member"
        itemName={user.name}
        itemType="user"
        description="Removing this user will revoke their application credentials, remove them from all school campuses, and archive their course enrollment records."
        confirmText="Delete User"
        onConfirm={handleDeleteConfirmed}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
