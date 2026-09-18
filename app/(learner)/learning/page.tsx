'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Search,
  X,
  BookOpen,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { MetricBanner } from '@/components/learner/metric-banner';
import { CourseCard } from '@/components/learner/course-card';
import { CourseListItem } from '@/components/learner/course-list-item';
import { useAdminStore, AdminCourse, isUserAdmin } from '@/lib/data/adminStore';

export default function LearningPage() {
  const { store, isHydrated } = useAdminStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'yet_to_start' | 'in_progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress' | 'rating'>('recent');

  const activeUserId = store.currentUserId;

  // Active learner details
  const activeLearner = useMemo(
    () => store.users.find((u) => u.id === activeUserId) || store.users[0],
    [store.users, activeUserId]
  );

  const isAdmin = isUserAdmin(activeLearner?.role);

  // Learner assignments strictly from dashboard
  const learnerAssignments = useMemo(() => {
    return store.assignments.filter(
      (a) =>
        activeLearner &&
        (a.employeeId === activeLearner.id ||
          a.employeeName.toLowerCase() === activeLearner.name.toLowerCase())
    );
  }, [store.assignments, activeLearner]);

  // STRICT REQUIREMENT:
  // - Admins do NOT need course assignments — they can access ANY course in the LMS!
  // - Non-admin learners can ONLY see courses assigned to them via the dashboard.
  const assignedCourses = useMemo(() => {
    let list: Array<
      AdminCourse & {
        progressPercent: number;
        isCompleted: boolean;
        isAdminAccess?: boolean;
      }
    >;

    if (isAdmin) {
      list = store.courses.map((course) => {
        const foundAssignment = store.assignments.find(
          (a) =>
            (a.employeeId === activeLearner?.id ||
              a.employeeName.toLowerCase() === activeLearner?.name.toLowerCase()) &&
            a.courseId === course.id
        );

        return {
          id: course.id,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          totalLessons: course.totalLessons,
          durationMinutes: course.durationMinutes,
          rating: course.rating,
          isPublished: course.isPublished,
          enrolledCount: course.enrolledCount,
          progressPercent: foundAssignment ? foundAssignment.progress : 0,
          isCompleted: foundAssignment
            ? foundAssignment.status === 'completed' || foundAssignment.progress === 100
            : false,
          isAdminAccess: !foundAssignment,
        };
      });
    } else {
      list = learnerAssignments.map((assignment) => {
        const foundCourse = store.courses.find((c) => c.id === assignment.courseId);
        return {
          id: assignment.courseId,
          title: assignment.courseTitle,
          thumbnailUrl: foundCourse?.thumbnailUrl || null,
          totalLessons: foundCourse?.totalLessons || 4,
          durationMinutes: foundCourse?.durationMinutes || 180,
          rating: foundCourse?.rating || 5.0,
          isPublished: foundCourse ? foundCourse.isPublished : true,
          enrolledCount: foundCourse ? foundCourse.enrolledCount : 1,
          progressPercent: assignment.progress,
          isCompleted: assignment.status === 'completed' || assignment.progress === 100,
          isAdminAccess: false,
        };
      });
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }

    // Apply Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        list = list.filter((c) => c.isCompleted);
      } else if (statusFilter === 'in_progress') {
        list = list.filter((c) => !c.isCompleted && c.progressPercent > 0);
      } else if (statusFilter === 'yet_to_start') {
        list = list.filter((c) => c.progressPercent === 0);
      }
    }

    // Apply Sorting
    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'progress') return b.progressPercent - a.progressPercent;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // 'recent'
    });

    return list;
  }, [isAdmin, activeLearner, store.courses, store.assignments, learnerAssignments, searchQuery, statusFilter, sortBy]);

  // Live Metrics
  const totalCourses = isAdmin ? store.courses.length : learnerAssignments.length;
  const yetToStart = isAdmin
    ? assignedCourses.filter((c) => c.progressPercent === 0).length
    : learnerAssignments.filter((a) => a.status === 'yet_to_start' || a.progress === 0).length;
  const inProgress = isAdmin
    ? assignedCourses.filter((c) => c.progressPercent > 0 && c.progressPercent < 100).length
    : learnerAssignments.filter((a) => a.status === 'in_progress' || (a.progress > 0 && a.progress < 100)).length;
  const completed = isAdmin
    ? assignedCourses.filter((c) => c.isCompleted || c.progressPercent === 100).length
    : learnerAssignments.filter((a) => a.status === 'completed' || a.progress === 100).length;

  if (!isHydrated) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading your learning space...</div>;
  }

  if (!activeLearner) {
    return <div className="py-16 text-center text-sm text-slate-500">Your learner profile could not be loaded.</div>;
  }

  return (
    <div>
      {/* Top Header & Learner Profile Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          {isAdmin ? (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
                  All Courses (Admin Full Access)
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center gap-1 shadow-2xs">
                  <Shield className="w-3 h-3 text-purple-600" />
                  {totalCourses} Courses Unlocked
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Administrator access enabled: You have unrestricted access to all courses in the TwoStep Forward curriculum without requiring individual assignments.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
                  My Assigned Courses
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {totalCourses} Assigned
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Courses officially assigned to your employee account by administrators from the management dashboard.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200/90 px-3 py-1.5 rounded-lg shadow-2xs self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Signed in as:</span>
          <span className="text-xs font-semibold text-slate-800">{activeLearner.name}</span>
        </div>
      </div>

      {/* Toolbar with Search, Status, Sort & Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
        {isAdmin ? (
          <div className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200/70 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Admin Privileges: All courses available without assignment</span>
          </div>
        ) : (
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Restricted to your assigned curriculum</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assigned courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 sm:w-56 bg-white text-xs pl-8 pr-6 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'yet_to_start' | 'in_progress' | 'completed')
              }
              className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="yet_to_start">Yet to Start</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'recent' | 'title' | 'progress' | 'rating')
              }
              className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="title">Title (A-Z)</option>
              <option value="progress">Progress %</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'text-indigo-600 bg-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'text-indigo-600 bg-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label="List view"
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Refined Statistics Cards */}
      <MetricBanner
        totalCourses={totalCourses}
        yetToStart={yetToStart}
        inProgress={inProgress}
        completed={completed}
      />

      {/* Empty State: When no courses are assigned to this employee by the dashboard */}
      {assignedCourses.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center shadow-2xs max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">
            {isAdmin ? 'No Courses Available' : 'No Courses Assigned Yet'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {searchQuery || statusFilter !== 'all'
              ? 'No courses match your current search or filter criteria.'
              : isAdmin
              ? 'There are currently no courses in the LMS curriculum. Create and publish new courses from the Admin Course Management panel.'
              : `Your administrator has not assigned any courses to ${activeLearner.name} yet. When courses are assigned from the management dashboard, they will automatically appear here.`}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Course Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
          {assignedCourses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              thumbnailUrl={course.thumbnailUrl}
              progressPercent={course.progressPercent}
              totalLessons={course.totalLessons}
              durationMinutes={course.durationMinutes}
              rating={course.rating}
              isCompleted={course.isCompleted}
              isAdminAccess={course.isAdminAccess}
            />
          ))}
        </div>
      ) : (
        /* Course List */
        <div className="flex flex-col gap-3">
          {assignedCourses.map((course) => (
            <CourseListItem
              key={course.id}
              id={course.id}
              title={course.title}
              thumbnailUrl={course.thumbnailUrl}
              progressPercent={course.progressPercent}
              totalLessons={course.totalLessons}
              durationMinutes={course.durationMinutes}
              rating={course.rating}
              isCompleted={course.isCompleted}
              isAdminAccess={course.isAdminAccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}
