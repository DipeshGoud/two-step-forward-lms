'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Play,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  useAdminStore,
  AdminCourse,
  CourseModule,
  CourseLesson,
  CourseLessonType,
} from '@/lib/data/adminStore';
import { uploadLessonMedia, deleteStorageFile, deleteStorageFiles } from '@/lib/supabase/storage';

interface CourseCurriculumBuilderModalProps {
  course?: AdminCourse | null; // If provided, we edit this course; if null, create a new one
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (course: AdminCourse) => void;
}

export default function CourseCurriculumBuilderModal({
  course,
  isOpen,
  onClose,
  onSuccess,
}: CourseCurriculumBuilderModalProps) {
  const { saveCourseWithCurriculum } = useAdminStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});
  const [uploadingLessonIds, setUploadingLessonIds] = useState<Record<string, boolean>>({});
  const newlyUploadedUrlsRef = useRef<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Close and purge any uncommitted file uploads from Supabase cloud storage
  const handleCancelAndClose = async () => {
    if (newlyUploadedUrlsRef.current.size > 0) {
      const pendingUrls = Array.from(newlyUploadedUrlsRef.current);
      newlyUploadedUrlsRef.current.clear();
      deleteStorageFiles(pendingUrls).catch((err) =>
        console.warn('Failed to clean up pending uploads on modal cancel:', err)
      );
    }
    onClose();
  };

  // Populate data whenever modal opens or course changes
  useEffect(() => {
    if (isOpen) {
      if (course) {
        setTitle(course.title || '');
        setDescription(course.description || '');
        setIsPublished(course.isPublished !== undefined ? course.isPublished : true);

        if (course.modules && course.modules.length > 0) {
          setModules(JSON.parse(JSON.stringify(course.modules)));
          const expanded: Record<string, boolean> = {};
          course.modules.forEach((m) => {
            expanded[m.id] = true;
          });
          setExpandedModuleIds(expanded);
        } else {
          setModules([]);
          setExpandedModuleIds({});
        }
      } else {
        // Brand new course: start completely empty without any prefilled text or mock modules
        setTitle('');
        setDescription('');
        setIsPublished(true);
        setModules([]);
        setExpandedModuleIds({});
      }
      newlyUploadedUrlsRef.current.clear();
      setUploadingLessonIds({});
      setError(null);
    }
  }, [isOpen, course]);

  // Keyboard shortcut to close on Escape with cloud cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancelAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Aggregate stats
  const totalLessonsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalDurationMinutes = modules.reduce(
    (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + (Number(l.durationMinutes) || 0), 0),
    0
  );

  // Module actions
  const handleAddModule = () => {
    const newModId = `mod-${Date.now()}`;
    const newMod: CourseModule = {
      id: newModId,
      title: '',
      lessons: [
        {
          id: `les-${Date.now()}-1`,
          title: '',
          durationMinutes: 15,
          type: 'video',
          summary: '',
          keyTakeaways: [],
        },
      ],
    };
    setModules((prev) => [...prev, newMod]);
    setExpandedModuleIds((prev) => ({ ...prev, [newModId]: true }));
  };

  const handleRemoveModule = (modId: string) => {
    const target = modules.find((m) => m.id === modId);
    if (target) {
      const urls = target.lessons.map((l) => l.fileUrl).filter((u): u is string => Boolean(u));
      if (urls.length > 0) {
        urls.forEach((u) => newlyUploadedUrlsRef.current.delete(u));
        deleteStorageFiles(urls).catch((err) => console.warn('Cloud delete error:', err));
      }
    }
    setModules((prev) => prev.filter((m) => m.id !== modId));
  };

  const handleUpdateModuleTitle = (modId: string, newTitle: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === modId ? { ...m, title: newTitle } : m))
    );
  };

  const toggleModuleExpand = (modId: string) => {
    setExpandedModuleIds((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Lesson actions inside a module
  const handleAddLesson = (modId: string) => {
    const newLesson: CourseLesson = {
      id: `les-${Date.now()}`,
      title: '',
      durationMinutes: 15,
      type: 'video',
      summary: '',
      keyTakeaways: [],
    };

    setModules((prev) =>
      prev.map((m) =>
        m.id === modId ? { ...m, lessons: [...m.lessons, newLesson] } : m
      )
    );
  };

  const handleRemoveLesson = (modId: string, lessonId: string) => {
    const targetModule = modules.find((m) => m.id === modId);
    const targetLesson = targetModule?.lessons.find((l) => l.id === lessonId);
    if (targetLesson?.fileUrl) {
      newlyUploadedUrlsRef.current.delete(targetLesson.fileUrl);
      deleteStorageFile(targetLesson.fileUrl).catch((err) => console.warn('Cloud delete error:', err));
    }
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.filter((l) => l.id !== lessonId),
        };
      })
    );
  };

  const handleRemoveAttachment = async (modId: string, lessonId: string, fileUrl?: string) => {
    let targetUrl = fileUrl;
    if (!targetUrl) {
      const targetMod = modules.find((m) => m.id === modId);
      const targetLes = targetMod?.lessons.find((l) => l.id === lessonId);
      targetUrl = targetLes?.fileUrl;
    }

    if (targetUrl) {
      newlyUploadedUrlsRef.current.delete(targetUrl);
      await deleteStorageFile(targetUrl).catch((err) => console.warn('Cloud delete error:', err));
    }

    handleUpdateLesson(modId, lessonId, {
      fileUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
    });
  };

  const handleUpdateLesson = (
    modId: string,
    lessonId: string,
    updates: Partial<CourseLesson>
  ) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
        };
      })
    );
  };

  // Handle file uploads (Video, PDF, Image) via Supabase Storage
  const handleFileUpload = async (
    modId: string,
    lessonId: string,
    file: File,
    expectedType: 'video' | 'pdf' | 'image'
  ) => {
    const fileName = file.name;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const fileSize = `${sizeMb} MB`;

    // If this lesson already had an uploaded file, delete it from storage first before replacing
    const currentMod = modules.find((m) => m.id === modId);
    const currentLes = currentMod?.lessons.find((l) => l.id === lessonId);
    if (currentLes?.fileUrl) {
      newlyUploadedUrlsRef.current.delete(currentLes.fileUrl);
      deleteStorageFile(currentLes.fileUrl).catch(() => {});
    }

    setUploadingLessonIds((prev) => ({ ...prev, [lessonId]: true }));

    // Immediately update UI with pending upload indicator
    handleUpdateLesson(modId, lessonId, {
      fileName,
      fileSize: `${fileSize} (Uploading to Supabase Storage...)`,
      type: expectedType,
    });

    try {
      const uploaded = await uploadLessonMedia(
        file,
        expectedType,
        lessonId,
        course?.id || 'new_course'
      );
      newlyUploadedUrlsRef.current.add(uploaded.url);
      handleUpdateLesson(modId, lessonId, {
        fileUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        type: expectedType,
      });
    } catch (err) {
      console.error('Failed to upload file to Supabase storage:', err);
      // Fallback to local object URL so user isn't blocked
      handleUpdateLesson(modId, lessonId, {
        fileUrl: URL.createObjectURL(file),
        fileName,
        fileSize,
        type: expectedType,
      });
    } finally {
      setUploadingLessonIds((prev) => ({ ...prev, [lessonId]: false }));
    }
  };

  // Takeaways inside a lesson
  const handleAddTakeaway = (modId: string, lessonId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lessonId) return l;
            const current = l.keyTakeaways || [];
            return {
              ...l,
              keyTakeaways: [...current, 'New key takeaway bullet point'],
            };
          }),
        };
      })
    );
  };

  const handleUpdateTakeaway = (
    modId: string,
    lessonId: string,
    index: number,
    val: string
  ) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lessonId) return l;
            const current = [...(l.keyTakeaways || [])];
            current[index] = val;
            return { ...l, keyTakeaways: current };
          }),
        };
      })
    );
  };

  const handleRemoveTakeaway = (modId: string, lessonId: string, index: number) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lessonId) return l;
            const current = (l.keyTakeaways || []).filter((_, i) => i !== index);
            return { ...l, keyTakeaways: current };
          }),
        };
      })
    );
  };

  // Quiz questions inside a quiz lesson
  const handleAddQuizQuestion = (modId: string, lessonId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lessonId) return l;
            const questions = l.quizQuestions || [];
            return {
              ...l,
              quizQuestions: [
                ...questions,
                {
                  id: `q-${Date.now()}`,
                  question: `Question ${questions.length + 1}: Enter prompt here...`,
                  options: [
                    'First answer choice',
                    'Second answer choice',
                    'Third answer choice',
                    'Fourth answer choice',
                  ],
                  correctIndex: 0,
                  explanation: 'Explanation for the correct answer.',
                },
              ],
            };
          }),
        };
      })
    );
  };

  const handleUpdateQuizQuestion = (
    modId: string,
    lessonId: string,
    qIndex: number,
    field: 'question' | 'explanation' | 'correctIndex',
    val: unknown
  ) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lessonId) return l;
            const questions = [...(l.quizQuestions || [])];
            if (!questions[qIndex]) return l;
            questions[qIndex] = {
              ...questions[qIndex],
              [field]: val,
            };
            return { ...l, quizQuestions: questions };
          }),
        };
      })
    );
  };

  const handleUpdateQuizOption = (
    modId: string,
    lessonId: string,
    qIndex: number,
    optIndex: number,
    val: string
  ) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lessonId) return l;
            const questions = [...(l.quizQuestions || [])];
            if (!questions[qIndex]) return l;
            const opts = [...questions[qIndex].options];
            opts[optIndex] = val;
            questions[qIndex] = { ...questions[qIndex], options: opts };
            return { ...l, quizQuestions: questions };
          }),
        };
      })
    );
  };

  const handleRemoveQuizQuestion = (
    modId: string,
    lessonId: string,
    qIndex: number
  ) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lessonId) return l;
            const questions = (l.quizQuestions || []).filter((_, i) => i !== qIndex);
            return { ...l, quizQuestions: questions };
          }),
        };
      })
    );
  };

  // Submit and save curriculum
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a course title.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      titleInputRef.current?.focus();
      return;
    }

    // Sanitize modules and lessons
    const sanitizedModules: CourseModule[] = modules.map((mod, mIdx) => {
      const modTitle = mod.title.trim() || `Module ${mIdx + 1}`;
      const sanitizedLessons: CourseLesson[] = mod.lessons.map((les, lIdx) => ({
        ...les,
        title: les.title.trim() || `Lesson ${lIdx + 1}`,
        durationMinutes: Math.max(1, Number(les.durationMinutes) || 10),
        summary: les.summary ? les.summary.trim() : '',
        keyTakeaways: (les.keyTakeaways || []).filter((t) => t.trim().length > 0),
      }));

      return {
        ...mod,
        title: modTitle,
        lessons: sanitizedLessons,
      };
    });

    setIsSubmitting(true);
    try {
      const savedCourse = saveCourseWithCurriculum({
        id: course?.id,
        title: trimmedTitle,
        description: description.trim(),
        isPublished,
        modules: sanitizedModules,
      });

      // Successfully committed to course — keep these files
      newlyUploadedUrlsRef.current.clear();

      if (onSuccess) onSuccess(savedCourse);
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save course curriculum.';
      setError(errMsg);
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity"
        onClick={handleCancelAndClose}
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="curriculum-builder-title"
        className="relative bg-white rounded-xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-10"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-[#7C3AED]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="curriculum-builder-title"
                className="text-base font-bold text-slate-900 tracking-tight"
              >
                {course ? 'Edit Course Curriculum & Content' : 'Manual Course & Curriculum Builder'}
              </h2>
              <p className="text-xs text-slate-500">
                Author customized modules with Videos, PDFs, Images, Text Articles, and Quizzes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-600 shadow-2xs">
              <span>{modules.length} Modules</span>
              <span>•</span>
              <span>{totalLessonsCount} Lessons</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#7C3AED]">
                <Clock className="w-3 h-3" />
                {totalDurationMinutes} mins
              </span>
            </div>

            <button
              type="button"
              onClick={handleCancelAndClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="curriculum-builder-form"
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Course Overview Details */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Step 1: Course Identification & Publication
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer transition-colors ${
                    isPublished
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isPublished ? '● Published' : '○ Draft'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  required
                  placeholder="e.g. Workplace Safety & Compliance Management"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full bg-white text-xs px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-1 text-slate-900 shadow-2xs font-medium ${
                    error && !title.trim()
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : 'border-slate-200 focus:ring-[#7C3AED]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Summary / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide an overview of course learning goals, key topics, and prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED] text-slate-900 shadow-2xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Modules & Curriculum Structure */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Step 2: Curriculum Modules & Content Attachments
                </h3>
                <p className="text-[11px] text-slate-500">
                  Add modules and upload multi-format lesson contents: Videos, PDF Handbooks, Visual Diagrams, Reading Articles, or Quizzes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddModule}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-3 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Module</span>
              </button>
            </div>

            {/* Modules List */}
            {modules.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200/60 text-[#7C3AED] flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Curriculum is Empty</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  No modules have been added yet. Click &quot;Add First Module&quot; to begin building lessons with videos, PDFs, images, text, or quizzes.
                </p>
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-2 rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add First Module</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, mIdx) => {
                  const isExpanded = expandedModuleIds[module.id] !== false;

                  return (
                    <div
                      key={module.id}
                      className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs"
                    >
                      {/* Module Bar Header */}
                      <div className="p-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleModuleExpand(module.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          <span className="text-xs font-bold text-[#7C3AED] px-2 py-0.5 bg-indigo-50 border border-indigo-200/60 rounded shrink-0">
                            Module {mIdx + 1}
                          </span>

                          <input
                            type="text"
                            value={module.title}
                            onChange={(e) => handleUpdateModuleTitle(module.id, e.target.value)}
                            placeholder={`e.g. Module ${mIdx + 1}: Introduction`}
                            className="flex-1 bg-white text-xs px-2.5 py-1.5 border border-slate-200 rounded-md font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveModule(module.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    {/* Module Lessons Container */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-slate-50/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Lessons in Module {mIdx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAddLesson(module.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded border border-indigo-200/60 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Lesson</span>
                          </button>
                        </div>

                        {/* Lessons List inside Module */}
                        <div className="space-y-4">
                          {module.lessons.map((lesson, lIdx) => {
                            const currentType: CourseLessonType =
                              lesson.type === 'reading' ? 'text' : lesson.type || 'video';

                            return (
                              <div
                                key={lesson.id}
                                className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3.5 shadow-2xs"
                              >
                                {/* Top Lesson Row: Index, Title, Type, Duration, Delete */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded shrink-0">
                                      #{lIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) =>
                                        handleUpdateLesson(module.id, lesson.id, {
                                          title: e.target.value,
                                        })
                                      }
                                      placeholder={`Lesson ${lIdx + 1} Title`}
                                      className="w-full bg-slate-50/70 text-xs px-2.5 py-1.5 border border-slate-200 rounded font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Content Type Pill Selectors (Video, PDF, Image, Text, Quiz) */}
                                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
                                      {/* Video Pill */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateLesson(module.id, lesson.id, {
                                            type: 'video',
                                          })
                                        }
                                        className={`px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-colors ${
                                          currentType === 'video'
                                            ? 'bg-orange-500 text-white font-semibold shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                      >
                                        <Play className="w-2.5 h-2.5 fill-current" />
                                        <span>Video</span>
                                      </button>

                                      {/* PDF Pill */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateLesson(module.id, lesson.id, {
                                            type: 'pdf',
                                          })
                                        }
                                        className={`px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-colors ${
                                          currentType === 'pdf'
                                            ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                      >
                                        <FileIcon className="w-2.5 h-2.5" />
                                        <span>PDF</span>
                                      </button>

                                      {/* Image Pill */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateLesson(module.id, lesson.id, {
                                            type: 'image',
                                          })
                                        }
                                        className={`px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-colors ${
                                          currentType === 'image'
                                            ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                      >
                                        <ImageIcon className="w-2.5 h-2.5" />
                                        <span>Image</span>
                                      </button>

                                      {/* Text Pill */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateLesson(module.id, lesson.id, {
                                            type: 'text',
                                          })
                                        }
                                        className={`px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-colors ${
                                          currentType === 'text'
                                            ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                      >
                                        <FileText className="w-2.5 h-2.5" />
                                        <span>Text</span>
                                      </button>

                                      {/* Quiz Pill */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const initialQuestions =
                                            lesson.quizQuestions && lesson.quizQuestions.length > 0
                                              ? lesson.quizQuestions
                                              : [
                                                  {
                                                    id: `q-${Date.now()}`,
                                                    question: 'What is the key objective of this section?',
                                                    options: [
                                                      'Strict adherence to standardized operational checkpoints',
                                                      'Bypassing institutional compliance checks',
                                                      'Postponing required evaluations',
                                                      'Working without formal documentation',
                                                    ],
                                                    correctIndex: 0,
                                                    explanation:
                                                      'Strict adherence to documented standard operating procedures ensures consistent quality and compliance.',
                                                  },
                                                ];
                                          handleUpdateLesson(module.id, lesson.id, {
                                            type: 'quiz',
                                            quizQuestions: initialQuestions,
                                          });
                                        }}
                                        className={`px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-colors ${
                                          currentType === 'quiz'
                                            ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                      >
                                        <HelpCircle className="w-2.5 h-2.5" />
                                        <span>Quiz</span>
                                      </button>
                                    </div>

                                    {/* Duration Input */}
                                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <input
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={lesson.durationMinutes}
                                        onChange={(e) =>
                                          handleUpdateLesson(module.id, lesson.id, {
                                            durationMinutes: Number(e.target.value) || 1,
                                          })
                                        }
                                        className="w-10 text-right text-xs font-mono font-medium text-slate-800 bg-transparent focus:outline-none"
                                      />
                                      <span className="text-[10px] text-slate-400">m</span>
                                    </div>

                                    {/* Delete Lesson */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLesson(module.id, lesson.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                      title="Delete Lesson"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Lesson Summary input */}
                                <div>
                                  <input
                                    type="text"
                                    value={lesson.summary || ''}
                                    onChange={(e) =>
                                      handleUpdateLesson(module.id, lesson.id, {
                                        summary: e.target.value,
                                      })
                                    }
                                    placeholder="Brief lesson overview and expected learning outcomes..."
                                    className="w-full bg-slate-50/50 text-[11px] px-2.5 py-1.5 border border-slate-200 rounded text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                                  />
                                </div>

                                {/* ========================================================================= */}
                                {/* DEDICATED CONTENT ATTACHMENT / UPLOAD PANELS PER LESSON TYPE               */}
                                {/* ========================================================================= */}

                                {/* 1. VIDEO ATTACHMENT PANEL */}
                                {currentType === 'video' && (
                                  <div className="p-3 bg-orange-50/40 border border-orange-200/80 rounded-lg space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                                        <Play className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                        Video Content Attachment
                                      </span>
                                      {lesson.fileName && (
                                        <span className="text-[11px] font-semibold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded">
                                          {lesson.fileSize || 'Attached'}
                                        </span>
                                      )}
                                    </div>

                                    {/* Upload dropzone or attached card */}
                                    {lesson.fileName || lesson.fileUrl ? (
                                      <div className="flex items-center justify-between p-2.5 bg-white border border-orange-200 rounded-md">
                                        <div className="flex items-center gap-2">
                                          {uploadingLessonIds[lesson.id] ? (
                                            <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                                          ) : (
                                            <Play className="w-4 h-4 text-orange-500" />
                                          )}
                                          <div>
                                            <div className="text-xs font-semibold text-slate-800 truncate max-w-sm">
                                              {lesson.fileName || 'Video Stream Resource'}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                              {uploadingLessonIds[lesson.id]
                                                ? 'Uploading to Supabase Storage...'
                                                : lesson.fileSize || 'Standard Definition / HD stream'}
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          disabled={uploadingLessonIds[lesson.id]}
                                          onClick={() =>
                                            handleRemoveAttachment(module.id, lesson.id, lesson.fileUrl)
                                          }
                                          className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer disabled:opacity-40"
                                        >
                                          {uploadingLessonIds[lesson.id] ? 'Uploading...' : 'Remove'}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-orange-300 rounded-md hover:bg-orange-50/80 transition-colors cursor-pointer text-center">
                                          <Upload className="w-4 h-4 text-orange-500 mb-1" />
                                          <span className="text-xs font-semibold text-orange-900">
                                            Upload Video File
                                          </span>
                                          <span className="text-[10px] text-orange-700">
                                            MP4, WebM, MOV
                                          </span>
                                          <input
                                            type="file"
                                            accept="video/mp4,video/webm,video/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleFileUpload(module.id, lesson.id, file, 'video');
                                            }}
                                          />
                                        </label>

                                        <div className="flex flex-col justify-center">
                                          <span className="text-[10px] text-slate-500 mb-1 font-medium">
                                            Or enter Video Stream / Storage URL:
                                          </span>
                                          <input
                                            type="text"
                                            placeholder="https://.../video.mp4"
                                            value={lesson.fileUrl || ''}
                                            onChange={(e) =>
                                              handleUpdateLesson(module.id, lesson.id, {
                                                fileUrl: e.target.value,
                                                fileName: e.target.value ? 'External Video Stream' : undefined,
                                              })
                                            }
                                            className="bg-white text-xs px-2.5 py-1.5 border border-orange-200 rounded focus:outline-none text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 2. PDF ATTACHMENT PANEL */}
                                {currentType === 'pdf' && (
                                  <div className="p-3 bg-rose-50/40 border border-rose-200/80 rounded-lg space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                                        <FileIcon className="w-3.5 h-3.5 text-rose-600" />
                                        PDF Document Handbook Attachment
                                      </span>
                                      {lesson.fileName && (
                                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                                          {lesson.fileSize || 'PDF Attached'}
                                        </span>
                                      )}
                                    </div>

                                    {lesson.fileName || lesson.fileUrl ? (
                                      <div className="flex items-center justify-between p-2.5 bg-white border border-rose-200 rounded-md">
                                        <div className="flex items-center gap-2">
                                          {uploadingLessonIds[lesson.id] ? (
                                            <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
                                          ) : (
                                            <FileText className="w-4 h-4 text-rose-600" />
                                          )}
                                          <div>
                                            <div className="text-xs font-semibold text-slate-800 truncate max-w-sm">
                                              {lesson.fileName || 'Course Document.pdf'}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                              {uploadingLessonIds[lesson.id]
                                                ? 'Uploading to Supabase Storage...'
                                                : lesson.fileSize || 'PDF Document • Downloadable'}
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          disabled={uploadingLessonIds[lesson.id]}
                                          onClick={() =>
                                            handleRemoveAttachment(module.id, lesson.id, lesson.fileUrl)
                                          }
                                          className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer disabled:opacity-40"
                                        >
                                          {uploadingLessonIds[lesson.id] ? 'Uploading...' : 'Remove'}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-rose-300 rounded-md hover:bg-rose-50/80 transition-colors cursor-pointer text-center">
                                          <Upload className="w-4 h-4 text-rose-600 mb-1" />
                                          <span className="text-xs font-semibold text-rose-900">
                                            Upload PDF File
                                          </span>
                                          <span className="text-[10px] text-rose-700">
                                            Handbook, syllabus, or compliance guide (.pdf)
                                          </span>
                                          <input
                                            type="file"
                                            accept="application/pdf,.pdf"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleFileUpload(module.id, lesson.id, file, 'pdf');
                                            }}
                                          />
                                        </label>

                                        <div className="flex flex-col justify-center">
                                          <span className="text-[10px] text-slate-500 mb-1 font-medium">
                                            Or enter PDF document URL / storage link:
                                          </span>
                                          <input
                                            type="text"
                                            placeholder="https://.../handbook.pdf"
                                            value={lesson.fileUrl || ''}
                                            onChange={(e) =>
                                              handleUpdateLesson(module.id, lesson.id, {
                                                fileUrl: e.target.value,
                                                fileName: e.target.value ? 'External PDF Document' : undefined,
                                              })
                                            }
                                            className="bg-white text-xs px-2.5 py-1.5 border border-rose-200 rounded focus:outline-none text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 3. IMAGE / DIAGRAM ATTACHMENT PANEL */}
                                {currentType === 'image' && (
                                  <div className="p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-lg space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                        Diagram & Visual Media Attachment
                                      </span>
                                      {lesson.fileName && (
                                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                                          {lesson.fileSize || 'Image Attached'}
                                        </span>
                                      )}
                                    </div>

                                    {lesson.fileUrl || lesson.fileName ? (
                                      <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-md">
                                        <div className="flex items-center gap-3">
                                          {uploadingLessonIds[lesson.id] ? (
                                            <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center border border-emerald-200">
                                              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                                            </div>
                                          ) : lesson.fileUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                              src={lesson.fileUrl}
                                              alt={lesson.fileName || 'Diagram'}
                                              className="w-10 h-10 object-cover rounded border border-slate-200"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center border border-emerald-200">
                                              <ImageIcon className="w-5 h-5 text-emerald-600" />
                                            </div>
                                          )}
                                          <div>
                                            <div className="text-xs font-semibold text-slate-800 truncate max-w-sm">
                                              {lesson.fileName || 'Infographic Diagram'}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                              {uploadingLessonIds[lesson.id]
                                                ? 'Uploading to Supabase Storage...'
                                                : lesson.fileSize || 'High-Resolution Visual Media'}
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          disabled={uploadingLessonIds[lesson.id]}
                                          onClick={() =>
                                            handleRemoveAttachment(module.id, lesson.id, lesson.fileUrl)
                                          }
                                          className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer disabled:opacity-40"
                                        >
                                          {uploadingLessonIds[lesson.id] ? 'Uploading...' : 'Remove'}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-emerald-300 rounded-md hover:bg-emerald-50/80 transition-colors cursor-pointer text-center">
                                          <Upload className="w-4 h-4 text-emerald-600 mb-1" />
                                          <span className="text-xs font-semibold text-emerald-900">
                                            Upload Diagram / Image
                                          </span>
                                          <span className="text-[10px] text-emerald-700">
                                            PNG, JPG, SVG, WebP
                                          </span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleFileUpload(module.id, lesson.id, file, 'image');
                                            }}
                                          />
                                        </label>

                                        <div className="flex flex-col justify-center">
                                          <span className="text-[10px] text-slate-500 mb-1 font-medium">
                                            Or enter Image URL:
                                          </span>
                                          <input
                                            type="text"
                                            placeholder="https://.../diagram.png"
                                            value={lesson.fileUrl || ''}
                                            onChange={(e) =>
                                              handleUpdateLesson(module.id, lesson.id, {
                                                fileUrl: e.target.value,
                                                fileName: e.target.value ? 'External Visual Diagram' : undefined,
                                              })
                                            }
                                            className="bg-white text-xs px-2.5 py-1.5 border border-emerald-200 rounded focus:outline-none text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 4. TEXT / ARTICLE EDITOR PANEL */}
                                {currentType === 'text' && (
                                  <div className="p-3 bg-purple-50/40 border border-purple-200/80 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                                        Lecture Notes & Formatted Article Content
                                      </span>
                                      <span className="text-[10px] text-purple-700 font-medium">
                                        Supports markdown formatting
                                      </span>
                                    </div>

                                    <textarea
                                      rows={4}
                                      value={lesson.content || lesson.textContent || ''}
                                      onChange={(e) =>
                                        handleUpdateLesson(module.id, lesson.id, {
                                          content: e.target.value,
                                          textContent: e.target.value,
                                        })
                                      }
                                      placeholder="Write comprehensive lecture notes, guidelines, step-by-step instructions, and institutional standards..."
                                      className="w-full bg-white text-xs p-2.5 border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800"
                                    />
                                  </div>
                                )}

                                {/* Key Takeaways list */}
                                <div className="p-2.5 bg-slate-50 rounded-md space-y-2 border border-slate-100">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-amber-500" /> Key Takeaways Checklist
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddTakeaway(module.id, lesson.id)}
                                      className="text-[10px] font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                                    >
                                      + Add Bullet
                                    </button>
                                  </div>

                                  <div className="space-y-1.5">
                                    {(lesson.keyTakeaways || []).map((bullet, bIdx) => (
                                      <div key={bIdx} className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <input
                                          type="text"
                                          value={bullet}
                                          onChange={(e) =>
                                            handleUpdateTakeaway(
                                              module.id,
                                              lesson.id,
                                              bIdx,
                                              e.target.value
                                            )
                                          }
                                          placeholder="Key takeaway or policy milestone..."
                                          className="flex-1 bg-white text-[11px] px-2 py-1 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveTakeaway(module.id, lesson.id, bIdx)
                                          }
                                          className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                                          title="Delete Takeaway"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 5. QUIZ QUESTIONS BUILDER PANEL */}
                                {currentType === 'quiz' && (
                                  <div className="p-3 bg-sky-50/50 border border-sky-200/80 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-xs font-bold text-sky-950 flex items-center gap-1">
                                          <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                                          Quiz Checkpoint Questions (
                                          {(lesson.quizQuestions || []).length})
                                        </span>
                                        <p className="text-[10px] text-sky-700">
                                          Learners must answer these checkpoint questions to verify comprehension.
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleAddQuizQuestion(module.id, lesson.id)}
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-white border border-sky-300 hover:bg-sky-50 px-2 py-1 rounded cursor-pointer transition-colors shadow-2xs"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Add Question</span>
                                      </button>
                                    </div>

                                    {/* Questions items */}
                                    <div className="space-y-3">
                                      {(lesson.quizQuestions || []).map((q, qIdx) => (
                                        <div
                                          key={q.id || qIdx}
                                          className="bg-white border border-sky-200 rounded-lg p-3 space-y-2.5 shadow-2xs"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold text-sky-900">
                                              Question #{qIdx + 1}
                                            </span>
                                            {(lesson.quizQuestions || []).length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleRemoveQuizQuestion(
                                                    module.id,
                                                    lesson.id,
                                                    qIdx
                                                  )
                                                }
                                                className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                                                title="Delete Question"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>

                                          <input
                                            type="text"
                                            value={q.question}
                                            onChange={(e) =>
                                              handleUpdateQuizQuestion(
                                                module.id,
                                                lesson.id,
                                                qIdx,
                                                'question',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Question Prompt..."
                                            className="w-full bg-slate-50 text-xs px-2.5 py-1.5 border border-slate-200 rounded font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                          />

                                          {/* Options list with correct answer radio */}
                                          <div className="space-y-1.5 pl-1">
                                            <span className="text-[10px] font-semibold text-slate-500">
                                              Answer Choices (mark the correct option):
                                            </span>
                                            {q.options.map((opt, optIdx) => (
                                              <div
                                                key={optIdx}
                                                className={`flex items-center gap-2 p-1.5 rounded border text-xs transition-colors ${
                                                  q.correctIndex === optIdx
                                                    ? 'bg-emerald-50/80 border-emerald-300'
                                                    : 'bg-white border-slate-200'
                                                }`}
                                              >
                                                <input
                                                  type="radio"
                                                  name={`correct-${lesson.id}-${q.id}`}
                                                  checked={q.correctIndex === optIdx}
                                                  onChange={() =>
                                                    handleUpdateQuizQuestion(
                                                      module.id,
                                                      lesson.id,
                                                      qIdx,
                                                      'correctIndex',
                                                      optIdx
                                                    )
                                                  }
                                                  className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                  title="Mark as correct answer"
                                                />
                                                <input
                                                  type="text"
                                                  value={opt}
                                                  onChange={(e) =>
                                                    handleUpdateQuizOption(
                                                      module.id,
                                                      lesson.id,
                                                      qIdx,
                                                      optIdx,
                                                      e.target.value
                                                    )
                                                  }
                                                  className="flex-1 text-[11px] bg-transparent focus:outline-none text-slate-800"
                                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                />
                                                {q.correctIndex === optIdx && (
                                                  <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                                    Correct Answer
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>

                                          <div>
                                            <input
                                              type="text"
                                              value={q.explanation}
                                              onChange={(e) =>
                                                handleUpdateQuizQuestion(
                                                  module.id,
                                                  lesson.id,
                                                  qIdx,
                                                  'explanation',
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Explanation displayed to learners after submitting..."
                                              className="w-full text-[10px] bg-slate-50 px-2 py-1 border border-slate-200 rounded text-slate-600 focus:bg-white focus:outline-none"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-3">
          <div className="text-xs text-slate-500 font-medium shrink-0">
            Summary: <span className="font-bold text-slate-800">{modules.length} Modules</span>,{' '}
            <span className="font-bold text-slate-800">{totalLessonsCount} Lessons</span>,{' '}
            <span className="font-bold text-[#7C3AED]">{totalDurationMinutes} mins total</span>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold" title={error}>
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="max-w-[280px] sm:max-w-xs truncate">{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCancelAndClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="save-course-curriculum-btn"
              type="submit"
              form="curriculum-builder-form"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Saving...' : 'Save Course Curriculum'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
