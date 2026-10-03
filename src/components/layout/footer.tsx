'use client';

import React from 'react';
import { BRAND } from '@/lib/constants';
import { Monitor } from 'lucide-react';
import { openDesktopExperienceNotice } from '@/components/mobile/desktop-experience-notice';

export function DashboardFooter() {
  return (
    <footer className="mt-16 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
      <p>
        NexaOS &copy; {new Date().getFullYear()} • Designed &amp; Developed by{' '}
        <a
          href={BRAND.developerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 dark:text-violet-400 hover:underline font-semibold"
        >
          {BRAND.developer}
        </a>
      </p>

      <button
        type="button"
        onClick={() => openDesktopExperienceNotice()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        title="View information about the recommended desktop experience"
      >
        <Monitor className="w-3.5 h-3.5 text-violet-500" />
        <span>Desktop Experience Notice</span>
      </button>
    </footer>
  );
}
