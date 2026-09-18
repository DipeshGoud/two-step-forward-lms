'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, School, Calendar, CheckCircle2, Clock, AlertCircle, Search, X, Trash2 } from 'lucide-react';
import { useAdminStore } from '@/lib/data/adminStore';
import NewAssignmentModal from '@/components/admin/NewAssignmentModal';

export default function AdminAssignmentsPage() {
  const { store, updateAssignmentStatus, deleteAssignment } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'yet_to_start' | 'in_progress' | 'completed'>('all');

  const filteredAssignments = useMemo(() => {
    return store.assignments.filter((row) => {
      const matchesSearch =
        searchQuery === '' ||
        row.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSchool =
        schoolFilter === 'all' || row.schoolId === schoolFilter || row.schoolName === schoolFilter;

      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

      return matchesSearch && matchesSchool && matchesStatus;
    });
  }, [store.assignments, searchQuery, schoolFilter, statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
              Course Assignment Matrix
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {store.assignments.length} Assignments
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Assign courses across employees and schools, establish completion targets, and track compliance.
          </p>
        </div>

        <button
          id="new-assignment-button"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200/90 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee, email, or course..."
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

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* School filter */}
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] cursor-pointer"
          >
            <option value="all">All Campuses ({store.schools.length})</option>
            {store.schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs">
            {(['all', 'yet_to_start', 'in_progress', 'completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'all'
                  ? 'All'
                  : st === 'yet_to_start'
                  ? 'Yet to Start'
                  : st === 'in_progress'
                  ? 'In Progress'
                  : 'Completed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Matrix Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                <th className="py-3 px-4 sm:px-5">Employee</th>
                <th className="py-3 px-4">Assigned Course</th>
                <th className="py-3 px-4">School Scope</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4 sm:px-5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No assignments matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5">
                      <Link
                        href={`/admin/users/${row.employeeId}`}
                        className="font-semibold text-slate-900 text-[13px] hover:text-[var(--brand-primary)] transition-colors block"
                      >
                        {row.employeeName}
                      </Link>
                      <div className="text-slate-400 mt-0.5">{row.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <Link
                        href="/admin/courses"
                        className="hover:text-[var(--brand-primary)] transition-colors"
                      >
                        {row.courseTitle}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/schools/${row.schoolId}`}
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/70 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 transition-colors"
                      >
                        <School className="w-3 h-3 text-slate-400" />
                        <span>{row.schoolName}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {row.dueDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 sm:w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.progress === 100
                                ? 'bg-emerald-500'
                                : row.progress > 0
                                ? 'bg-amber-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {row.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {row.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => updateAssignmentStatus(row.id, 'completed')}
                            className="px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200/60 transition-colors cursor-pointer"
                            title="Mark Completed (100%)"
                          >
                            Mark Done
                          </button>
                        )}
                        {row.status === 'yet_to_start' && (
                          <button
                            type="button"
                            onClick={() => updateAssignmentStatus(row.id, 'in_progress')}
                            className="px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 rounded border border-amber-200/60 transition-colors cursor-pointer"
                            title="Start Assignment (25%)"
                          >
                            Start
                          </button>
                        )}
                        {row.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => updateAssignmentStatus(row.id, 'yet_to_start')}
                            className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                            title="Reset to 0%"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteAssignment(row.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Remove Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

