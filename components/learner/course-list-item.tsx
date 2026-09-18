import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  Star,
  CheckCircle2,
  GraduationCap,
  Code2,
  ShieldCheck,
  Users,
  Laptop,
  ChevronRight,
  Shield,
} from 'lucide-react';

export interface CourseListItemProps {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  progressPercent: number;
  totalLessons: number;
  durationMinutes?: number;
  rating?: number;
  isCompleted?: boolean;
  isAdminAccess?: boolean;
}

export function CourseListItem({
  id,
  title,
  thumbnailUrl,
  progressPercent,
  totalLessons,
  durationMinutes = 180,
  rating = 5.0,
  isCompleted = false,
  isAdminAccess = false,
}: CourseListItemProps) {
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationString = hours > 0 ? `${hours}h:${mins.toString().padStart(2, '0')}m` : `${mins}m`;

  const getSubjectIcon = () => {
    const t = title.toLowerCase();
    if (t.includes('code') || t.includes('program') || t.includes('computational')) {
      return <Code2 className="w-4 h-4 text-indigo-600 stroke-[1.8]" />;
    }
    if (t.includes('safety') || t.includes('protection') || t.includes('standards')) {
      return <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[1.8]" />;
    }
    if (t.includes('csr') || t.includes('impact') || t.includes('orientation') || t.includes('stakeholder')) {
      return <Users className="w-4 h-4 text-blue-600 stroke-[1.8]" />;
    }
    if (t.includes('digital') || t.includes('productivity') || t.includes('tooling') || t.includes('kit')) {
      return <Laptop className="w-4 h-4 text-teal-600 stroke-[1.8]" />;
    }
    return <GraduationCap className="w-4 h-4 text-indigo-600 stroke-[1.8]" />;
  };

  return (
    <div className="group bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 transition-all hover:border-slate-300 hover:shadow-xs">
      {/* Left: Prominent Thumbnail + Title & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
        {/* Prominent Sized Thumbnail */}
        <div className="relative w-full sm:w-52 md:w-64 aspect-[16/10] shrink-0 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
          {thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-br from-slate-50 to-slate-100/90">
              <div className="w-11 h-11 rounded-full bg-white shadow-2xs border border-slate-200/70 flex items-center justify-center">
                {getSubjectIcon()}
              </div>
            </div>
          )}

          {/* Top-Right Badge */}
          <div className="absolute top-2 right-2 w-6 h-6 rounded bg-white/95 text-indigo-600 flex items-center justify-center shadow-2xs border border-slate-200/60">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title and Metadata */}
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="font-semibold text-[16px] sm:text-[17px] text-slate-800 hover:text-[var(--brand-primary)] transition-colors line-clamp-2 leading-snug">
            <Link href={`/learning/courses/${id}`}>
              {title}
            </Link>
          </h3>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-2.5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400 stroke-[1.8]" />
              {totalLessons} {totalLessons === 1 ? 'Lesson' : 'Lessons'}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 stroke-[1.8]" />
              {durationString}
            </span>

            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Progress & Action Button */}
      <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:border-slate-100 md:pl-5">
        {/* Progress Bar */}
        <div className="w-36 sm:w-48 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            {isAdminAccess ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/70 px-1.5 py-0.5 rounded">
                <Shield className="w-2.5 h-2.5 text-purple-600" /> Admin Access
              </span>
            ) : isCompleted || progressPercent === 100 ? (
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" /> Completed
              </span>
            ) : (
              <span className="text-slate-500 font-normal">Progress</span>
            )}
            <span className="font-semibold text-slate-700">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent > 0 ? 'bg-amber-500' : 'bg-transparent'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          {isCompleted || progressPercent === 100 ? (
            <Link
              href={`/learning/courses/${id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-md transition-colors cursor-pointer"
            >
              <span>Review</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          ) : progressPercent > 0 ? (
            <Link
              href={`/learning/courses/${id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3.5 py-2 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href={`/learning/courses/${id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-md transition-colors cursor-pointer"
            >
              <span>Start</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
