'use client'
import { useStore, calcInvoiceTotal } from '@/store'
import { formatCurrency } from '@/lib/utils'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { 
  IndianRupee, Users, FolderKanban, CheckSquare, 
  TrendingUp, TrendingDown, ArrowRight, Plus
} from 'lucide-react'
import Link from 'next/link'

export function OverviewPage() {
  const invoices = useStore(s => s.invoices) ?? []
  const clients = useStore(s => s.clients) ?? []
  const projects = useStore(s => s.projects) ?? []
  const tasks = useStore(s => s.tasks) ?? []

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + calcInvoiceTotal(i).total, 0)

  const outstandingInvoices = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'draft' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + calcInvoiceTotal(i).total, 0)

  const activeClients = clients.filter(c => c.status === 'active').length
  const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'planning').length
  const tasksCompleted = tasks.filter(t => t.status === 'done').length

  const recentTransactions = invoices
    .filter(i => i.status === 'paid')
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5)
    
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'done' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  // Dummy chart data for UI
  const revenueData = [
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 48000 },
    { name: 'Apr', revenue: 61000 },
    { name: 'May', revenue: 59000 },
    { name: 'Jun', revenue: 67000 },
  ]
  
  const incomeExpenseData = [
    { name: 'Jan', income: 45000, expenses: 24000 },
    { name: 'Feb', income: 52000, expenses: 22000 },
    { name: 'Mar', income: 48000, expenses: 28000 },
    { name: 'Apr', income: 61000, expenses: 31000 },
  ]

  const stats = [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(totalRevenue), 
      trend: '+12.5%', 
      positive: true,
      icon: IndianRupee
    },
    { 
      label: 'Outstanding', 
      value: formatCurrency(outstandingInvoices), 
      trend: '-2.4%', 
      positive: true, // less outstanding is good
      icon: TrendingDown
    },
    { 
      label: 'Active Clients', 
      value: activeClients, 
      trend: '+2 this month', 
      positive: true,
      icon: Users
    },
    { 
      label: 'Active Projects', 
      value: activeProjects, 
      trend: '+5 this month', 
      positive: true,
      icon: FolderKanban
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input max-w-xs text-sm py-1.5">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <Link href="/projects/new" className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
            <div className={`text-xs font-medium flex items-center gap-1 ${stat.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white">Revenue Overview</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue'] as any}
                />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-white">Income vs Expenses</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => formatCurrency(Number(value) || 0) as any}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
            <Link href="/payments" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(inv => {
                const client = clients.find(c => c.id === inv.clientId)
                return (
                  <div key={inv.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{client?.companyName || 'Unknown Client'}</p>
                      <p className="text-xs text-slate-500">Invoice #{inv.invoiceNumber} • {new Date(inv.issueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(calcInvoiceTotal(inv).total)}</p>
                      <span className="badge badge-green mt-1">Paid</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">No recent transactions.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
            <Link href="/tasks" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map(task => {
                const project = projects.find(p => p.id === task.projectId)
                return (
                  <div key={task.id} className="p-4 flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{project?.name || 'No Project'} • Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">No upcoming deadlines!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
