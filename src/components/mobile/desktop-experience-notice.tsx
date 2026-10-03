'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Laptop, 
  Smartphone, 
  ArrowRight, 
  ChevronLeft, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';

const STORAGE_KEY = 'nexaos_desktop_notice_dismissed';
const MOBILE_BREAKPOINT = 768; // Screens < 768px are considered narrow mobile viewports

export function openDesktopExperienceNotice() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexaos:open-desktop-notice'));
  }
}

export function DesktopExperienceNotice() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'notice' | 'instructions'>('notice');

  const checkViewportAndShow = useCallback((forceOpen = false) => {
    if (typeof window === 'undefined') return;
    const isNarrow = window.innerWidth < MOBILE_BREAKPOINT;

    if (!isNarrow) {
      // Screen is tablet or desktop: never show
      setIsOpen(false);
      return;
    }

    if (forceOpen) {
      setView('notice');
      setIsOpen(true);
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
    if (!isDismissed) {
      setView('notice');
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    checkViewportAndShow(false);

    const handleResize = () => {
      checkViewportAndShow(false);
    };

    const handleOrientationChange = () => {
      // Small timeout to allow browser to calculate updated dimensions
      setTimeout(() => {
        checkViewportAndShow(false);
      }, 150);
    };

    const handleCustomOpen = () => {
      checkViewportAndShow(true);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('nexaos:open-desktop-notice', handleCustomOpen);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('nexaos:open-desktop-notice', handleCustomOpen);
    };
  }, [checkViewportAndShow]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  // Prevent hydration mismatch
  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-notice-title"
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
          onClick={handleDismiss}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 my-auto"
        >
          {/* Subtle top gradient accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-600" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Close notification and continue on mobile"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {view === 'notice' ? (
            /* ================= VIEW 1: MAIN NOTICE ================= */
            <div className="p-6 sm:p-8 space-y-6">
              {/* Visual Icon Illustration */}
              <div className="flex items-center justify-center pt-2">
                <div className="relative flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 rounded-2xl">
                  {/* Laptop Icon Badge (Hero) */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <Laptop className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 mt-1 uppercase tracking-wider">
                      Recommended
                    </span>
                  </div>

                  {/* Transfer / Comparison Arrow */}
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-1">
                    <div className="h-px w-6 bg-slate-300 dark:bg-slate-700" />
                    <Sparkles className="w-4 h-4 text-violet-500 my-1" />
                    <div className="h-px w-6 bg-slate-300 dark:bg-slate-700" />
                  </div>

                  {/* Mobile Device Icon Badge */}
                  <div className="flex flex-col items-center">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <Smartphone className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                      Compact
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Copy */}
              <div className="text-center space-y-2.5">
                <h2 
                  id="desktop-notice-title" 
                  className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                >
                  Designed for the Best Experience on Desktop
                </h2>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  This platform includes advanced dashboards, interactive charts, detailed tables, and powerful tools that work best on a larger screen. For the complete experience, we recommend opening this website on a laptop or desktop.
                </p>
              </div>

              {/* Feature Highlights Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Full Analytics & Charts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Drag & Drop Kanban</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Invoice Generator</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Workflow Automation</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-violet-500/20 transition-all duration-150 cursor-pointer min-h-[44px]"
                >
                  <span>Continue on Mobile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setView('instructions')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl transition-all duration-150 cursor-pointer min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4 text-violet-500" />
                  <span>How to Enable Desktop Mode</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= VIEW 2: DESKTOP MODE INSTRUCTIONS ================= */
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header with back navigation */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setView('notice')}
                  className="p-1 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Back to previous notice"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    How to Enable Desktop Mode
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Switch your mobile browser to display full desktop layout
                  </p>
                </div>
              </div>

              {/* Instructions Guides */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {/* Google Chrome Instructions */}
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>For Google Chrome (Android):</span>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                    <li>
                      Open the browser menu using the <strong className="font-semibold text-slate-900 dark:text-white">three-dot icon (⋮)</strong> in the top right.
                    </li>
                    <li>
                      Enable <strong className="font-semibold text-slate-900 dark:text-white">&ldquo;Desktop site&rdquo;</strong> in the menu options.
                    </li>
                    <li>
                      Refresh the webpage if it does not reload automatically.
                    </li>
                  </ol>
                </div>

                {/* Safari Instructions */}
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <span>For Safari (iPhone):</span>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                    <li>
                      Tap the <strong className="font-semibold text-slate-900 dark:text-white">&ldquo;aA&rdquo;</strong> button located in the address bar.
                    </li>
                    <li>
                      Select <strong className="font-semibold text-slate-900 dark:text-white">&ldquo;Request Desktop Website&rdquo;</strong> from the popover menu.
                    </li>
                    <li>
                      Refresh the page if necessary.
                    </li>
                  </ol>
                </div>

                {/* Technical Note */}
                <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg p-3">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Note: Desktop mode is a browser feature that must be toggled in your browser menu. Websites cannot automatically modify your browser settings.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-violet-500/20 transition-all duration-150 cursor-pointer min-h-[44px]"
                >
                  <span>Got It</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView('notice')}
                  className="w-full text-center py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Back to Notice
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
