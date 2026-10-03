import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { ToastProvider } from '@/components/ui/toast'
import { DesktopExperienceNotice } from '@/components/mobile/desktop-experience-notice'
import { DashboardFooter } from '@/components/layout/footer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto w-full pb-10">
            {children}
            <DashboardFooter />
          </div>
        </main>
      </div>
      <ToastProvider />
      <DesktopExperienceNotice />
    </div>
  )
}
