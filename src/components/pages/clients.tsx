'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  LayoutGrid, 
  List as ListIcon,
  Phone,
  Mail,
  MapPin,
  Globe
} from 'lucide-react';
import { useStore } from '@/store';
import { formatCurrency } from '@/lib/utils';
import type { Client } from '@/types';

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
  id: z.string().optional(),
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

export function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, generateId } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'prospect',
    }
  });

  const filteredClients = useMemo(() => {
    return clients.filter((client: Client) => {
      const cName = client.name || client.companyName || '';
      const matchesSearch = cName.toLowerCase().includes(search.toLowerCase()) || 
                            client.contactPerson.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || client.status === statusFilter.toLowerCase();
      const matchesIndustry = industryFilter === 'All' || client.industry === industryFilter;
      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [clients, search, statusFilter, industryFilter]);

  const openAddModal = () => {
    setEditingClient(null);
    reset({ status: 'prospect' });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name || client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      website: client.website,
      industry: client.industry,
      address: client.address,
      city: client.city,
      country: client.country,
      status: client.status,
      notes: client.notes,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: ClientFormValues) => {
    if (editingClient) {
      updateClient(editingClient.id, {
        name: data.name,
        companyName: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone || '',
        website: data.website || '',
        industry: data.industry || 'Other',
        address: data.address || '',
        city: data.city || '',
        country: data.country || '',
        status: data.status,
        notes: data.notes || '',
      });
    } else {
      addClient({
        name: data.name,
        companyName: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone || '',
        website: data.website || '',
        industry: data.industry || 'Other',
        address: data.address || '',
        city: data.city || '',
        country: data.country || '',
        status: data.status,
        totalRevenue: 0,
        notes: data.notes || '',
        tags: [],
      });
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'churned': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Clients
            <span className="badge-primary text-sm font-normal py-0.5 px-2 rounded-full">
              {clients.length}
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage your client relationships and details.
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search clients..."
            className="input pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            className="input" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Prospect">Prospect</option>
            <option value="Churned">Churned</option>
          </select>
          <select 
            className="input" 
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="All">All Industries</option>
            {INDUSTRIES.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded ${view === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded ${view === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No clients found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by adding your first client.</p>
          <button onClick={openAddModal} className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} /> Add Client
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client: Client) => (
            <div key={client.id} className="card hover:border-violet-500 dark:hover:border-violet-500 transition-colors group relative">
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 z-10">
                <button 
                  onClick={() => openEditModal(client)}
                  className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow hover:text-primary-600"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => setClientToDelete(client.id)}
                  className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <Link href={`/clients/${client.id}`} className="block p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {(client.name || client.companyName || 'CL').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{client.name || client.companyName}</h3>
                    <p className="text-sm text-gray-500">{client.contactPerson}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail size={14} />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone size={14} />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(client.status)}`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                    {client.industry && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {client.industry}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(client.totalRevenue || 0)}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Revenue</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client: Client) => (
                  <tr key={client.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(client.name || client.companyName || 'CL').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{client.name || client.companyName}</div>
                          <div className="text-xs text-gray-500">{client.industry}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white">{client.contactPerson}</div>
                      <div className="text-xs">{client.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(client.status)}`}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {formatCurrency(client.totalRevenue || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(client)} className="text-gray-400 hover:text-primary-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setClientToDelete(client.id)} className="text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingClient ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Client?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete this client? This action cannot be undone and may affect related projects and invoices.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setClientToDelete(null)} className="btn-secondary flex-1">
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
