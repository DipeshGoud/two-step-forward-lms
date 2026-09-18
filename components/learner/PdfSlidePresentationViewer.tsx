'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  AlertCircle,
  MoveHorizontal,
  Maximize,
  X,
} from 'lucide-react';

interface PdfViewport {
  width: number;
  height: number;
}

interface PdfRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

interface PdfPage {
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => PdfRenderTask;
}

interface PdfDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
}

interface PdfLoadingTask {
  promise: Promise<PdfDocument>;
}

interface PdfJsLibrary {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (source: string | { data: Uint8Array }) => PdfLoadingTask;
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLibrary;
  }
}

interface PdfSlidePresentationViewerProps {
  lesson: {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    keyTakeaways?: string[];
    durationMinutes: number;
  };
  courseTitle: string;
}

export default function PdfSlidePresentationViewer({
  lesson,
  courseTitle,
}: PdfSlidePresentationViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [fitMode, setFitMode] = useState<'width' | 'page'>('width');
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null);
  const [isPdfError, setIsPdfError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const viewerWrapperRef = useRef<HTMLDivElement>(null);
  const currentRenderTaskRef = useRef<PdfRenderTask | null>(null);

  // 1. Dynamically load PDF.js from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.pdfjsLib) {
      queueMicrotask(() => setIsPdfReady(true));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const pdfjsLib = window.pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setIsPdfReady(true);
      }
    };
    script.onerror = () => setIsPdfReady(false);
    document.head.appendChild(script);
  }, []);

  // 2. Load PDF document
  const loadPdf = useCallback(() => {
    const fileUrl = lesson.fileUrl;
    if (!fileUrl || !isPdfReady) {
      setTotalPages(5);
      setCurrentPage(1);
      setPageInput('1');
      setPdfDoc(null);
      setIsPdfError(false);
      return;
    }

    const isPdfCandidate =
      lesson.type === 'pdf' ||
      fileUrl.startsWith('data:application/pdf') ||
      fileUrl.toLowerCase().includes('.pdf') ||
      fileUrl.toLowerCase().includes('application/pdf');

    if (!isPdfCandidate) {
      setTotalPages(5);
      setCurrentPage(1);
      setPageInput('1');
      setPdfDoc(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDoc(true);
    setIsPdfError(false);

    const loadPdfDoc = async () => {
      try {
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) return;
        let loadingTask: PdfLoadingTask;
        if (fileUrl.startsWith('data:application/pdf;base64,')) {
          const base64 = fileUrl.split(',')[1];
          const binaryStr = window.atob(base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else {
          loadingTask = pdfjsLib.getDocument(fileUrl);
        }
        const pdf = await loadingTask.promise;
        if (!isMounted) return;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages || 1);
        setCurrentPage(1);
        setPageInput('1');
      } catch (err) {
        if (isMounted) {
          console.error('Error loading PDF:', err);
          setIsPdfError(true);
        }
      } finally {
        if (isMounted) setIsLoadingDoc(false);
      }
    };

    loadPdfDoc();
    return () => {
      isMounted = false;
    };
  }, [lesson.fileUrl, lesson.type, isPdfReady]);

  useEffect(() => {
    // PDF.js loading updates state as an external document resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPdf();
  }, [loadPdf]);

  // Sync page input when page changes
  useEffect(() => {
    // Keep the editable page field aligned with navigation state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageInput(String(currentPage));
  }, [currentPage]);

  // 3. Render Canvas Page
  const renderCurrentPage = useCallback(async () => {
    const canvas = canvasRef.current;
    const stage = stageContainerRef.current;
    if (!canvas || !stage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Available stage dimensions
    const containerWidth = stage.clientWidth || 960;
    const containerHeight = stage.clientHeight || 600;

    // A) If real PDF loaded via PDF.js
    if (pdfDoc) {
      try {
        if (currentRenderTaskRef.current) {
          currentRenderTaskRef.current.cancel();
          currentRenderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(currentPage);
        const unscaledViewport = page.getViewport({ scale: 1 });

        // Calculate scaling
        const paddingHorizontal = 48;
        const paddingVertical = 48;
        const availW = Math.max(320, containerWidth - paddingHorizontal);
        const availH = Math.max(320, containerHeight - paddingVertical);

        let baseScale = 1;
        if (fitMode === 'width') {
          // Fit to width: document fills readable width
          baseScale = availW / unscaledViewport.width;
          // Clamp ultra-wide screens unless zoomed
          if (containerWidth > 1400) {
            baseScale = Math.min(baseScale, 1200 / unscaledViewport.width);
          }
        } else {
          // Fit to page: entire document visible without scrolling
          const scaleX = availW / unscaledViewport.width;
          const scaleY = availH / unscaledViewport.height;
          baseScale = Math.min(scaleX, scaleY);
        }

        const effectiveScale = baseScale * (zoomPercent / 100);
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const renderScale = effectiveScale * dpr;

        const viewport = page.getViewport({ scale: renderScale });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const cssWidth = Math.floor(viewport.width / dpr);
        const cssHeight = Math.floor(viewport.height / dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        currentRenderTaskRef.current = task;
        await task.promise;
      } catch (err: unknown) {
        const errorName = typeof err === 'object' && err !== null && 'name' in err ? String(err.name) : '';
        if (errorName !== 'RenderingCancelledException') {
          console.error('Render error:', err);
        }
      }
    } else {
      // B) Fallback pristine curriculum document rendering on canvas
      const unscaledWidth = 792; // standard letter width @ 72 dpi (8.5 x 11)
      const unscaledHeight = 1024;

      const paddingHorizontal = 48;
      const paddingVertical = 48;
      const availW = Math.max(320, containerWidth - paddingHorizontal);
      const availH = Math.max(320, containerHeight - paddingVertical);

      let baseScale = 1;
      if (fitMode === 'width') {
        baseScale = availW / unscaledWidth;
        if (containerWidth > 1400) {
          baseScale = Math.min(baseScale, 1100 / unscaledWidth);
        }
      } else {
        const scaleX = availW / unscaledWidth;
        const scaleY = availH / unscaledHeight;
        baseScale = Math.min(scaleX, scaleY);
      }

      const effectiveScale = baseScale * (zoomPercent / 100);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const renderScale = effectiveScale * dpr;

      const renderWidth = Math.floor(unscaledWidth * renderScale);
      const renderHeight = Math.floor(unscaledHeight * renderScale);

      canvas.width = renderWidth;
      canvas.height = renderHeight;

      const cssWidth = Math.floor(unscaledWidth * effectiveScale);
      const cssHeight = Math.floor(unscaledHeight * effectiveScale);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      // Draw high-resolution document page
      ctx.save();
      ctx.scale(renderScale, renderScale);

      // Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, unscaledWidth, unscaledHeight);

      // Header top line
      ctx.fillStyle = '#7C3AED';
      ctx.fillRect(40, 36, unscaledWidth - 80, 3);

      // TwoStep Forward branding header
      ctx.fillStyle = '#4C1D95';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('TwoStep Forward • Institutional Curriculum Document', 40, 64);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`Course: ${courseTitle} | Reference Standard: ISO-LMS-2026`, 40, 80);

      // Document Title
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 24px Inter, sans-serif';
      const cleanTitle = lesson.title.replace(/^Session\s*\d+:\s*/i, '');
      ctx.fillText(`${cleanTitle} — Page ${currentPage}`, 40, 130);

      // Subtitle / Module
      ctx.fillStyle = '#6D28D9';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('OFFICIAL OPERATIONAL STANDARD & TRAINING PROTOCOL', 40, 154);

      // Divider
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 170);
      ctx.lineTo(unscaledWidth - 40, 170);
      ctx.stroke();

      // Content blocks depending on current page
      const contentByPage: Record<number, { heading: string; paras: string[]; takeaways: string[] }> = {
        1: {
          heading: '1. Foundational Standard Operating Framework',
          paras: [
            lesson.summary ||
              'This curriculum module establishes standard practices, compliance benchmarks, and institutional responsibilities for educators and operational personnel.',
            lesson.content ||
              'All personnel are required to complete instructional reviews, daily observational audits, and verification logs. Consistent application of these practices guarantees safe, high-performing educational environments.',
            'Adherence to early detection markers and preventive reporting safeguards institutional trust while enabling swift, cross-departmental collaboration across all campuses.',
          ],
          takeaways: [
            'Mandatory daily verification routines and supervisory oversight logs.',
            'Clear statutory reporting channels and escalation matrices.',
            'Continuous documentation compliance verified per operational shift.',
          ],
        },
        2: {
          heading: '2. Standard Operating Procedures & Verification Checklists',
          paras: [
            'Operational workflows must be executed in accordance with documented protocols. Shift leads must review daily checklists before session commencement and log completed checklists in the LMS audit portal.',
            'Any procedural anomaly, equipment defect, or compliance variance must be logged immediately. Delayed reporting exceeding shift conclusion constitutes non-compliance.',
          ],
          takeaways: [
            'Pre-session safety inspections and facility readiness confirmation.',
            'Real-time discrepancy escalation to designated branch leads.',
          ],
        },
        3: {
          heading: '3. Incident Management & Escalation Pathways',
          paras: [
            'When an incident is identified, immediate protective measures take priority. Staff must secure the environment, attend to personnel, and initiate formal documentation.',
            'Direct escalation to the Designated Safety Officer and School Authority must occur within designated reporting timeframes. Public disclosures or informal discussions are strictly prohibited.',
          ],
          takeaways: [
            'Immediate containment and safety stabilization protocols.',
            'Formal administrative notification timeline within 60 minutes.',
          ],
        },
        4: {
          heading: '4. Case Studies & Scenario Application Review',
          paras: [
            'Scenario analysis demonstrates practical application of guidelines during ambiguous campus situations. Staff are evaluated on decision-making speed, compliance rigor, and stakeholder empathy.',
            'Review historical case documentation to understand how preventive audits prevented compliance failures across partner institutions.',
          ],
          takeaways: [
            'Objective observational logging vs subjective assumption.',
            'Inter-departmental alignment during emergency resolution drills.',
          ],
        },
        5: {
          heading: '5. Assessment Evaluation & Checkpoint Readiness',
          paras: [
            'Upon completing all five sections of this document, proceed to the knowledge checkpoint quiz. Mastery of these operational rules certifies readiness for autonomous duty.',
            'Verify all required reading items and sign off on completion within the learner dashboard.',
          ],
          takeaways: [
            'Minimum 60% passing benchmark on evaluation assessments.',
            'Automatic progress synchronization upon checkpoint validation.',
          ],
        },
      };

      const pageData = contentByPage[currentPage] || contentByPage[1];

      // Section Heading
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(pageData.heading, 40, 210);

      // Paragraphs
      let y = 240;
      ctx.fillStyle = '#334155';
      ctx.font = '13px Inter, sans-serif';

      pageData.paras.forEach((para) => {
        const words = para.split(' ');
        let line = '';
        const maxLineWidth = unscaledWidth - 80;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxLineWidth && n > 0) {
            ctx.fillText(line, 40, y);
            line = words[n] + ' ';
            y += 22;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 40, y);
        y += 34;
      });

      // Key Points Box
      y += 10;
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(40, y, unscaledWidth - 80, 180, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4C1D95';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('CRITICAL COMPLIANCE TAKEAWAYS', 56, y + 28);

      let takeawayY = y + 54;
      pageData.takeaways.forEach((pt) => {
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('✓', 56, takeawayY);

        ctx.fillStyle = '#1E293B';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(pt, 76, takeawayY);
        takeawayY += 28;
      });

      // Document Footer
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('TwoStep Forward • Confidential & Proprietary Training Material', 40, unscaledHeight - 36);
      ctx.fillText(`Page ${currentPage} of ${totalPages}`, unscaledWidth - 110, unscaledHeight - 36);

      ctx.restore();
    }
  }, [pdfDoc, currentPage, fitMode, zoomPercent, totalPages, lesson, courseTitle]);

  // Trigger render when state changes
  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Window resize handler with debounce
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        renderCurrentPage();
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [renderCurrentPage]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage((p) => (p < totalPages ? p + 1 : p));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((p) => (p > 1 ? p - 1 : p));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomPercent((z) => Math.min(250, z + 25));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoomPercent((z) => Math.max(50, z - 25));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [totalPages]);

  // Actions
  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setCurrentPage(val);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleToggleFullscreen = async () => {
    if (!viewerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await viewerWrapperRef.current.requestFullscreen();
      } catch (err) {
        console.error('Fullscreen failed:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Exit fullscreen failed:', err);
      }
    }
  };

  const handleDownload = () => {
    if (lesson.fileUrl) {
      const a = document.createElement('a');
      a.href = lesson.fileUrl;
      a.download = lesson.fileName || `${lesson.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (canvasRef.current) {
      const a = document.createElement('a');
      a.href = canvasRef.current.toDataURL('image/png');
      a.download = `${lesson.title.replace(/\s+/g, '_')}_page_${currentPage}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      ref={viewerWrapperRef}
      className={`w-full h-full flex flex-col bg-[#EBECEF] overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative flex-1'
      }`}
    >
      {/* Fullscreen Header Bar */}
      {isFullscreen && (
        <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-6 h-6 rounded bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
              2S
            </span>
            <span className="text-xs font-bold truncate">
              {courseTitle} <span className="text-slate-400 font-normal">• {lesson.title}</span>
            </span>
          </div>
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Exit Fullscreen (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Document Stage with Natural Vertical Scrolling */}
      <div
        ref={stageContainerRef}
        className="flex-1 w-full min-h-0 overflow-auto bg-[#EBECEF] flex flex-col items-center p-3 sm:p-6"
      >
        {isLoadingDoc ? (
          <div className="my-auto flex flex-col items-center justify-center gap-3 text-slate-600 p-8">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-600">Loading document...</span>
          </div>
        ) : isPdfError ? (
          <div className="my-auto flex flex-col items-center justify-center gap-3 bg-white rounded-xl border border-slate-200 p-8 text-center max-w-sm shadow-xs">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900">Unable to load this document.</h3>
            <p className="text-xs text-slate-500">The PDF could not be rendered. Check network or file integrity.</p>
            <button
              onClick={loadPdf}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : (
          <div className="my-auto flex flex-col items-center py-2 transition-all duration-150">
            <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-slate-300/80 rounded-xs transition-shadow">
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL DOCUMENT VIEWER TOOLBAR                                      */}
      {/* Format: [‹ Page 1 of 10 ›]  |  [Fit Width] [Fit Page]  |  [-] 100% [+]  ⛶ ⤓*/}
      {/* ========================================================================= */}
      <div className="h-12 bg-white border-t border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 shadow-2xs z-10">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 text-xs text-slate-600 font-medium">
            <span>Page</span>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => setPageInput(String(currentPage))}
              className="w-10 h-7 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-purple-600"
            />
            <span>of {totalPages}</span>
          </form>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Fit Modes & Zoom Controls */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Fit to Width & Fit to Page Buttons */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setFitMode('width')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                fitMode === 'width' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fit to Width"
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
              <span>Fit Width</span>
            </button>
            <button
              type="button"
              onClick={() => setFitMode('page')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                fitMode === 'page' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fit to Page"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span>Fit Page</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.max(50, z - 25))}
              disabled={zoomPercent <= 50}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <select
              value={zoomPercent}
              onChange={(e) => setZoomPercent(Number(e.target.value))}
              className="h-7 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={125}>125%</option>
              <option value={150}>150%</option>
              <option value={200}>200%</option>
            </select>

            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.min(250, z + 25))}
              disabled={zoomPercent >= 250}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Fullscreen & Download */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (⛶)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Download Document"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
