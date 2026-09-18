import React from 'react';
import Link from 'next/link';
import { FileText, Clock, Star, CheckCircle2, GraduationCap, Code2, ShieldCheck, Users, Laptop, Shield } from 'lucide-react';

export interface CourseCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  thumbnailBg?: string;
  progressPercent: number;
  totalLessons: number;
  durationMinutes?: number;
  rating?: number;
  isCompleted?: boolean;
  isAdminAccess?: boolean;
}

export function CourseCard({
  id,
  title,
  thumbnailUrl,
  thumbnailBg = 'bg-slate-50',
  progressPercent,
  totalLessons,
  durationMinutes = 180,
  rating = 5.0,
  isCompleted = false,
  isAdminAccess = false,
}: CourseCardProps) {
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationString = hours > 0 ? `${hours}h:${mins.toString().padStart(2, '0')}m` : `${mins}m`;

  // Select a subtle, professional icon tailored to the course subject
  const getSubjectIcon = () => {
    const t = title.toLowerCase();
    if (t.includes('code') || t.includes('program') || t.includes('computational')) {
      return <Code2 className="w-5 h-5 text-indigo-600 stroke-[1.8]" />;
    }
    if (t.includes('safety') || t.includes('protection') || t.includes('standards')) {
      return <ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[1.8]" />;
    }
    if (t.includes('csr') || t.includes('impact') || t.includes('orientation') || t.includes('stakeholder')) {
      return <Users className="w-5 h-5 text-blue-600 stroke-[1.8]" />;
    }
    if (t.includes('digital') || t.includes('productivity') || t.includes('tooling') || t.includes('kit')) {
      return <Laptop className="w-5 h-5 text-teal-600 stroke-[1.8]" />;
    }
    return <GraduationCap className="w-5 h-5 text-indigo-600 stroke-[1.8]" />;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-xs">
      {/* Thumbnail */}
      <div className={`relative aspect-[16/10] w-full ${thumbnailBg} overflow-hidden border-b border-slate-100 flex items-center justify-center`}>
        {thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-br from-slate-50 to-slate-100/90">
            {/* Elegant soft center badge for placeholder */}
            <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200/70 flex items-center justify-center">
              {getSubjectIcon()}
            </div>
          </div>
        )}

        {/* Top-Right Category Badge matching Reference Screenshot */}
        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded bg-white text-indigo-600 flex items-center justify-center shadow-2xs border border-slate-200/60">
          <GraduationCap className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-[15px] text-slate-800 line-clamp-2 leading-snug min-h-[40px] hover:text-[var(--brand-primary)] transition-colors flex-1">
              <Link href={`/learning/courses/${id}`}>
                {title}
              </Link>
            </h3>
          </div>

          {/* Progress Section */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
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
        </div>

        {/* Footer Meta */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
  );
}
