'use client';

import React from 'react';
import { LayoutGrid, List, ChevronDown, Layers } from 'lucide-react';

export default function SpacesPage() {
  return (
    <div>
      {/* Page Title */}
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-4">
        Spaces
      </h1>

      {/* Tabs & Controls Toolbar matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/90 mb-16 gap-3">
        <div className="flex gap-8">
          <button
            className="pb-3 text-[13px] font-semibold text-[var(--brand-primary)] relative cursor-pointer"
          >
            All Spaces
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand-primary)]" />
          </button>
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

      {/* Empty State matching Screenshot 3 */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
          <Layers className="w-9 h-9 stroke-[1.5]" />
        </div>
        <h3 className="text-[15px] font-semibold text-slate-800">
          There is nothing to view in here yet.
        </h3>
      </div>
    </div>
  );
}
