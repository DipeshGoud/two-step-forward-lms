'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  School,
  Users,
  BookOpen,
  UserCheck,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  BarChart3,
  Calendar,
  X,
} from 'lucide-react';
import { useAdminStore } from '@/lib/data/adminStore';
import NewAssignmentModal from '@/components/admin/NewAssignmentModal';

export default function AdminDashboardPage() {
  const { store, metrics } = useAdminStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filter assignments based on search, school scope, and status
  const filteredAssignments = useMemo(() => {
    return store.assignments.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSchool =
        selectedSchool === 'ALL' || item.schoolId === selectedSchool;

      const matchesStatus =
        selectedStatus === 'ALL' || item.status === selectedStatus;

      return matchesSearch && matchesSchool && matchesStatus;
    });
  }, [store.assignments, searchQuery, selectedSchool, selectedStatus]);

  // KPI stat cards with live dynamic counts
  const stats = [
    {
      label: 'Total Schools',
      value: metrics.totalSchools,
      icon: School,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/admin/schools',
      badge: 'Active Campuses',
    },
    {
      label: 'Employees / Users',
      value: metrics.totalEmployees,
      icon: Users,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      href: '/admin/users',
      badge: 'Organization Staff',
    },
    {
      label: 'Active Courses',
      value: metrics.activeCourses,
      icon: BookOpen,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
      href: '/admin/courses',
      badge: 'Published Catalog',
    },
    {
      label: 'Course Assignments',
      value: metrics.totalAssignments,
      icon: UserCheck,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/admin/assignments',
      badge: `${metrics.completedCount} Completed`,
    },
  ];

  // Quick Action navigation cards
  const quickActions = [
    {
      title: 'Schools Management',
      description: 'Add new school branches, view campuses, and manage assigned personnel.',
      href: '/admin/schools',
      icon: School,
      cta: 'View Schools',
    },
    {
      title: 'Users & Roles',
      description: 'Manage employee directory, assign roles (Admin, Manager, Instructor), and school access.',
      href: '/admin/users',
      icon: Users,
      cta: 'Manage Users',
    },
    {
      title: 'Course Catalog',
      description: 'Create new courses, author modules, upload video/PDF content, and publish curriculum.',
      href: '/admin/courses',
      icon: BookOpen,
      cta: 'Explore Catalog',
    },
    {
      title: 'Assignment Matrix',
      description: 'Assign courses to individual employees or entire schools, and monitor completion.',
      href: '/admin/assignments',
      icon: UserCheck,
      cta: 'Manage Assignments',
    },
  ];

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
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organization overview, school operations, and curriculum assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 py-2.5 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Metric Cards - Touching Enterprise Card Row */}
      <div className="bg-white border border-slate-200/90 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-slate-100 overflow-hidden shadow-2xs">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="p-5 flex flex-col justify-between transition-colors hover:bg-slate-50/70 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.bgColor} ${item.iconColor}`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {item.badge}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-[26px] font-bold text-slate-900 leading-tight">
                  {item.value}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Organization Training Compliance & Progress Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Staff Training Compliance & Completion Rate
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live organizational progress across all campuses and active curriculum assignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl font-bold text-slate-900">
                {metrics.complianceRate}%
              </div>
              <div className="text-[11px] text-slate-400">Overall Completed</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 font-bold text-sm">
              {metrics.complianceRate}%
            </div>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{
                width: `${
                  metrics.totalAssignments > 0
                    ? (metrics.completedCount / metrics.totalAssignments) * 100
                    : 0
                }%`,
              }}
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`Completed: ${metrics.completedCount}`}
            />
            <div
              style={{
                width: `${
                  metrics.totalAssignments > 0
                    ? (metrics.inProgressCount / metrics.totalAssignments) * 100
                    : 0
                }%`,
              }}
              className="bg-amber-500 h-full transition-all duration-300"
              title={`In Progress: ${metrics.inProgressCount}`}
            />
            <div
              style={{
                width: `${
                  metrics.totalAssignments > 0
                    ? (metrics.yetToStartCount / metrics.totalAssignments) * 100
                    : 0
                }%`,
              }}
              className="bg-slate-300 h-full transition-all duration-300"
              title={`Yet to Start: ${metrics.yetToStartCount}`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Completed: <strong>{metrics.completedCount}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>In Progress: <strong>{metrics.inProgressCount}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Yet to Start: <strong>{metrics.yetToStartCount}</strong></span>
              </span>
            </div>

            <Link
              href="/admin/assignments"
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
            >
              <span>View detailed matrix</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards - Touching Enterprise Card Row */}
      <div className="bg-white border border-slate-200/90 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 overflow-hidden shadow-2xs">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="p-5 flex flex-col justify-between transition-colors hover:bg-slate-50/70 group cursor-pointer"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3.5 group-hover:bg-[var(--brand-primary)]/10 group-hover:text-[var(--brand-primary)] transition-colors">
                  <Icon className="w-4.5 h-4.5 stroke-[1.8]" />
                </div>
                <h2 className="text-[15px] font-bold text-slate-800 group-hover:text-[var(--brand-primary)] transition-colors">
                  {action.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs font-semibold text-[var(--brand-primary)]">
                <span>{action.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Interactive Recent Course Assignments Section */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        {/* Table Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-slate-900">
                Recent Course Assignments
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredAssignments.length} of {store.assignments.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking and interactive management of employee curriculum enrollments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand-primary)] hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Assign Course</span>
            </button>
            <Link
              href="/admin/assignments"
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline px-2 py-1"
            >
              View all →
            </Link>
          </div>
        </div>

        {/* Live Filter Bar */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee, email, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand-primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* School & Status Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-slate-500">
              <Filter className="w-3 h-3" />
              <span>School:</span>
            </div>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[var(--brand-primary)]"
            >
              <option value="ALL">All Schools ({store.schools.length})</option>
              {store.schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name}
                </option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Status Filter Tabs */}
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-md p-0.5">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'yet_to_start', label: 'Yet to Start' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedStatus === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {(searchQuery || selectedSchool !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSchool('ALL');
                  setSelectedStatus('ALL');
                }}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Assignments Table */}
        {filteredAssignments.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No assignments found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No course assignments match your search or filter parameters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSchool('ALL');
                setSelectedStatus('ALL');
              }}
              className="mt-3 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                  <th className="py-3 px-4 sm:px-5">Employee / User</th>
                  <th className="py-3 px-4">Assigned Course</th>
                  <th className="py-3 px-4">School Scope</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-5">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAssignments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-5">
                      <Link
                        href={`/admin/users/${row.employeeId}`}
                        className="font-semibold text-slate-900 text-[13px] hover:text-[var(--brand-primary)] transition-colors block"
                      >
                        {row.employeeName}
                      </Link>
                      <div className="text-[11px] text-slate-400 mt-0.5">{row.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <Link
                        href="/admin/courses"
                        className="hover:text-[var(--brand-primary)] transition-colors"
                      >
                        {row.courseTitle}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href="/admin/schools"
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/70 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 transition-colors"
                      >
                        <School className="w-3 h-3 text-slate-400" />
                        <span>{row.schoolName}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {row.dueDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-5">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Assignment Modal */}
      <NewAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
