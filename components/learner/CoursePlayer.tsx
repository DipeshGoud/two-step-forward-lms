'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Award,
  Download,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Star,
  Check,
  Shield,
  ExternalLink,
  Volume2,
  Volume1,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Menu,
  X,
  HelpCircle,
  ImageIcon,
  PictureInPicture2,
  MoveHorizontal,
  Maximize,
  AlertCircle,
} from 'lucide-react';
import { useAdminStore, AdminCourse, DEFAULT_LEARNER_ID, CourseLessonType, isUserAdmin } from '@/lib/data/adminStore';
import { CourseReviewModal } from './CourseReviewModal';
import PdfSlidePresentationViewer from './PdfSlidePresentationViewer';

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: CourseLessonType;
  moduleId: string;
  moduleTitle: string;
  summary: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  keyTakeaways: string[];
  quizQuestions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface Review {
  id: string;
  authorName: string;
  badge: string;
  rating: number;
  timestamp: string;
  comment: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CoursePlayerProps {
  courseId: string;
  isPreviewInitial?: boolean;
}

function isYouTubeUrl(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

function getYouTubeEmbed(url: string) {
  try {
    if (url.includes('youtube.com/watch?v=')) {
      const id = new URL(url).searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (url.includes('youtube.com/embed/')) return url;
  } catch {}
  return url;
}

function isVideoFile(url?: string) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url) || url.startsWith('data:video') || url.startsWith('blob:');
}

function isImageFile(url?: string) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(url) || url.startsWith('data:image') || url.startsWith('blob:');
}

// -------------------------------------------------------------------------------------------------
// DEFAULT FALLBACK ASSETS (High-resolution, self-contained educational materials)
// -------------------------------------------------------------------------------------------------
const DEFAULT_FALLBACK_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <rect width="1200" height="800" fill="#0F172A"/>
  <defs>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  
  <!-- Header Banner -->
  <rect x="50" y="40" width="1100" height="95" rx="14" fill="url(#primaryGrad)"/>
  <text x="90" y="92" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="bold">TwoStep Forward • Operational Safety Architecture</text>
  <text x="90" y="118" fill="#E2E8F0" font-family="system-ui, -apple-system, sans-serif" font-size="14">Institutional Protocol &amp; Multi-Tier Hazard Prevention Framework</text>
  
  <!-- Tier 1 Column -->
  <rect x="50" y="165" width="340" height="440" rx="14" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>
  <rect x="70" y="185" width="300" height="42" rx="8" fill="#2563EB"/>
  <text x="90" y="212" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">Tier 1: Preventive Routine</text>
  
  <circle cx="90" cy="265" r="7" fill="#60A5FA"/>
  <text x="110" y="270" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Daily Campus Inspection</text>
  <text x="110" y="290" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Pre-operational perimeter check</text>

  <circle cx="90" cy="330" r="7" fill="#60A5FA"/>
  <text x="110" y="335" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Checklist Verification</text>
  <text x="110" y="355" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Fire exit &amp; pathway clearance</text>

  <circle cx="90" cy="395" r="7" fill="#60A5FA"/>
  <text x="110" y="400" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Hazard Early-Detection</text>
  <text x="110" y="420" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Structural &amp; electrical scans</text>

  <rect x="70" y="525" width="300" height="60" rx="8" fill="#1E293B" stroke="#475569"/>
  <text x="90" y="560" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="13">Frequency: Every 4 Hours</text>

  <!-- Tier 2 Column -->
  <rect x="430" y="165" width="340" height="440" rx="14" fill="url(#cardGrad)" stroke="#7C3AED" stroke-width="2"/>
  <rect x="450" y="185" width="300" height="42" rx="8" fill="#7C3AED"/>
  <text x="470" y="212" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">Tier 2: Active Response</text>
  
  <circle cx="470" cy="265" r="7" fill="#A78BFA"/>
  <text x="490" y="270" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Immediate Hazard Isolation</text>
  <text x="490" y="290" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Secure zone &amp; prevent access</text>

  <circle cx="470" cy="330" r="7" fill="#A78BFA"/>
  <text x="490" y="335" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Safety Lead Notification</text>
  <text x="490" y="355" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Designated officer alert dispatch</text>

  <circle cx="470" cy="395" r="7" fill="#A78BFA"/>
  <text x="490" y="400" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Shift Incident Logging</text>
  <text x="490" y="420" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Document before shift handoff</text>

  <rect x="450" y="525" width="300" height="60" rx="8" fill="#1E293B" stroke="#6D28D9"/>
  <text x="470" y="560" fill="#C4B5FD" font-family="system-ui, sans-serif" font-size="13">Timeline: Same Shift Resolution</text>

  <!-- Tier 3 Column -->
  <rect x="810" y="165" width="340" height="440" rx="14" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>
  <rect x="830" y="185" width="300" height="42" rx="8" fill="#059669"/>
  <text x="850" y="212" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">Tier 3: Oversight &amp; Audit</text>
  
  <circle cx="850" cy="265" r="7" fill="#34D399"/>
  <text x="870" y="270" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Post-Incident Debrief</text>
  <text x="870" y="290" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Root cause investigation</text>

  <circle cx="850" cy="330" r="7" fill="#34D399"/>
  <text x="870" y="335" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Corrective Action Filing</text>
  <text x="870" y="355" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Protocol update &amp; staff notice</text>

  <circle cx="850" cy="395" r="7" fill="#34D399"/>
  <text x="870" y="400" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="14" font-weight="500">Quarterly Compliance Review</text>
  <text x="870" y="420" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Governance board audit filing</text>

  <rect x="830" y="525" width="300" height="60" rx="8" fill="#1E293B" stroke="#059669"/>
  <text x="850" y="560" fill="#A7F3D0" font-family="system-ui, sans-serif" font-size="13">Review: Weekly &amp; Quarterly</text>

  <!-- Footer Banner -->
  <rect x="50" y="630" width="1100" height="110" rx="14" fill="#1E293B" stroke="#334155"/>
  <text x="80" y="668" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">Standard Operating Procedure Mandatory Notice:</text>
  <text x="80" y="700" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="13">All safety procedures must comply with regional institutional safety standards. Document all deviations in the central compliance register.</text>
