'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store'
import { Bell, Search, Sun, Moon, User, LogOut, Settings, ChevronDown, Menu, PanelLeft } from 'lucide-react'
import { SearchModal } from '@/components/search-modal'
import { NotificationPanel } from '@/components/notification-panel'
import { cn } from '@/lib/utils'

const routeLabels: Record<string, string> = {
  '/': 'Overview',
  '/crm': 'CRM & Leads',
  '/clients': 'Clients',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/team': 'Team',
  '/automations': 'Automations',
  '/analytics': 'Analytics',
  '/documents': 'Documents',
  '/settings': 'Settings',
}

export function Topbar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const toggleMobileSidebar = useStore((s) => s.toggleMobileSidebar)
  const notifications = useStore((s) => s.notifications)
  const settings = useStore((s) => s.settings)
  const team = useStore((s) => s.team)
  
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0
  const owner = team?.find((m) => m.role === 'owner')
  
  // Determine current page label
  const getLabel = () => {
    for (const [path, label] of Object.entries(routeLabels)) {
      if (path === '/') {
        if (pathname === '/') return label
      } else if (pathname?.startsWith(path)) {
        return label
      }
    }
    return 'NexaOS'
  }
  
  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        {/* Left: Mobile hamburger menu & Desktop sidebar toggle & Page title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                toggleMobileSidebar?.()
              } else {
                toggleSidebar()
              }
            }}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle navigation sidebar"
          >
            <PanelLeft className="w-5 h-5 hidden md:block" />
            <Menu className="w-5 h-5 md:hidden" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">{getLabel()}</h1>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm text-slate-400 hidden md:block">Search...</span>
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>
          
          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Profile menu"
            >
              <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {owner?.avatar ?? 'AS'}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:block">{owner?.name ?? 'Admin'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{owner?.name ?? 'Admin'}</p>
                  <p className="text-xs text-slate-500">{owner?.email ?? 'admin@example.com'}</p>
                </div>
                <a href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Settings className="w-4 h-4" />
                  Settings
                </a>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <LogOut className="w-4 h-4" />
                  Sign Out (Demo)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  )
}
