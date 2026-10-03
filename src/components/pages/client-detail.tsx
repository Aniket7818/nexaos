'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Edit, 
  ChevronLeft,
  Briefcase,
  FileText,
  Clock,
  ArrowUpRight,
  Trash2
} from 'lucide-react';
import { useStore, calcInvoiceTotal } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Client, Project, Invoice, Activity } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Consulting',
  'Other'
];

const clientSchema = z.object({
  name: z.string().min(1, 'Company Name is required'),
  contactPerson: z.string().min(1, 'Contact Person is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'churned']),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { clients, projects, invoices, activities = [], tasks = [], updateClient, deleteClient } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'invoices' | 'activity'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const client = clients.find(c => c.id === clientId) as Client | undefined;
  
  const clientProjects = useMemo(() => projects.filter(p => p.clientId === clientId), [projects, clientId]);
  const clientInvoices = useMemo(() => invoices.filter(i => i.clientId === clientId), [invoices, clientId]);
  const clientActivities = useMemo(() => (activities || []).filter(a => a.clientId === clientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [activities, clientId]);

  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      name: client.name || client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      website: client.website,
      industry: client.industry,
      address: client.address,
      city: client.city,
      country: client.country,
      status: client.status as any,
      notes: client.notes,
    } : {}
  });

  if (!client) {
    return notFound();
  }

  const activeProjectsCount = clientProjects.filter(p => p.status === 'in-progress' || p.status === 'planning').length;
  const outstandingAmount = clientInvoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (inv.total || calcInvoiceTotal(inv).total || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'churned': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const onSubmit = (data: ClientFormValues) => {
    updateClient(clientId, data);
    setIsEditModalOpen(false);
  };

  const confirmDelete = () => {
    deleteClient(clientId);
    router.push('/clients');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/clients" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-2xl flex-shrink-0">
              {(client.name || client.companyName || 'CL').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {client.name || client.companyName}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(client.status)}`}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Building2 size={16} /> {client.industry || 'No Industry Specified'}
                {client.website && (
                  <>
                    <span className="text-gray-300 mx-2">•</span>
                    <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                      <Globe size={16} /> Website
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <Edit size={16} /> Edit
          </button>
          <button onClick={() => setIsDeleteModalOpen(true)} className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30 flex items-center gap-2">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {(['overview', 'projects', 'invoices', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                    <p className="font-medium text-gray-900 dark:text-white">{client.contactPerson}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <a href={`mailto:${client.email}`} className="text-primary-600 hover:underline">{client.email}</a>
                    </div>
                  </div>
                  {client.phone && (
                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <a href={`tel:${client.phone}`} className="text-gray-900 dark:text-white hover:underline">{client.phone}</a>
                      </div>
                    </div>
                  )}
                  {(client.address || client.city || client.country) && (
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Address</p>
                        <p className="text-gray-900 dark:text-white">
                          {[client.address, client.city, client.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {client.notes && (
                <div className="card p-6 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(client.totalRevenue || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Active Projects</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{activeProjectsCount}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Invoices</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{clientInvoices.length}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Outstanding</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(outstandingAmount)}</p>
                </div>
              </div>

              {/* Recent Projects */}
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Recent Projects</h3>
                  <button onClick={() => setActiveTab('projects')} className="text-sm text-primary-600 hover:underline">View all</button>
                </div>
                {clientProjects.length > 0 ? (
                  <div className="space-y-3">
                    {clientProjects.slice(0, 3).map(project => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded shadow-sm text-primary-600">
                            <Briefcase size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{project.name}</p>
                            <p className="text-xs text-gray-500">Due {formatDate(project.endDate)}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getProjectStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No projects found.</p>
                )}
              </div>

              {/* Recent Invoices */}
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Recent Invoices</h3>
                  <button onClick={() => setActiveTab('invoices')} className="text-sm text-primary-600 hover:underline">View all</button>
                </div>
                {clientInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {clientInvoices.slice(0, 3).map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded shadow-sm text-gray-500">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-gray-500">Due {formatDate(invoice.dueDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{formatCurrency(invoice.total || calcInvoiceTotal(invoice).total || 0)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No invoices found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Projects</h3>
            {clientProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Project Name</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Budget</th>
                      <th className="px-4 py-3 font-medium">Deadline</th>
                      <th className="px-4 py-3 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {clientProjects.map(project => {
                      const pTasks = tasks.filter(t => t.projectId === project.id);
                      const pDone = pTasks.filter(t => t.status === 'done').length;
                      const pProgress = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                      return (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{project.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${getProjectStatusColor(project.status)}`}>
                            {project.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatCurrency(project.budget)}</td>
                        <td className="px-4 py-3">{formatDate(project.dueDate || project.endDate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${pProgress}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-500 w-8">{pProgress}%</span>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Briefcase size={32} className="mx-auto mb-3 text-gray-400" />
                <p>No projects found for this client.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Invoices</h3>
            {clientInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Invoice #</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Issue Date</th>
                      <th className="px-4 py-3 font-medium">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {clientInvoices.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(invoice.total || calcInvoiceTotal(invoice).total || 0)}</td>
                        <td className="px-4 py-3">{formatDate(invoice.issueDate)}</td>
                        <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText size={32} className="mx-auto mb-3 text-gray-400" />
                <p>No invoices found for this client.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity History</h3>
            {clientActivities.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {clientActivities.map((activity, index) => (
                  <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary-500 text-white group-[.is-active]:text-primary-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Clock size={16} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-4 !m-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white">{activity.title}</h4>
                        <time className="text-xs font-medium text-primary-500">{formatDate(activity.createdAt)}</time>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock size={32} className="mx-auto mb-3 text-gray-400" />
                <p>No activity recorded yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Client</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Company Name *</label>
                  <input {...register('name')} className="input" placeholder="Acme Inc." />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Contact Person *</label>
                  <input {...register('contactPerson')} className="input" placeholder="John Doe" />
                  {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson.message}</p>}
                </div>
                
                <div>
                  <label className="label">Email *</label>
                  <input {...register('email')} type="email" className="input" placeholder="john@acme.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input {...register('phone')} className="input" placeholder="+1 (555) 000-0000" />
                </div>
                
                <div>
                  <label className="label">Website</label>
                  <input {...register('website')} className="input" placeholder="https://acme.com" />
                </div>
                <div>
                  <label className="label">Industry</label>
                  <select {...register('industry')} className="input">
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Status</label>
                  <select {...register('status')} className="input">
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="label">Address</label>
                  <input {...register('address')} className="input mb-3" placeholder="Street Address" />
                  <div className="grid grid-cols-2 gap-4">
                    <input {...register('city')} className="input" placeholder="City" />
                    <input {...register('country')} className="input" placeholder="Country" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <textarea {...register('notes')} className="input min-h-[100px]" placeholder="Additional details..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Client?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete {client.name}? This action cannot be undone and may affect related projects and invoices.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-primary bg-red-600 hover:bg-red-700 flex-1">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
