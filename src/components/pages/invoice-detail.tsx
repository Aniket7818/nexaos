'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore, calcInvoiceTotal } from '@/store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceStatus } from '@/types'
import { 
  ArrowLeft, Printer, Edit, Trash2, CheckCircle, 
  Download, Send, MoreVertical, CreditCard
} from 'lucide-react'

const cn = (...c: (string|undefined|null|false)[]) => c.filter(Boolean).join(' ')

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200'
}

export function InvoiceDetailPage({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const { invoices, clients, settings, updateInvoice, deleteInvoice } = useStore()
  
  const invoice = invoices.find(inv => inv.id === invoiceId)
  const client = clients.find(c => c.id === invoice?.clientId)

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
        <button onClick={() => router.push('/invoices')} className="btn-primary">Back to Invoices</button>
      </div>
    )
  }

  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const tax = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (((item.taxRate ?? item.taxPercent) || 0) / 100)), 0)
  const discountAmount = ((subtotal + tax) * (invoice.discount || 0)) / 100
  const total = subtotal + tax - discountAmount

  const handleStatusChange = (status: InvoiceStatus) => {
    updateInvoice(invoice.id, { ...invoice, status })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(invoice.id)
      router.push('/invoices')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Non-printable toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Link href="/invoices" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button 
              onClick={() => handleStatusChange('paid')}
              className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Paid
            </button>
          )}
          <select 
            value={invoice.status} 
            onChange={e => handleStatusChange(e.target.value as InvoiceStatus)}
            className="input bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={handleDelete} className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 border-transparent">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Invoice Document (Printable) */}
      <div className="card max-w-4xl mx-auto bg-white text-slate-900 relative overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
        
        {/* Subtle Watermark for demo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none overflow-hidden print:hidden">
          <span className="text-[150px] font-black rotate-[-30deg]">DEMO</span>
        </div>

        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{settings?.companyName || 'NexaOS'}</h1>
              <div className="text-sm text-slate-500 whitespace-pre-line">
                {settings?.address || '123 Business Avenue\nTech Park, City 10001\ncontact@example.com'}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-slate-200 tracking-wider mb-4">INVOICE</h2>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="font-semibold text-slate-700">Invoice Number:</span>
                  <span className="text-slate-900">{invoice.number}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-semibold text-slate-700">Issue Date:</span>
                  <span className="text-slate-900">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="font-semibold text-slate-700">Due Date:</span>
                  <span className="text-slate-900">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between gap-8 mt-2">
                  <span className="font-semibold text-slate-700">Status:</span>
                  <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border", STATUS_COLORS[invoice.status])}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-12">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
            {client ? (
              <div>
                <div className="text-lg font-bold text-slate-900">{client.companyName || client.name}</div>
                {client.contactPerson && <div className="text-slate-600 font-medium">{client.contactPerson}</div>}
                <div className="text-sm text-slate-500 mt-1 whitespace-pre-line">
                  {client.address || 'Address not provided'}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {client.email} {client.phone && `• ${client.phone}`}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic">Client details unavailable</div>
            )}
          </div>

          {/* Table */}
          <div className="mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="py-3 px-2 font-bold text-slate-900 text-sm w-1/2">Description</th>
                  <th className="py-3 px-2 font-bold text-slate-900 text-sm text-right">Qty</th>
                  <th className="py-3 px-2 font-bold text-slate-900 text-sm text-right">Unit Price</th>
                  <th className="py-3 px-2 font-bold text-slate-900 text-sm text-right">Tax</th>
                  <th className="py-3 px-2 font-bold text-slate-900 text-sm text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, i) => {
                  const amount = item.quantity * item.unitPrice
                  return (
                    <tr key={i}>
                      <td className="py-4 px-2 text-slate-800">{item.description}</td>
                      <td className="py-4 px-2 text-slate-600 text-right">{item.quantity}</td>
                      <td className="py-4 px-2 text-slate-600 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-4 px-2 text-slate-600 text-right">{item.taxRate}%</td>
                      <td className="py-4 px-2 text-slate-900 font-medium text-right">{formatCurrency(amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t-2 border-slate-900 pt-8">
            <div className="w-full md:w-1/2 space-y-6">
              {invoice.notes && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Terms & Conditions</h4>
                  <p className="text-sm text-slate-500 whitespace-pre-line">{invoice.terms}</p>
                </div>
              )}
            </div>
            <div className="w-full md:w-1/3 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span className="font-medium text-slate-900">{formatCurrency(tax)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount ({invoice.discount}%)</span>
                  <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-2xl font-black text-slate-900">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  )
}