</svg>
`);

// -------------------------------------------------------------------------------------------------
// VIDEO VIEWER COMPONENT (Theater-scale 16:9 LMS Video Player with Full Controls)
// -------------------------------------------------------------------------------------------------
function VideoViewer({
  lesson,
  courseTitle,
  onVideoCompleted,
}: {
  lesson: Lesson;
  courseTitle?: string;
  onVideoCompleted?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const isYouTube = lesson.fileUrl ? isYouTubeUrl(lesson.fileUrl) : false;
  // Fallback demo video stream if no custom url is provided
  const videoSource = lesson.fileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const hasVideoSrc = !isYouTube;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => {
      setCurrentTime(v.currentTime);
      const dur = v.duration || lesson.durationMinutes * 60;
      setDuration(dur);
      const pct = dur > 0 ? (v.currentTime / dur) * 100 : 0;
      setProgress(pct);

      // Trigger completion when learner watches >= 90%
      if (pct >= 90 && onVideoCompleted) {
        onVideoCompleted();
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onError = () => {
      setIsBuffering(false);
      setHasError(true);
    };
    const onEnded = () => {
      setIsPlaying(false);
      if (onVideoCompleted) onVideoCompleted();
    };

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('error', onError);
    v.addEventListener('ended', onEnded);

    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('error', onError);
      v.removeEventListener('ended', onEnded);
    };
  }, [lesson.durationMinutes, onVideoCompleted]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const dur = v.duration || lesson.durationMinutes * 60;
    if (!dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pos * dur;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await v.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP not supported or disallowed:', err);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`flex-1 w-full min-h-0 flex flex-col bg-[#0B0F19] relative select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-[100]' : ''
      }`}
    >
      {/* Fullscreen Header */}
      {isFullscreen && (
        <div className="h-12 bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 text-white z-20 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-100 truncate">
              {courseTitle ? `${courseTitle} • ` : ''}
              {lesson.title}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Exit Fullscreen (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Video Theater Stage */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden relative">
        <div
          className="relative w-full max-w-5xl aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 flex items-center justify-center"
          style={{ maxHeight: isFullscreen ? 'calc(100vh - 110px)' : 'calc(100vh - 175px)' }}
        >
          {isYouTube ? (
            <iframe
              src={getYouTubeEmbed(lesson.fileUrl || '')}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
              <h3 className="text-sm font-bold text-white">Unable to play this video.</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                The video stream could not be loaded or the format is not supported.
              </p>
              <button
                onClick={() => {
                  setHasError(false);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoSource}
                className="w-full h-full object-contain bg-black cursor-pointer"
                playsInline
                preload="metadata"
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
              />

              {/* Buffering Spinner */}
              {isBuffering && (
                <div className="absolute inset-0 m-auto w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin pointer-events-none z-10" />
              )}

              {/* Center Play Button Overlay */}
              {!isPlaying && !isBuffering && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 hover:bg-white text-[#7C3AED] flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 z-10 backdrop-blur cursor-pointer"
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                  title="Play Video (Space)"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-[#7C3AED] translate-x-0.5" />
                </button>
              )}

              {/* Floating Bottom Control Bar */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 sm:p-4 pt-8 transition-opacity duration-300 z-20 ${
                  showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Scrub Bar */}
                <div
                  className="group relative h-2 w-full bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-all flex items-center"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-[#7C3AED] rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between mt-2.5 text-white text-xs gap-2">
                  {/* Left Controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-1 rounded-lg hover:bg-white/15 text-white transition-colors"
                      title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                      )}
                    </button>

                    {/* Volume & Mute */}
                    <div className="flex items-center gap-1.5 group/vol">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-1 rounded-lg hover:bg-white/15 text-white transition-colors"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : volume < 0.5 ? (
                          <Volume1 className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-14 sm:w-20 h-1.5 accent-purple-500 bg-white/30 rounded-lg cursor-pointer transition-all"
                      />
                    </div>

                    {/* Timecode */}
                    <span className="font-mono text-[11px] sm:text-xs text-slate-300">
                      {formatTime(currentTime)} / {formatTime(duration || lesson.durationMinutes * 60)}
                    </span>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Playback Speed */}
                    <select
                      value={playbackSpeed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setPlaybackSpeed(val);
                        if (videoRef.current) videoRef.current.playbackRate = val;
                      }}
                      className="bg-black/60 border border-white/20 text-white text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1.0x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2.0x</option>
                    </select>

                    {/* PiP */}
                    <button
                      type="button"
                      onClick={togglePiP}
                      className="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white transition-colors hidden sm:inline-flex"
                      title="Picture in Picture"
                    >
                      <PictureInPicture2 className="w-4 h-4" />
                    </button>

                    {/* Fullscreen */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 rounded-lg hover:bg-white/15 text-white transition-colors"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sleek Bottom Video Meta Bar */}
      <div className="h-12 bg-slate-900 border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-400 w-full z-10 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-bold text-[10px] uppercase tracking-wide">
            HD Video
          </span>
          <span className="font-semibold text-slate-200 truncate">{lesson.title}</span>
          <span className="text-slate-500 hidden sm:inline">• {lesson.durationMinutes} min</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lesson.fileUrl && !isYouTube && (
            <a
              href={lesson.fileUrl}
              download={lesson.fileName || 'video.mp4'}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              title="Download Video File"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Toggle Theater Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// IMAGE VIEWER COMPONENT (Full Viewport Stage with Smooth Zoom & Controls)
// -------------------------------------------------------------------------------------------------
function ImageViewer({
  lesson,
  courseTitle,
}: {
  lesson: Lesson;
  courseTitle?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [fitMode, setFitMode] = useState<'screen' | 'width'>('screen');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const imageSrc = lesson.fileUrl || DEFAULT_FALLBACK_IMAGE;

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleZoomIn = () => {
    setZoomPercent((z) => Math.min(200, z + 25));
  };

  const handleZoomOut = () => {
    setZoomPercent((z) => Math.max(50, z - 25));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = lesson.fileName || 'learning-diagram.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 w-full min-h-0 flex flex-col bg-[#EBECEF] relative select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-[100]' : ''
      }`}
    >
      {/* Fullscreen Header */}
      {isFullscreen && (
        <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 text-white z-20 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-100 truncate">
              {courseTitle ? `${courseTitle} • ` : ''}
              {lesson.title}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Exit Fullscreen (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Image Stage with Natural Smooth Scrolling */}
      <div
        ref={stageRef}
        className="flex-1 w-full min-h-0 overflow-auto bg-[#EBECEF] flex items-center justify-center p-3 sm:p-6"
      >
        {isLoading ? (
          <div className="my-auto flex flex-col items-center justify-center gap-3 text-slate-600 p-8">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-600">Loading image...</span>
          </div>
        ) : isError ? (
          <div className="my-auto flex flex-col items-center justify-center gap-3 bg-white rounded-xl border border-slate-200 p-8 text-center max-w-sm shadow-xs">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900">Unable to load image.</h3>
            <p className="text-xs text-slate-500">The requested learning image could not be loaded.</p>
            <button
              onClick={() => setIsError(false)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : (
          <div className="my-auto flex flex-col items-center py-2 transition-transform duration-150 ease-out">
            <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-slate-300/80 rounded-lg overflow-hidden transition-all">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={lesson.title}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setIsError(true);
                }}
                className={`transition-all duration-150 ${
                  fitMode === 'screen'
                    ? 'max-w-full max-h-[calc(100vh-175px)] object-contain block'
                    : 'w-full max-w-5xl h-auto block'
                }`}
                style={{
                  transform: `scale(${zoomPercent / 100})`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Compact Bottom Image Viewer Toolbar */}
      <div className="h-12 bg-white border-t border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 shadow-2xs z-10">
        {/* Left: Info badge */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[10px] uppercase tracking-wide">
            Image Lesson
          </span>
          <span className="text-xs font-bold text-slate-800 truncate max-w-[140px] sm:max-w-xs">
            {lesson.fileName || lesson.title}
          </span>
        </div>

        {/* Center: Fit Modes & Zoom */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Fit Buttons */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setFitMode('screen');
                setZoomPercent(100);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                fitMode === 'screen'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fit to Screen"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span>Fit Screen</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFitMode('width');
                setZoomPercent(100);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                fitMode === 'width'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fit to Width"
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
              <span>Fit Width</span>
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
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
              onClick={handleZoomIn}
              disabled={zoomPercent >= 200}
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
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (⛶)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Download Image"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// READING / TEXT VIEWER COMPONENT (Clean, comfortable reading canvas)
// -------------------------------------------------------------------------------------------------
function ReadingViewer({ lesson }: { lesson: Lesson }) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start max-w-4xl mx-auto py-4">
      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10 text-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Reading Lesson • {lesson.durationMinutes} min read</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">{lesson.title}</h1>
        {lesson.summary && (
          <div className="bg-purple-50/70 border-l-4 border-purple-600 p-4 rounded-r-lg mb-6">
            <p className="text-xs sm:text-sm text-purple-950 font-medium leading-relaxed">{lesson.summary}</p>
          </div>
        )}
        <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed space-y-4">
          <p>{lesson.content}</p>
        </div>
        {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Key Takeaways</h3>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {lesson.keyTakeaways.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700 leading-snug">{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// QUIZ VIEWER COMPONENT (Interactive evaluation)
// -------------------------------------------------------------------------------------------------
function QuizViewer({
  lesson,
  selectedAnswers,
  setSelectedAnswers,
  quizSubmitted,
  quizScore,
  onSubmitQuiz,
  onResetQuiz,
}: {
  lesson: Lesson;
  selectedAnswers: Record<string, number>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  quizSubmitted: boolean;
  quizScore: number | null;
  onSubmitQuiz: () => void;
  onResetQuiz: () => void;
}) {
  if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto my-auto bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
        <HelpCircle className="w-10 h-10 text-purple-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">No Assessment Questions Configured</h3>
        <p className="text-xs text-slate-500 mt-1">This quiz checkpoint has not yet been populated with test items.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-center max-w-3xl mx-auto py-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-purple-700 block">Knowledge Checkpoint</span>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">{lesson.title}</h2>
          </div>
          {quizScore !== null && (
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${
                quizScore >= 60 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {quizScore}% {quizScore >= 60 ? '• Passed' : '• Try Again'}
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          {lesson.quizQuestions.map((q, qIndex) => {
            const selected = selectedAnswers[q.id];
            const isCorrect = selected === q.correctIndex;
            return (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="flex gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {qIndex + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 leading-snug">{q.question}</span>
                </div>
                <div className="space-y-2 ml-8">
                  {q.options.map((opt, optIndex) => {
                    const isSel = selected === optIndex;
                    let cls = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                    if (quizSubmitted) {
                      if (optIndex === q.correctIndex) cls = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                      else if (isSel && !isCorrect) cls = 'bg-rose-50 border-rose-300 text-rose-900';
                    } else if (isSel) {
                      cls = 'bg-purple-50 border-purple-500 text-purple-900 font-semibold';
                    }
                    return (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs sm:text-sm cursor-pointer transition-colors ${cls}`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={isSel}
                          onChange={() => setSelectedAnswers((p) => ({ ...p, [q.id]: optIndex }))}
                          disabled={quizSubmitted}
                          className="accent-purple-600"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
                {quizSubmitted && selected !== undefined && (
                  <div
                    className={`ml-8 p-3 rounded-lg text-xs leading-relaxed border ${
                      isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <span className="font-bold">{isCorrect ? '✓ Correct: ' : '✗ Note: '}</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!quizSubmitted ? (
            <button
              type="button"
              onClick={onSubmitQuiz}
              disabled={Object.keys(selectedAnswers).length < lesson.quizQuestions.length}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Submit Checkpoint Answers
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetQuiz}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Retake Quiz
            </button>
          )}
          <span className="text-xs text-slate-400">Score &gt;= 60% automatically marks lesson complete</span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// MAIN COURSE PLAYER COMPONENT (Content-First LMS Layout)
// -------------------------------------------------------------------------------------------------
export function CoursePlayer({ courseId, isPreviewInitial = false }: CoursePlayerProps) {
  const { store, updateLearnerCourseProgress } = useAdminStore();
  const [isAdminPreviewOverride, setIsAdminPreviewOverride] = useState(isPreviewInitial);

  // Retrieve course from store
  const course: AdminCourse = useMemo(() => {
    return (
      store.courses.find((c) => c.id === courseId) || {
        id: courseId,
        title: 'TwoStep Forward Training Program',
        totalLessons: 4,
        durationMinutes: 180,
        rating: 5.0,
        isPublished: true,
        enrolledCount: 3,
        thumbnailUrl: null,
      }
    );
  }, [store.courses, courseId]);

  // Current active learner
  const activeLearner = useMemo(() => {
    const currentId = store.currentUserId || DEFAULT_LEARNER_ID;
    return store.users.find((u) => u.id === currentId) || store.users[0];
  }, [store.users, store.currentUserId]);

  const isAdmin = isUserAdmin(activeLearner?.role) || isPreviewInitial || isAdminPreviewOverride;

  // Current assignment check (Admins get unrestricted direct access per Rule 9 & User Request)
  const assignment = useMemo(() => {
    return store.assignments.find(
      (a) =>
        (a.employeeId === activeLearner?.id ||
          a.employeeName?.toLowerCase() === activeLearner?.name?.toLowerCase()) &&
        a.courseId === course.id
    );
  }, [store.assignments, activeLearner, course.id]);

  const effectiveAssignment = useMemo(() => {
    if (assignment) return assignment;
    if (isAdmin && activeLearner) {
      return {
        id: `admin-access-${activeLearner.id}-${course.id}`,
        employeeId: activeLearner.id,
        employeeName: activeLearner.name,
        email: activeLearner.email,
        courseId: course.id,
        courseTitle: course.title,
        schoolId: activeLearner.schools?.[0] || 'sch-1',
        schoolName: 'All Campuses',
        status: 'in_progress' as const,
        progress: 0,
        assignedAt: 'Admin Access',
        dueDate: 'Unrestricted Access',
      };
    }
    return undefined;
  }, [assignment, isAdmin, activeLearner, course]);

  // Structured curriculum modules & lessons
  const modules: Module[] = useMemo(() => {
    if (course.modules && course.modules.length > 0) {
      return course.modules.map((m, mIdx) => ({
        id: m.id || `mod-${mIdx + 1}`,
        title: m.title || `Module ${mIdx + 1}`,
        lessons: m.lessons.map((l, lIdx) => ({
          id: l.id || `${course.id}-m${mIdx + 1}-l${lIdx + 1}`,
          title: l.title || `Lesson ${lIdx + 1}`,
          durationMinutes: l.durationMinutes || 20,
          type: l.type || 'video',
          moduleId: m.id || `mod-${mIdx + 1}`,
          moduleTitle: m.title || `Module ${mIdx + 1}`,
          summary: l.summary || l.title,
          content: l.content || `Welcome to ${l.title}. Master the key principles and actionable steps in this lesson.`,
          keyTakeaways:
            l.keyTakeaways && l.keyTakeaways.length > 0
              ? l.keyTakeaways
              : [
                  'Core organizational responsibilities and standards',
                  'Standard operational procedures and compliance checks',
                  'Practical scenario application and decision pathways',
                ],
          fileUrl: l.fileUrl,
          fileName: l.fileName,
          fileSize: l.fileSize,
          quizQuestions: l.quizQuestions,
        })),
      }));
    }

    return [
      {
        id: 'mod-1',
        title: 'Foundations & Core Principles',
        lessons: [
          {
            id: `${course.id}-l1`,
            title: 'Overview & Essential Principles',
            durationMinutes: 20,
            type: 'video' as const,
            moduleId: 'mod-1',
            moduleTitle: 'Module 1: Foundations & Core Principles',
            summary: 'Understand the foundational framework, ethical considerations, and organizational standards.',
            content: `Welcome to ${course.title}. This foundational module establishes standard practices, compliance benchmarks, and institutional responsibilities for personnel.`,
            keyTakeaways: [
              'Core organizational responsibilities and reporting channels',
              'Legal mandates, ethical guidelines, and institutional standards',
              'Early hazard identification and proactive mitigation techniques',
            ],
          },
          {
            id: `${course.id}-l2`,
            title: 'Operational Guidelines & Presentation Slides',
            durationMinutes: 25,
            type: 'pdf' as const,
            fileName: 'Operational_Guidelines_Slides.pdf',
            fileSize: '3.8 MB',
            moduleId: 'mod-1',
            moduleTitle: 'Module 1: Foundations & Core Principles',
            summary: 'Review the high-resolution presentation slides covering standard operating procedures and compliance checks.',
            content: `Master the standard operating procedures and compliance guidelines presented in these curriculum slides.`,
            keyTakeaways: [
              'Daily verification protocols and campus checklist routines',
              'Documenting observations and incident logs according to policy',
              'Cross-departmental collaboration for preventive oversight',
            ],
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Practical Implementation & Scenarios',
        lessons: [
          {
            id: `${course.id}-l3`,
            title: 'Campus Safety Architecture & Diagram',
            durationMinutes: 15,
            type: 'image' as const,
            fileName: 'Safety_Architecture_Flowchart.png',
            fileSize: '1.4 MB',
            moduleId: 'mod-2',
            moduleTitle: 'Module 2: Practical Implementation & Scenarios',
            summary: 'Detailed visual breakdown of the multi-tier hazard prevention framework and response pathways.',
            content: `Study the tiered operational safety architecture diagram. Master the distinct roles across Tier 1 (Routine), Tier 2 (Active Response), and Tier 3 (Oversight & Audit).`,
            keyTakeaways: [
              'Clear demarcation between preventive routines and immediate containment',
              'Escalation triggers and safety lead contact protocols',
              'Same-shift logging and documentation requirements',
            ],
          },
          {
            id: `${course.id}-l4`,
            title: 'Campus Guidelines & Deep Dive Protocols',
            durationMinutes: 30,
            type: 'reading' as const,
            moduleId: 'mod-2',
            moduleTitle: 'Module 2: Practical Implementation & Scenarios',
            summary: 'In-depth reference reading of campus workflows, reporting standards, and documentation routines.',
            content: `Detailed operational protocols must be followed during daily interactions and supervisory roles. This section details routine audits, documentation routines, and escalation protocols for campus environments. Ensure that all incidents are documented within the same shift.`,
            keyTakeaways: [
              'De-escalation tactics and immediate protective interventions',
              'Standard documentation and incident logging timelines',
              'Collaborative communication protocols with administrative leadership',
            ],
          },
          {
            id: `${course.id}-l5`,
            title: 'Case Study & Crisis Response Scenarios',
            durationMinutes: 40,
            type: 'video' as const,
            moduleId: 'mod-2',
            moduleTitle: 'Module 2: Practical Implementation & Scenarios',
            summary: 'Real-world incident reviews, response drills, and step-by-step resolution pathways.',
            content: `Examine real-world case scenarios from diverse educational settings. Review how standard procedures were applied to resolve complex situational dilemmas promptly and transparently.`,
            keyTakeaways: [
              'De-escalation tactics and immediate protective interventions',
              'Communication protocols with campus administration and guardians',
              'Post-incident reviews and continuous protocol enhancement',
            ],
          },
        ],
      },
      {
        id: 'mod-3',
        title: 'Knowledge Evaluation & Checkpoint',
        lessons: [
          {
            id: `${course.id}-l6`,
            title: 'Knowledge Checkpoint & Assessment Quiz',
            durationMinutes: 20,
            type: 'quiz' as const,
            moduleId: 'mod-3',
            moduleTitle: 'Module 3: Knowledge Evaluation & Checkpoint',
            summary: 'Demonstrate comprehension of critical principles and practical incident procedures.',
            content: `Complete this knowledge evaluation checkpoint to verify your mastery of the curriculum topics. A passing grade certifies your readiness to implement these standards.`,
            keyTakeaways: [
              'Verification of compliance readiness',
              'Instant feedback and rationale for all evaluation scenarios',
            ],
            quizQuestions: [
              {
                id: 'q1',
                question: 'What is the mandatory timeframe for initiating documentation upon noticing a campus compliance concern?',
                options: [
                  'Within 24 hours of the occurrence',
                  'Immediately, but no later than the conclusion of the operational shift',
                  'At the end of the calendar month review',
                  'Only when requested by a supervisory audit',
                ],
                correctIndex: 1,
                explanation: 'Documentation must begin immediately or within the same operational shift to preserve factual accuracy and trigger prompt protective actions.',
              },
              {
                id: 'q2',
                question: 'Which of the following is the primary objective of routine preventive campus inspections?',
                options: [
                  'Assigning penalties to faculty members',
                  'Proactively identifying and neutralizing hazards before harm occurs',
                  'Replacing annual third-party audits',
                  'Reducing scheduled instructional hours',
                ],
                correctIndex: 1,
                explanation: 'Preventive inspections exist primarily to identify and eliminate safety or compliance risks before they impact learners or faculty.',
              },
              {
                id: 'q3',
                question: 'When escalating an emergency protocol, who must be notified first per TwoStep Forward guidelines?',
                options: [
                  'The Designated Campus Safety Lead & School Authority',
                  'External media relations representatives',
                  'Other educational branch affiliates',
                  'General staff community forums',
                ],
                correctIndex: 0,
                explanation: 'The Designated Campus Safety Lead and campus administrator are the authoritative first points of contact for all escalated safety concerns.',
              },
            ],
          },
        ],
      },
    ];
  }, [course]);

  // Flattened lessons list
  const allLessons: Lesson[] = useMemo(() => {
    return modules.flatMap((m) => m.lessons);
  }, [modules]);

  // Collapsed modules state
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<Record<string, boolean>>({});
  const toggleModule = (modId: string) => {
    setCollapsedModuleIds((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Completed lessons tracking
  const initialCompletedIds = useMemo(() => {
    if (!effectiveAssignment) return [];
    if (effectiveAssignment.progress === 100) return allLessons.map((l) => l.id);
    if (effectiveAssignment.progress > 0) {
      const count = Math.max(1, Math.round((effectiveAssignment.progress / 100) * allLessons.length));
      return allLessons.slice(0, count).map((l) => l.id);
    }
    return [];
  }, [effectiveAssignment, allLessons]);

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialCompletedIds);

  // Active selected lesson
  const [activeLessonId, setActiveLessonId] = useState<string>(allLessons[0]?.id || '');
  useEffect(() => {
    if (allLessons.length > 0 && (!activeLessonId || !allLessons.some((l) => l.id === activeLessonId))) {
      setActiveLessonId(allLessons[0].id);
    }
  }, [allLessons, activeLessonId]);

  const activeLesson = useMemo(() => {
    return allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
  }, [allLessons, activeLessonId]);

  // Responsive sidebar collapse state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Modals state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Progress metrics
  const progressPercent = useMemo(() => {
    if (allLessons.length === 0 || completedLessonIds.length === 0) return 0;
    return Math.round((completedLessonIds.length / allLessons.length) * 100);
  }, [completedLessonIds.length, allLessons.length]);

  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = completedLessonIds.length;
  const isCourseCompleted = progressPercent === 100;

  // Toggle lesson complete
  const handleToggleLessonComplete = (lessonId: string) => {
    let updated: string[];
    if (completedLessonIds.includes(lessonId)) {
      updated = completedLessonIds.filter((id) => id !== lessonId);
    } else {
      updated = [...completedLessonIds, lessonId];
    }
    setCompletedLessonIds(updated);

    const newProgress = Math.round((updated.length / allLessons.length) * 100);
    if (activeLearner) {
      updateLearnerCourseProgress(activeLearner.id, course.id, newProgress);
    }

    if (newProgress === 100) {
      setFeedback('🎉 Course completed! Excellent job.');
    } else {
      setFeedback(`Progress updated: ${newProgress}% completed.`);
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  // Next / Previous navigation
  const currentIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allLessons.length - 1;

  const handleNextLesson = () => {
    if (hasNext && activeLesson) {
      if (!completedLessonIds.includes(activeLesson.id)) {
        handleToggleLessonComplete(activeLesson.id);
      }
      setActiveLessonId(allLessons[currentIndex + 1].id);
      // reset quiz if moving from quiz
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    }
  };

  const handlePreviousLesson = () => {
    if (hasPrevious) {
      setActiveLessonId(allLessons[currentIndex - 1].id);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    }
  };

  // Quiz submission
  const handleSubmitQuiz = () => {
    if (!activeLesson?.quizQuestions) return;
    let correctCount = 0;
    activeLesson.quizQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) correctCount += 1;
    });
    const score = Math.round((correctCount / activeLesson.quizQuestions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (score >= 60 && !completedLessonIds.includes(activeLesson.id)) {
      handleToggleLessonComplete(activeLesson.id);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  // Unauthorized screen (if student not assigned and not admin)
  if (!effectiveAssignment) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Course Not Assigned</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          You currently do not have access to &ldquo;{course.title}&rdquo;. Learners can only see and access courses
          that have been assigned to them by an administrator.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/learning"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Courses</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsAdminPreviewOverride(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Preview Curriculum (Admin Mode)</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------------------------------
  // CONTENT-FIRST IMMERSIVE LMS PLAYER
  // Occupies 100% viewport with Left Sidebar, Compact Header, Dominant Hero Content & Clean Bottom Nav
  // -------------------------------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-40 flex bg-slate-100 overflow-hidden select-none">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT COURSE NAVIGATION SIDEBAR (Polished light LMS styling)            */}
      {/* ========================================================================= */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col shrink-0 bg-white border-r border-slate-200 transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-0 md:hidden'
        }`}
      >
        {/* Sidebar Header: Back, Course Title & Progress */}
        <div className="p-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Link
              href="/learning"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                <Shield className="w-3 h-3 text-purple-600" /> Admin
              </span>
            )}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2" title={course.title}>
            {course.title}
          </h2>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>{progressPercent}% Completed</span>
              <span className="text-slate-500 text-[11px]">
                {completedLessonsCount}/{totalLessonsCount}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module & Lesson List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {modules.map((mod, mIdx) => {
            const isCollapsed = !!collapsedModuleIds[mod.id];
            const completedInModule = mod.lessons.filter((l) => completedLessonIds.includes(l.id)).length;

            return (
              <div key={mod.id} className={mIdx > 0 ? 'pt-3 border-t border-slate-100' : ''}>
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center justify-between text-left py-1 group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-purple-700 block">
                      MODULE {mIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
                      {mod.title.replace(/^Module \d+:\s*/i, '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-500">
                      {completedInModule}/{mod.lessons.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    />
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="mt-2 space-y-1">
                    {mod.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLesson?.id;
                      const isCompleted = completedLessonIds.includes(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => {
                            setActiveLessonId(lesson.id);
                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-purple-50 text-purple-950 font-semibold border-l-3 border-purple-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-3 border-transparent'
                          }`}
                        >
                          {/* Completion Indicator */}
                          {isCompleted ? (
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : isActive ? (
                            <span className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}

                          <span className="text-xs leading-snug line-clamp-2 flex-1 min-w-0">{lesson.title}</span>

                          {/* Lesson Type Icon */}
                          <span className="text-slate-400 shrink-0">
                            {lesson.type === 'video' ? (
                              <Play className="w-3 h-3" />
                            ) : lesson.type === 'quiz' ? (
                              <HelpCircle className="w-3 h-3" />
                            ) : lesson.type === 'pdf' ? (
                              <FileText className="w-3 h-3" />
                            ) : lesson.type === 'image' ? (
                              <ImageIcon className="w-3 h-3" />
                            ) : (
                              <BookOpen className="w-3 h-3" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN COLUMN (Compact Header + Dominant Hero Content + Clean Bottom Nav) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 relative overflow-hidden">
        {/* Course Header (Compact top bar) */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 gap-3 z-10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              title={isSidebarOpen ? 'Hide Course Sidebar' : 'Show Course Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate leading-tight">
                Session {currentIndex + 1}: {activeLesson?.title}
              </h1>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
                <span className="truncate">{activeLesson?.moduleTitle}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {activeLesson?.durationMinutes} min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Single Source of Truth for Mark Complete */}
            {activeLesson && (
              <button
                type="button"
                onClick={() => handleToggleLessonComplete(activeLesson.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  completedLessonIds.includes(activeLesson.id)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    completedLessonIds.includes(activeLesson.id) ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>{completedLessonIds.includes(activeLesson.id) ? 'Completed' : 'Mark Complete'}</span>
              </button>
            )}

            {/* Review Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-slate-100 transition-colors"
              title="Course Feedback & Review"
            >
              <Star className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div className="mx-4 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 rounded-lg flex items-center gap-2 shadow-xs shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <main
          className={`flex-1 min-h-0 flex flex-col bg-[#F8FAFC] relative ${
            activeLesson?.type === 'pdf' ||
            activeLesson?.type === 'image' ||
            activeLesson?.type === 'video' ||
            (!activeLesson?.type && activeLesson?.fileUrl?.endsWith('.pdf'))
              ? 'overflow-hidden p-0'
              : 'overflow-y-auto p-2 sm:p-4'
          }`}
        >
          {activeLesson ? (
            <>
              {/* PDF Document Viewer (Uses 100% available viewport space) */}
              {(activeLesson.type === 'pdf' ||
                (!activeLesson.type && activeLesson.fileUrl?.endsWith('.pdf'))) && (
                <div className="w-full h-full flex-1 min-h-0 flex flex-col">
                  <PdfSlidePresentationViewer
                    lesson={activeLesson}
                    courseTitle={course.title}
                    onNextLesson={hasNext ? handleNextLesson : undefined}
                    hasNextLesson={hasNext}
                  />
                </div>
              )}

              {/* Video Viewer */}
              {activeLesson.type === 'video' && (
                <div className="w-full h-full flex-1 min-h-0 flex flex-col">
                  <VideoViewer
                    lesson={activeLesson}
                    courseTitle={course.title}
                    onVideoCompleted={() => {
                      if (!completedLessonIds.includes(activeLesson.id)) {
                        handleToggleLessonComplete(activeLesson.id);
                      }
                    }}
                  />
                </div>
              )}

              {/* Image Viewer */}
              {activeLesson.type === 'image' && (
                <div className="w-full h-full flex-1 min-h-0 flex flex-col">
                  <ImageViewer lesson={activeLesson} courseTitle={course.title} />
                </div>
              )}

              {/* Reading / Text Viewer */}
              {(activeLesson.type === 'reading' || activeLesson.type === 'text') && (
                <ReadingViewer lesson={activeLesson} />
              )}

              {/* Quiz Checkpoint */}
              {activeLesson.type === 'quiz' && (
                <QuizViewer
                  lesson={activeLesson}
                  selectedAnswers={selectedAnswers}
                  setSelectedAnswers={setSelectedAnswers}
                  quizSubmitted={quizSubmitted}
                  quizScore={quizScore}
                  onSubmitQuiz={handleSubmitQuiz}
                  onResetQuiz={handleResetQuiz}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              No lesson selected.
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* 4. CLEAN BOTTOM NAVIGATION BAR ([← Previous] ... [Next Lesson →])        */}
        {/* ========================================================================= */}
        <footer className="h-14 shrink-0 bg-white border-t border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-10 shadow-2xs">
          <button
            type="button"
            onClick={handlePreviousLesson}
            disabled={!hasPrevious}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Lesson</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>
              Lesson {currentIndex + 1} of {allLessons.length}
            </span>
            {activeLesson && completedLessonIds.includes(activeLesson.id) && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                • <Check className="w-3 h-3 stroke-[3]" /> Completed
              </span>
            )}
          </div>

          <div>
            {hasNext ? (
              <button
                type="button"
                onClick={handleNextLesson}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (activeLesson) {
                    handleToggleLessonComplete(activeLesson.id);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer shadow-xs hover:shadow ${
                  activeLesson && completedLessonIds.includes(activeLesson.id)
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#7C3AED] hover:bg-[#6D28D9]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {activeLesson && completedLessonIds.includes(activeLesson.id)
                    ? 'Course Completed'
                    : 'Complete Course'}
                </span>
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Review Modal */}
      <CourseReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        courseTitle={course.title}
        onSubmitReview={(newRev) => {
          setFeedback('Thank you! Your course review has been submitted.');
          setTimeout(() => setFeedback(null), 3000);
        }}
      />
    </div>
  );
}
