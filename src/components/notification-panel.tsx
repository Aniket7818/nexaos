'use client'
import { useStore } from '@/store'
import { formatDate } from '@/lib/utils'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const notifications = useStore((s) => s.notifications) ?? []
  const markRead = useStore((s) => s.markNotificationRead)
  const markAllRead = useStore((s) => s.markAllNotificationsRead)
  const clearAll = useStore((s) => s.clearNotifications)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])
  
  const typeColors: Record<string, string> = {
    'overdue-invoice': 'bg-red-500',
    'deadline': 'bg-amber-500',
    'new-lead': 'bg-violet-500',
    'completed-task': 'bg-emerald-500',
    'project-update': 'bg-blue-500',
    'automation': 'bg-cyan-500',
    'payment': 'bg-green-500',
    'general': 'bg-slate-500',
  }
  
  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={markAllRead} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Mark all as read">
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={clearAll} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Clear all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No notifications</p>
          </div>
        ) : (
          <ul>
            {notifications.slice(0, 20).map((n) => (
              <li
                key={n.id}
                className={`flex gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  !n.isRead ? 'bg-violet-50/50 dark:bg-violet-950/10' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${typeColors[n.type] ?? 'bg-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(n.createdAt, 'dd MMM · HH:mm')}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="flex-shrink-0 text-violet-500 hover:text-violet-700"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
