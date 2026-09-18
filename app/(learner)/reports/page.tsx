import React from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div>
      {/* Page Title */}
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-8">
        Reports Dashboard
      </h1>

      {/* Reports Cards Grid matching Screenshot 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Link href="/reports" className="block group">
          <div className="bg-white border border-slate-200/90 rounded-lg p-6 transition-all hover:border-slate-300 hover:shadow-xs min-h-[220px] flex flex-col justify-start">
            <div className="w-12 h-12 rounded-lg bg-indigo-50/70 flex items-center justify-center text-indigo-600 mb-4">
              <BarChart3 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800 group-hover:text-[var(--brand-primary)] transition-colors">
              My Reports
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Get detailed reports of your progress and performance in the courses you&apos;ve enrolled in.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
