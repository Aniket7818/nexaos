'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { Search, X, Building2, Users, FolderKanban, CheckSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  type: string
  label: string
  sublabel: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const clients = useStore((s) => s.clients) ?? []
  const leads = useStore((s) => s.leads) ?? []
  const projects = useStore((s) => s.projects) ?? []
  const tasks = useStore((s) => s.tasks) ?? []
  const invoices = useStore((s) => s.invoices) ?? []
  
  useEffect(() => {
    inputRef.current?.focus()
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])
  
  const q = query.toLowerCase().trim()
  
  const results: SearchResult[] = q.length < 2 ? [] : [
    ...clients.filter(c =>
      c.companyName.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    ).slice(0, 3).map(c => ({
      type: 'Client',
      label: c.companyName,
      sublabel: c.contactPerson,
      href: `/clients/${c.id}`,
      icon: Building2,
    })),
    ...leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q)
    ).slice(0, 3).map(l => ({
      type: 'Lead',
      label: l.name,
      sublabel: l.company,
      href: '/crm',
      icon: Users,
    })),
    ...projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    ).slice(0, 3).map(p => ({
      type: 'Project',
      label: p.name,
      sublabel: p.status,
      href: `/projects/${p.id}`,
      icon: FolderKanban,
    })),
    ...tasks.filter(t =>
      t.title.toLowerCase().includes(q)
    ).slice(0, 3).map(t => ({
      type: 'Task',
      label: t.title,
      sublabel: t.status,
      href: '/tasks',
      icon: CheckSquare,
    })),
    ...invoices.filter(i =>
      i.invoiceNumber.toLowerCase().includes(q)
    ).slice(0, 2).map(i => ({
      type: 'Invoice',
      label: i.invoiceNumber,
      sublabel: i.status,
      href: '/invoices',
      icon: FileText,
    })),
  ]
  
  const handleSelect = (href: string) => {
    router.push(href)
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, leads, projects, tasks..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {q.length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Type at least 2 characters to search...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No results found for "{query}"
            </div>
          ) : (
            <ul className="py-2">
              {results.map((result, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleSelect(result.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  >
                    <div className="w-8 h-8 bg-violet-100 dark:bg-violet-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <result.icon className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{result.label}</p>
                      <p className="text-xs text-slate-500 capitalize">{result.type} · {result.sublabel}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}
