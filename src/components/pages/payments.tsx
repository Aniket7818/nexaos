'use client'

import React, { useState, useMemo } from 'react'
import { useStore, calcInvoiceTotal } from '@/store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Payment, PaymentMethod, PaymentStatus } from '@/types'
import { 
  Search, Plus, CreditCard, Download, Trash2, Edit, X, Calendar as CalendarIcon,
  Banknote, Wallet, Building2, Smartphone, Receipt
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const cn = (...c: (string|undefined|null|false)[]) => c.filter(Boolean).join(' ')

const STATUS_COLORS: Record<PaymentStatus, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
}

const METHOD_COLORS: Record<PaymentMethod, string> = {
  'bank-transfer': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  upi: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  card: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  'bank-transfer': <Building2 className="w-3 h-3 mr-1" />,
  upi: <Smartphone className="w-3 h-3 mr-1" />,
  cash: <Banknote className="w-3 h-3 mr-1" />,
  card: <CreditCard className="w-3 h-3 mr-1" />,
  other: <Wallet className="w-3 h-3 mr-1" />
}

export function PaymentsPage() {
  const { payments, clients, invoices, addPayment, updatePayment, deletePayment } = useStore()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

  const summary = useMemo(() => {
    let collected = 0, pending = 0
    let completedCount = 0
    payments.forEach(p => {
      if (p.status === 'completed') {
        collected += p.amount
        completedCount++
      }
      if (p.status === 'pending') pending += p.amount
    })
    return { collected, pending, completedCount }
  }, [payments])

  const chartData = useMemo(() => {
    const months: Record<string, number> = {}
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months[d.toLocaleString('default', { month: 'short' })] = 0
    }

    payments.filter(p => p.status === 'completed').forEach(p => {
      const dateStr = p.date || p.transactionDate || ''
      const date = dateStr ? new Date(dateStr) : new Date()
      const month = date.toLocaleString('default', { month: 'short' })
      if (months[month] !== undefined) {
        months[month] += p.amount
      }
    })

    return Object.entries(months).map(([name, amount]) => ({ name, amount }))
  }, [payments])

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const client = clients.find(c => c.id === p.clientId)
      const ref = p.reference || p.referenceNumber || ''
      const cName = client?.name || client?.companyName || ''
      return ref.toLowerCase().includes(search.toLowerCase()) || 
             cName.toLowerCase().includes(search.toLowerCase())
    }).sort((a, b) => new Date(b.date || b.transactionDate || 0).getTime() - new Date(a.date || a.transactionDate || 0).getTime())
  }, [payments, clients, search])

  const openEditModal = (payment: Payment) => {
    setEditingPayment(payment)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment record?')) {
      deletePayment(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage received payments</p>
        </div>
        <button 
          onClick={() => { setEditingPayment(null); setIsModalOpen(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 border-l-4 border-l-green-500 flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Collected</span>
            <span className="text-3xl font-bold">{formatCurrency(summary.collected)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 border-l-4 border-l-amber-500 flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</span>
              <span className="text-xl font-bold">{formatCurrency(summary.pending)}</span>
            </div>
            <div className="card p-4 border-l-4 border-l-blue-500 flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Transactions</span>
              <span className="text-xl font-bold">{summary.completedCount}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-6 h-64">
          <h3 className="text-sm font-medium text-slate-500 mb-4">Collections (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Amount'] as any}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-semibold">Recent Payments</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reference or client..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 w-full py-1.5"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Date</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Reference</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Client</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Method</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm text-right">Amount</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Status</th>
                <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => {
                  const client = clients.find(c => c.id === payment.clientId)
                  const invoice = invoices.find(i => i.id === payment.invoiceId)
                  
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="p-4 text-slate-500 dark:text-slate-400">{formatDate(payment.date)}</td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900 dark:text-white">{payment.reference}</div>
                        {invoice && (
                          <div className="text-xs flex items-center gap-1 text-slate-500 mt-1">
                            <Receipt className="w-3 h-3" /> {invoice.number}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium">{client?.name || 'Unknown'}</td>
                      <td className="p-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium flex items-center w-fit", METHOD_COLORS[payment.method])}>
                          {METHOD_ICONS[payment.method]}
                          <span className="capitalize">{payment.method.replace('-', ' ')}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider", STATUS_COLORS[payment.status])}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(payment)} className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/30">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(payment.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30">
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
        <PaymentModal 
          payment={editingPayment}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}

function PaymentModal({ payment, onClose }: { payment: Payment | null, onClose: () => void }) {
  const { clients, invoices, addPayment, updatePayment } = useStore()
  
  const [formData, setFormData] = useState<Partial<Payment>>(
    payment || {
      clientId: '',
      invoiceId: undefined,
      amount: 0,
      method: 'bank-transfer',
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      notes: ''
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientId) {
      alert('Client is required')
      return
    }
    
    if (payment) {
      updatePayment(payment.id, { ...formData } as Payment)
    } else {
      addPayment({ ...formData, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as Payment)
    }
    onClose()
  }

  const clientInvoices = invoices.filter(inv => inv.clientId === formData.clientId && inv.status !== 'paid' && inv.status !== 'cancelled')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 my-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">{payment ? 'Edit Payment' : 'Record Payment'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="label">Client *</label>
              <select 
                className="input" 
                value={formData.clientId}
                onChange={e => setFormData({ ...formData, clientId: e.target.value, invoiceId: undefined })}
                required
              >
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Link to Invoice (Optional)</label>
              <select 
                className="input" 
                value={formData.invoiceId || ''}
                onChange={e => setFormData({ ...formData, invoiceId: e.target.value || undefined })}
                disabled={!formData.clientId}
              >
                <option value="">None</option>
                {clientInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.number} - {formatCurrency(calcInvoiceTotal(inv.items, inv.discount))}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Amount (₹) *</label>
                <input 
                  type="number" 
                  min="0.01" 
                  step="0.01"
                  className="input font-medium text-lg" 
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label">Payment Date *</label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.date?.split('T')[0]}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Payment Method *</label>
                <select 
                  className="input" 
                  value={formData.method}
                  onChange={e => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                  required
                >
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label">Status *</label>
                <select 
                  className="input" 
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
                  required
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Reference Number</label>
              <input 
                type="text" 
                className="input" 
                value={formData.reference}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Transaction ID, Cheque No, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="label">Notes</label>
              <textarea 
                className="input" 
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="payment-form" className="btn-primary">
            {payment ? 'Save Changes' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
