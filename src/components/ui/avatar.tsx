import React from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base font-bold',
};

const COLOR_PALETTES = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
];

function getColorForName(name: string = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTES[Math.abs(hash) % COLOR_PALETTES.length];
}

export function Avatar({ name = '', avatar, size = 'md', className }: AvatarProps) {
  const isImage = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/') || avatar.startsWith('data:'));
  const initials = avatar && avatar.length <= 3 && !avatar.includes('/') 
    ? avatar 
    : (name ? getInitials(name) : '?');

  if (isImage) {
    return (
      <div className={cn('relative rounded-full overflow-hidden shrink-0 ring-1 ring-slate-200 dark:ring-slate-700', sizeClasses[size], className)}>
        <img src={avatar!} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  const colorClass = getColorForName(name);

  return (
    <div
      title={name}
      className={cn(
        'rounded-full shrink-0 flex items-center justify-center font-semibold select-none ring-1 ring-slate-200/50 dark:ring-slate-700/50',
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
