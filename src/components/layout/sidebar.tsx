'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'
import {
  LayoutDashboard, Users, Building2, FolderKanban, CheckSquare,
  FileText, CreditCard, UsersRound, Zap, BarChart3, FolderOpen,
  Settings, ChevronLeft, ChevronRight, Briefcase, X, Pin, PanelLeftOpen, PanelLeftClose
} from 'lucide-react'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, href: '/' },
  { label: 'CRM', icon: Users, href: '/crm' },
  { label: 'Clients', icon: Building2, href: '/clients' },
  { label: 'Projects', icon: FolderKanban, href: '/projects' },
  { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { label: 'Invoices', icon: FileText, href: '/invoices' },
  { label: 'Payments', icon: CreditCard, href: '/payments' },
  { label: 'Team', icon: UsersRound, href: '/team' },
  { label: 'Automations', icon: Zap, href: '/automations' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Documents', icon: FolderOpen, href: '/documents' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const mobileOpen = useStore((s) => s.mobileSidebarOpen) ?? false
  const setMobileOpen = useStore((s) => s.setMobileSidebarOpen)
  const pathname = usePathname()

  const [isHovered, setIsHovered] = useState(false)

  // When unpinned and hovered, we show the expanded state
  const isExpanded = !collapsed || isHovered

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen?.(false)
    setIsHovered(false)
  }, [pathname, setMobileOpen])

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileOpen) {
        setMobileOpen?.(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileOpen, setMobileOpen])

  return (
    <>
      {/* ── DESKTOP SIDEBAR CONTAINER (EXPANDABLE) ────────────────────── */}
      <div 
        className={cn(
          "hidden md:block transition-all duration-300 relative shrink-0 z-30 h-full",
          collapsed ? "w-16" : "w-64"
        )}
        onMouseEnter={() => {
          if (collapsed) setIsHovered(true)
        }}
        onMouseLeave={() => {
          if (collapsed) setIsHovered(false)
        }}
      >
        <aside 
          className={cn(
            'flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 h-full',
            collapsed 
              ? (isHovered 
                  ? 'w-64 shadow-2xl absolute left-0 top-0 bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md' 
                  : 'w-16')
              : 'w-64'
          )}
        >
          {/* Header & Logo */}
          <div className={cn(
            'flex items-center h-16 px-3.5 border-b border-slate-200 dark:border-slate-800 transition-all',
            isExpanded ? 'justify-between' : 'justify-center'
          )}>
            {/* Logo + Brand Name */}
            <div className="flex items-center gap-2.5 overflow-hidden">
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-9 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
                title={collapsed ? "Click to expand sidebar" : "Click to collapse sidebar"}
                aria-label={collapsed ? "Click to expand sidebar" : "Click to collapse sidebar"}
              >
                <Briefcase className="w-4 h-4 text-white" />
              </button>

              {isExpanded && (
                <div className="flex flex-col animate-in fade-in duration-200">
                  <span className="text-base font-bold text-slate-900 dark:text-white leading-tight">NexaOS</span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-tight">Business OS</span>
                </div>
              )}
            </div>

            {/* Pin / Collapse Toggle Button */}
            {isExpanded && (
              <div className="flex items-center gap-1">
                {collapsed && isHovered && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleSidebar()
                      setIsHovered(false)
                    }}
                    className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/50 text-violet-600 dark:text-violet-400 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="Pin sidebar open"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Pin</span>
                  </button>
                )}
                {!collapsed && (
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Nav links */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive 
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white',
                    !isExpanded && 'justify-center px-0'
                  )}
                  title={!isExpanded ? item.label : undefined}
                >
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"
                  )} />
                  {isExpanded && (
                    <span className="truncate animate-in fade-in duration-150">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Bottom Expand Toggle when Collapsed & not hovered */}
          {!isExpanded && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Desktop Footer (Visible when expanded) */}
          {isExpanded && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Designed & Developed by{' '}
                <a
                  href={BRAND.developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                >
                  {BRAND.developer}
                </a>
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ── MOBILE DRAWER NAVIGATION ──────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen?.(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">NexaOS</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen?.(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen?.(false)}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 text-center">
              <p>
                Designed & Developed by{' '}
                <a
                  href={BRAND.developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                >
                  {BRAND.developer}
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
