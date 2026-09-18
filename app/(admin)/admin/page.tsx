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
  AlertTriangle,
  Search,
  BarChart3,
  Calendar,
  X,
  MapPin,
  Globe,
} from 'lucide-react';
import { useAdminStore } from '@/lib/data/adminStore';
import NewAssignmentModal from '@/components/admin/NewAssignmentModal';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

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

  // Truly recent: newest assigned first, capped for the dashboard view
  const recentAssignments = useMemo(() => {
    return [...filteredAssignments]
      .sort((a, b) => new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime())
      .slice(0, 8);
  }, [filteredAssignments]);

  // Campus overview: enrollment + completion per school
  const campusOverview = useMemo(() => {
    return [...store.schools]
      .map((school) => {
        const schoolAssignments = store.assignments.filter((a) => a.schoolId === school.id);
        const completed = schoolAssignments.filter((a) => a.status === 'completed').length;
        return {
          ...school,
          assignmentCount: schoolAssignments.length,
          completionRate:
            schoolAssignments.length > 0
              ? Math.round((completed / schoolAssignments.length) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.activeEmployees - a.activeEmployees)
      .slice(0, 4);
  }, [store.schools, store.assignments]);

  // Most enrolled courses
  const topCourses = useMemo(() => {
    return [...store.courses]
      .sort((a, b) => b.enrolledCount - a.enrolledCount)
      .slice(0, 4);
  }, [store.courses]);

  // KPI stat cards
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
      description: 'Add campuses and manage assigned personnel.',
      href: '/admin/schools',
      icon: School,
      cta: 'View Schools',
    },
    {
      title: 'Users & Roles',
      description: 'Manage staff, roles, and school access.',
      href: '/admin/users',
      icon: Users,
      cta: 'Manage Users',
    },
    {
      title: 'Course Catalog',
      description: 'Author modules, upload content, publish.',
      href: '/admin/courses',
      icon: BookOpen,
      cta: 'Explore Catalog',
    },
    {
      title: 'Assignment Matrix',
      description: 'Assign courses and monitor completion.',
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

  const completedPercent =
    metrics.totalAssignments > 0
      ? Math.round((metrics.completedCount / metrics.totalAssignments) * 100)
      : 0;
  const inProgressPercent =
    metrics.totalAssignments > 0
      ? Math.round((metrics.inProgressCount / metrics.totalAssignments) * 100)
      : 0;
  const yetToStartPercent =
    metrics.totalAssignments > 0
      ? Math.max(0, 100 - completedPercent - inProgressPercent)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organization overview, school operations, and curriculum assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Dynamic KPI Metric Cards */}
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

      {/* Main Grid: Activity + Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Training Compliance Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Training Compliance
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Progress across all campuses and active assignments.
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-3xl font-bold text-slate-900 leading-none">
                  {completedPercent}
                  <span className="text-base text-slate-400 font-semibold">%</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">completion rate</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${completedPercent}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    title={`Completed: ${metrics.completedCount}`}
                  />
                  <div
                    style={{ width: `${inProgressPercent}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                    title={`In Progress: ${metrics.inProgressCount}`}
                  />
                  <div
                    style={{ width: `${yetToStartPercent}%` }}
                    className="bg-slate-300 h-full transition-all duration-300"
                    title={`Yet to Start: ${metrics.yetToStartCount}`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 shrink-0 tabular-nums">
                  {metrics.completedCount}/{metrics.totalAssignments}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Completed <strong className="tabular-nums">{metrics.completedCount}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>In Progress <strong className="tabular-nums">{metrics.inProgressCount}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span>Yet to Start <strong className="tabular-nums">{metrics.yetToStartCount}</strong></span>
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

          {/* Recent Course Assignments */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-bold text-slate-900">
                    Recent Assignments
                  </h2>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {filteredAssignments.length} of {store.assignments.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest enrollments, newest first.
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

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                >
                  <option value="ALL">All Schools ({store.schools.length})</option>
                  {store.schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name}
                    </option>
                  ))}
                </select>

                <div className="inline-flex items-center bg-white border border-slate-200 rounded-md p-0.5">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'yet_to_start', label: 'Yet to Start' },
                    { id: 'in_progress', label: 'In Progress' },
                    { id: 'completed', label: 'Done' },
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
            {recentAssignments.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {store.assignments.length === 0 ? 'No assignments yet' : 'No assignments found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {store.assignments.length === 0
                    ? 'Assign your first course to get compliance tracking started.'
                    : 'No course assignments match your search or filter parameters.'}
                </p>
                {store.assignments.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create first assignment
                  </button>
                ) : (
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
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-medium">
                      <th className="py-3 px-4 sm:px-5">Employee / User</th>
                      <th className="py-3 px-4">Assigned Course</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 sm:px-5">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentAssignments.map((row) => {
                      const remaining = daysUntil(row.dueDate);
                      const isOverdue = remaining !== null && remaining < 0 && row.status !== 'completed';
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 sm:px-5">
                            <Link
                              href={`/admin/users/${row.employeeId}`}
                              className="font-semibold text-slate-900 text-[13px] hover:text-[var(--brand-primary)] transition-colors block"
                            >
                              {row.employeeName}
                            </Link>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">{row.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            <Link
                              href="/admin/courses"
                              className="hover:text-[var(--brand-primary)] transition-colors"
                            >
                              {row.courseTitle}
                            </Link>
                            <div className="mt-0.5">
                              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-600">
                                <School className="w-3 h-3 text-slate-400" />
                                <span>{row.schoolName}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 text-[11px] ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                              <Calendar className={`w-3 h-3 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`} />
                              {formatDate(row.dueDate)}
                            </span>
                            {isOverdue && (
                              <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Overdue
                              </span>
                            )}
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
                              <span className="font-semibold text-slate-700 text-[11px] tabular-nums">
                                {row.progress}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Campus Overview */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Campus Overview</h2>
              <Link href="/admin/schools" className="text-[11px] font-semibold text-[var(--brand-primary)] hover:underline">
                All schools
              </Link>
            </div>
            {campusOverview.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <School className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">No campuses yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {campusOverview.map((campus) => (
                  <Link
                    key={campus.id}
                    href={`/admin/schools/${campus.id}`}
                    className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors block cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-bold text-slate-800 truncate">
                          {campus.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {campus.code || '—'}
                          </span>
                          <span>{campus.activeEmployees} staff</span>
                          <span>{campus.assignmentCount} assignments</span>
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold tabular-nums shrink-0 ${
                          campus.completionRate >= 70
                            ? 'text-emerald-600'
                            : campus.completionRate > 0
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {campus.completionRate}%
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          campus.completionRate >= 70
                            ? 'bg-emerald-500'
                            : campus.completionRate > 0
                            ? 'bg-amber-500'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${campus.completionRate}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Courses */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Top Courses</h2>
              <Link href="/admin/courses" className="text-[11px] font-semibold text-[var(--brand-primary)] hover:underline">
                Full catalog
              </Link>
            </div>
            {topCourses.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400">No courses yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topCourses.map((course, index) => (
                  <div key={course.id} className="px-5 py-3 flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        index === 0
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-semibold text-slate-800 truncate">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{course.enrolledCount} enrolled</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Globe className={`w-2.5 h-2.5 ${course.isPublished ? 'text-emerald-500' : 'text-slate-300'}`} />
                          {course.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions — full-width bottom strip balances the two columns */}
      <div className="bg-white border border-slate-200/90 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden shadow-2xs">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="p-4 flex items-center gap-3.5 hover:bg-slate-50/70 group cursor-pointer transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-[var(--brand-primary)]/10 group-hover:text-[var(--brand-primary)] transition-colors">
                <Icon className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-bold text-slate-800 group-hover:text-[var(--brand-primary)] transition-colors">
                  {action.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--brand-primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* New Assignment Modal */}
      <NewAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
