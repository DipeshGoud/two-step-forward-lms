'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { UserPlus, Shield, School, Search, X, CheckCircle2, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { useAdminStore, AdminUser } from '@/lib/data/adminStore';
import NewUserModal from '@/components/admin/NewUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';

export default function AdminUsersPage() {
  const { store, deleteUser } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'org_admin' | 'manager' | 'instructor' | 'learner'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleUserAdded = (newUser: AdminUser) => {
    setFeedback(`User "${newUser.name}" successfully added to directory!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleUserUpdated = (updatedUser: AdminUser) => {
    setFeedback(`User "${updatedUser.name}" profile and role updated!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteConfirmed = () => {
    if (!userToDelete) return;
    const name = userToDelete.name;
    deleteUser(userToDelete.id);
    setUserToDelete(null);
    setFeedback(`User "${name}" has been removed from directory.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const filteredUsers = useMemo(() => {
    return store.users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.schools.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [store.users, searchQuery, roleFilter]);

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
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
            Instructor
          </span>
        );
      case 'learner':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
            Learner
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
              Users & Employees
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {store.users.length} Staff
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage organization members, assign roles, and configure multi-school access.
          </p>
        </div>

        <button
          id="invite-user-button"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Invite User</span>
        </button>
      </div>

      {/* Success Feedback Banner */}
      {feedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg">
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
            placeholder="Search by name, email, or school..."
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
            {(['all', 'org_admin', 'manager', 'instructor', 'learner'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r === 'all'
                  ? 'All Roles'
                  : r === 'org_admin'
                  ? 'Admin'
                  : r === 'manager'
                  ? 'Manager'
                  : r === 'instructor'
                  ? 'Instructor'
                  : 'Learner'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                <th className="py-3 px-4 sm:px-5">Name & Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Schools</th>
                <th className="py-3 px-4">Assignments</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const assignedCount = store.assignments.filter(
                    (a) => a.employeeId === user.id
                  ).length;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-5">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-semibold text-slate-900 text-[13px] hover:text-[var(--brand-primary)] transition-colors block"
                        >
                          {user.name}
                        </Link>
                        <div className="text-slate-400 mt-0.5">{user.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.schools.map((sch) => (
                            <span
                              key={sch}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60"
                            >
                              <School className="w-3 h-3 text-slate-400" />
                              {sch}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          {assignedCount} Assigned
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-xs font-semibold text-slate-600 hover:text-[var(--brand-primary)] hover:underline"
                          >
                            Profile
                          </Link>
                          <button
                            type="button"
                            onClick={() => setUserToEdit(user)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit User & Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete User"
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

      {/* New User Modal Dialog */}
      <NewUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUserAdded}
      />

      {/* Edit User Modal Dialog */}
      <EditUserModal
        user={userToEdit}
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        onSuccess={handleUserUpdated}
      />

      {/* Delete User Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        title="Delete User Profile"
        itemName={userToDelete?.name || 'this user'}
        itemType="user"
        description="Deleting this user will unenroll them and revoke access across all assigned schools."
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
