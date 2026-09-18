'use client';

import React, { useEffect } from 'react';
import { X, Award, CheckCircle2, Download, Printer } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';

interface CourseCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerName: string;
  courseTitle: string;
  completionDate?: string;
  verificationCode?: string;
}

export function CourseCertificateModal({
  isOpen,
  onClose,
  learnerName,
  courseTitle,
  completionDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
  verificationCode = 'TSF-CERT-849204',
}: CourseCertificateModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-modal-title"
      >
        {/* Top Actions Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Award className="w-4 h-4 text-amber-500" />
            <span id="cert-modal-title">Official Certificate of Completion</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-3 py-1.5 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Frame */}
        <div className="p-6 sm:p-10 bg-slate-50/50">
          <div className="bg-white border-8 border-double border-slate-200 rounded-xl p-8 sm:p-10 text-center relative shadow-sm">
            {/* Top Logo */}
            <div className="flex justify-center mb-6">
              <BrandLogo size="md" />
            </div>

            <div className="uppercase tracking-[0.25em] text-[11px] font-bold text-slate-400 mb-2">
              Certificate of Completion
            </div>

            <h2 className="text-xl sm:text-2xl font-serif text-slate-900 font-bold mb-3">
              This is to certify that
            </h2>

            <div className="text-2xl sm:text-3xl font-bold text-[var(--brand-primary)] my-3 tracking-tight font-serif underline decoration-amber-300 decoration-2 underline-offset-8">
              {learnerName}
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto my-4 leading-relaxed">
              has successfully fulfilled all curriculum requirements, instructional video sessions, and knowledge assessment checkpoints for
            </p>

            <div className="text-base sm:text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200/80 rounded-lg py-2.5 px-4 max-w-lg mx-auto mb-6">
              {courseTitle}
            </div>

            {/* Seal & Metadata Row */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-3 items-center text-left text-xs">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Date Issued</div>
                <div className="font-medium text-slate-800 mt-0.5">{completionDate}</div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-600 shadow-xs mb-1">
                  <Award className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Credential ID</div>
                <div className="font-mono text-[11px] font-semibold text-slate-700 mt-0.5">
                  {verificationCode}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
