import { InvoiceDetailPage } from '@/components/pages/invoice-detail'

export default function Page({ params }: { params: { id: string } }) {
  return <InvoiceDetailPage invoiceId={params.id} />
}
