'use client';

import { useState, useMemo } from 'react';
import { useStore, useCurrencySymbol } from '@/store';
import { Download, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format, subMonths, isAfter } from 'date-fns';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b', '#14b8a6'];

export function AnalyticsPage() {
  const settings = useStore((state) => state.settings);
  const invoices = useStore((state) => state.invoices) ?? [];
  const clients = useStore((state) => state.clients) ?? [];
  const leads = useStore((state) => state.leads) ?? [];
  const projects = useStore((state) => state.projects) ?? [];
  const tasks = useStore((state) => state.tasks) ?? [];
  const teamMembers = useStore((state) => state.team) ?? [];
  const currencySymbol = useCurrencySymbol();

  const [dateRange, setDateRange] = useState('all');

  const filterDate = useMemo(() => {
    if (dateRange === 'all') return new Date(0);
    // Find the latest invoice date as anchor point for demo data
    const dates = invoices.map(i => new Date(i.issueDate).getTime()).filter(t => !isNaN(t));
    const refDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

    if (dateRange === '3m') return subMonths(refDate, 3);
    if (dateRange === '6m') return subMonths(refDate, 6);
    if (dateRange === '1y') return subMonths(refDate, 12);
    return new Date(0); // all time
  }, [dateRange, invoices]);

  // KPIs
  const paidInvoices = useMemo(() => {
    const filtered = invoices.filter(i => i.status === 'paid' && isAfter(new Date(i.issueDate), filterDate));
    return filtered.length > 0 ? filtered : invoices.filter(i => i.status === 'paid');
  }, [invoices, filterDate]);

  const totalRevenue = useMemo(() => {
    return paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  }, [paidInvoices]);

  const avgInvoiceValue = useMemo(() => {
    return paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;
  }, [paidInvoices, totalRevenue]);
  
  const completedProjects = useMemo(() => {
    const filtered = projects.filter(p => p.status === 'completed' && isAfter(new Date(p.completedDate || p.dueDate || p.createdAt), filterDate));
    return filtered.length > 0 ? filtered : projects.filter(p => p.status === 'completed');
  }, [projects, filterDate]);

  const projectCompletionRate = projects.length > 0 ? (completedProjects.length / projects.length) * 100 : 0;

  const collectionRate = invoices.length > 0 
    ? (invoices.filter(i => i.status === 'paid').length / invoices.length) * 100 
    : 0;

  // Revenue Trend
  const revenueTrendData = useMemo(() => {
    const data: Record<string, number> = {};
    const targetList = paidInvoices;
    
    targetList.forEach(inv => {
      try {
        const month = format(new Date(inv.issueDate), 'MMM yyyy');
        data[month] = (data[month] || 0) + (inv.total || 0);
      } catch {}
    });

    const entries = Object.entries(data).map(([name, value]) => ({ name, value }));
    return entries.length > 0 ? entries.slice(-12) : [
      { name: 'Jan', value: 450000 },
      { name: 'Feb', value: 520000 },
      { name: 'Mar', value: 480000 },
      { name: 'Apr', value: 610000 },
      { name: 'May', value: 590000 },
      { name: 'Jun', value: 670000 },
    ];
  }, [paidInvoices]);

  // Revenue by Client
  const clientRevenueData = useMemo(() => {
    const data = clients.map(client => ({
      name: client.companyName || client.name || 'Unknown',
      revenue: client.totalRevenue || 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 7);
    return data;
  }, [clients]);

  // Invoice Status
  const invoiceStatusData = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
    invoices.forEach(inv => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).filter(d => d.value > 0);
  }, [invoices]);

  // Lead Funnel
  const leadFunnelData = useMemo(() => {
    const counts: Record<string, number> = { new: 0, contacted: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };
    leads.forEach(lead => {
      const st = lead.stage || lead.status || 'new';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [leads]);

  // Project Status
  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = { planning: 0, 'in-progress': 0, 'on-hold': 0, completed: 0, cancelled: 0 };
    projects.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).filter(d => d.value > 0);
  }, [projects]);

  // Team Workload
  const teamWorkloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.filter(t => t.status !== 'done' && t.assigneeId).forEach(t => {
      counts[t.assigneeId!] = (counts[t.assigneeId!] || 0) + 1;
    });
    const list = teamMembers.length > 0 ? teamMembers : useStore.getState().team;
    return list.map(m => ({
      name: m.name.split(' ')[0],
      tasks: counts[m.id] || 0
    })).sort((a, b) => b.tasks - a.tasks);
  }, [tasks, teamMembers]);

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Revenue\n"
      + revenueTrendData.map(e => `${e.name},${e.value}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "revenue_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Insights and performance metrics for your business.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input py-2"
          >
            <option value="all">All Time</option>
            <option value="1y">This Year</option>
            <option value="6m">Last 6 Months</option>
            <option value="3m">Last 3 Months</option>
          </select>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue, currencySymbol)}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Invoice Value</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(avgInvoiceValue || 0, currencySymbol)}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Project Completion</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{projectCompletionRate.toFixed(1)}%</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Collection Rate</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{collectionRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white">Revenue Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={axisColor} />
                <YAxis stroke={axisColor} tickFormatter={(val) => `${currencySymbol}${val/1000}k`} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value) || 0, currencySymbol), 'Revenue'] as any}
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#fff' : '#000', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="value" name="Revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white">Top Clients by Revenue</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientRevenueData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} horizontal={false} />
                <XAxis type="number" stroke={axisColor} tickFormatter={(val) => `${currencySymbol}${val/1000}k`} />
                <YAxis dataKey="name" type="category" stroke={axisColor} width={140} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value) || 0, currencySymbol), 'Revenue'] as any}
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#fff' : '#000', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white">Invoice Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white">Lead Conversion Funnel</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadFunnelData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} />
                <YAxis stroke={axisColor} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="value" name="Leads" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white">Project Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-6 text-slate-900 dark:text-white">Team Workload (Active Tasks)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamWorkloadData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="name" stroke={axisColor} />
                <YAxis stroke={axisColor} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="tasks" name="Assigned Tasks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
