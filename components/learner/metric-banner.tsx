import React from 'react';
import { GraduationCap, Timer, Hourglass, CheckCircle2 } from 'lucide-react';

interface MetricBannerProps {
  totalCourses: number;
  yetToStart: number;
  inProgress: number;
  completed: number;
}

export function MetricBanner({
  totalCourses,
  yetToStart,
  inProgress,
  completed,
}: MetricBannerProps) {
  const metrics = [
    {
      label: 'Total courses',
      value: totalCourses,
      icon: GraduationCap,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50/90',
    },
    {
      label: 'Yet to Start',
      value: yetToStart,
      icon: Timer,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50/90',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Hourglass,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50/90',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50/90',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-slate-100 overflow-hidden shadow-2xs mb-6">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-3.5 px-5 py-4 hover:bg-slate-50/60 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.bgColor} ${item.iconColor}`}>
              <Icon className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-[20px] font-bold text-slate-900 leading-none">
                {item.value}
              </div>
              <div className="text-[12px] text-slate-500 font-medium mt-1">
                {item.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
