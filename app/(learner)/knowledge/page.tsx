'use client';

import React, { useState } from 'react';
import { LayoutGrid, List, ChevronDown, BookOpen } from 'lucide-react';

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<'explore' | 'shared' | 'bookmarks'>('explore');

  return (
    <div>
      {/* Page Title */}
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-4">
        Manuals
      </h1>

      {/* Tabs & Controls Toolbar matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/90 mb-16 gap-3">
        <div className="flex gap-8">
          {(['explore', 'shared', 'bookmarks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[13px] font-medium capitalize transition-colors relative cursor-pointer ${
                activeTab === tab
                  ? 'text-[var(--brand-primary)] font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand-primary)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          <div className="flex items-center text-slate-400 gap-1.5">
            <LayoutGrid className="w-4 h-4 cursor-pointer hover:text-slate-600" />
            <List className="w-4 h-4 cursor-pointer hover:text-slate-600" />
          </div>

          <div className="h-3.5 w-px bg-slate-200 mx-1" />

          <button className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
            <span>Custom</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Empty State matching Screenshot 1 */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {/* Soft amber document/user illustration badge */}
        <div className="w-28 h-24 relative mb-4 flex items-center justify-center">
          <div className="w-20 h-24 rounded-lg bg-amber-100/90 border border-amber-200 flex flex-col items-center justify-center shadow-xs">
            <BookOpen className="w-8 h-8 text-amber-600 mb-1" />
            <div className="w-12 h-1 bg-amber-300 rounded-full mb-1" />
            <div className="w-8 h-1 bg-amber-300 rounded-full" />
          </div>
          <div className="absolute -bottom-2 right-1 w-10 h-10 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-amber-700 shadow-xs">
            <span className="text-[11px] font-bold">PDF</span>
          </div>
        </div>

        <h3 className="text-[15px] font-semibold text-slate-800 mt-2">
          There is nothing to view in here yet.
        </h3>
      </div>
    </div>
  );
}
