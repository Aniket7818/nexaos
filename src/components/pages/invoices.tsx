'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useStore } from '@/store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice, InvoiceStatus, InvoiceItem } from '@/types'
import { calcInvoiceTotal } from '@/store'
import { 
  Search, Plus, FileText, MoreVertical, Eye, Edit, Trash2, 
  IndianRupee, TrendingUp, X, Clock, Calendar, PlusCircle
} from 'lucide-react'

const cn = (...c: (string|undefined|null|false)[]) => c.filter(Boolean).join(' ')

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
}

export function InvoicesPage() {
  const { invoices, clients, projects, addInvoice, updateInvoice, deleteInvoice } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  // Computed summary
  const summary = useMemo(() => {
    let total = 0, paid = 0, outstanding = 0, overdue = 0
    invoices.forEach(inv => {
      const invTotal = calcInvoiceTotal(inv.items, inv.discount)
      if (inv.status !== 'cancelled') total += invTotal
      if (inv.status === 'paid') paid += invTotal
      if (inv.status === 'sent') outstanding += invTotal
      if (inv.status === 'overdue') overdue += invTotal
    })
    return { total, paid, outstanding, overdue }
  }, [invoices])

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const client = clients.find(c => c.id === inv.clientId)
      const invNum = inv.number || inv.invoiceNumber || ''
      const clientName = client?.name || client?.companyName || ''
      const matchesSearch = invNum.toLowerCase().includes(search.toLowerCase()) || 
                            clientName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
      return matchesSearch && matchesStatus
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, clients, search, statusFilter])

  const openEditModal = (inv: Invoice) => {
    setEditingInvoice(inv)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and track your invoices</p>
        </div>
        <button 
          onClick={() => { setEditingInvoice(null); setIsModalOpen(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex flex-col gap-2 border-l-4 border-l-blue-500">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Invoiced</span>
          <span className="text-2xl font-bold">{formatCurrency(summary.total)}</span>
        </div>
        <div className="card p-6 flex flex-col gap-2 border-l-4 border-l-green-500">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Paid</span>
          <span className="text-2xl font-bold">{formatCurrency(summary.paid)}</span>
        </div>
        <div className="card p-6 flex flex-col gap-2 border-l-4 border-l-amber-500">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding</span>
          <span className="text-2xl font-bold">{formatCurrency(summary.outstanding)}</span>
        </div>
        <div className="card p-6 flex flex-col gap-2 border-l-4 border-l-red-500">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue</span>
          <span className="text-2xl font-bold">{formatCurrency(summary.overdue)}</span>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
            {(['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap capitalize transition-colors",
                  statusFilter === status 
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Invoice #</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Client</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Issue Date</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Due Date</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm text-right">Amount</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Status</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const client = clients.find(c => c.id === inv.clientId)
                  const total = calcInvoiceTotal(inv.items, inv.discount)
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="p-4">
                        <Link href={`/invoices/${inv.id}`} className="font-medium text-blue-600 hover:underline">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="p-4 font-medium text-slate-900 dark:text-white">{client?.name || 'Unknown Client'}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{formatDate(inv.issueDate)}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{formatDate(inv.dueDate)}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(total)}</td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider", STATUS_COLORS[inv.status])}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/invoices/${inv.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => openEditModal(inv)} className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/30">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <InvoiceModal 
          invoice={editingInvoice}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}

function InvoiceModal({ invoice, onClose }: { invoice: Invoice | null, onClose: () => void }) {
  const { clients, projects, addInvoice, updateInvoice, invoices } = useStore()
  
  const [formData, setFormData] = useState<Partial<Invoice>>(
    invoice || {
      number: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      clientId: '',
      projectId: undefined,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, taxPercent: 0, taxRate: 0 }],
      discount: 0,
      notes: '',
      terms: 'Payment due within 14 days.',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  )

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => item.id === id ? { ...item, [field]: value } : item)
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, taxPercent: 0, taxRate: 0 }]
    }))
  }

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== id)
    }))
  }

  const subtotal = formData.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0
  const tax = formData.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (((item.taxRate ?? item.taxPercent) || 0) / 100)), 0) || 0
  const discountAmount = ((subtotal + tax) * (formData.discount || 0)) / 100
  const total = subtotal + tax - discountAmount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientId) {
      alert('Client is required')
      return
    }
    
    if (invoice) {
      updateInvoice(invoice.id, { ...formData, updatedAt: new Date().toISOString() } as Invoice)
    } else {
      addInvoice({ ...formData, id: crypto.randomUUID() } as Invoice)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 my-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">{invoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="invoice-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="label">Invoice Number</label>
                <input 
                  type="text" 
                  className="input" 
                  value={formData.number}
                  onChange={e => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label">Status</label>
                <select 
                  className="input" 
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label">Issue Date</label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.issueDate?.split('T')[0]}
                  onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label">Due Date</label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.dueDate?.split('T')[0]}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label">Client</label>
                <select 
                  className="input" 
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  required
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="label">Project (Optional)</label>
                <select 
                  className="input" 
                  value={formData.projectId || ''}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value || undefined })}
                >
                  <option value="">None</option>
                  {projects.filter(p => !formData.clientId || p.clientId === formData.clientId).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Line Items</h3>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Tax %</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>
                
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {formData.items?.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                      <div className="col-span-5">
                        <input 
                          type="text" 
                          placeholder="Item description" 
                          className="input w-full"
                          value={item.description}
                          onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          min="1" 
                          className="input w-full"
                          value={item.quantity}
                          onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          className="input w-full"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          min="0" 
                          max="100" 
                          className="input w-full"
                          value={item.taxRate}
                          onChange={e => handleItemChange(item.id, 'taxRate', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button 
                          type="button" 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={addItem}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Add Line Item
              </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="w-full md:w-1/2 space-y-4">
                <div className="space-y-2">
                  <label className="label">Notes</label>
                  <textarea 
                    className="input min-h-[80px]" 
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Thanks for your business..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Terms</label>
                  <textarea 
                    className="input min-h-[80px]" 
                    value={formData.terms}
                    onChange={e => setFormData({ ...formData, terms: e.target.value })}
                  />
                </div>
              </div>

              <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg space-y-3 h-fit">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Discount (%)</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="input w-24 text-right"
                    value={formData.discount}
                    onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                  />
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Amount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="invoice-form" className="btn-primary">
            {invoice ? 'Save Changes' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}
