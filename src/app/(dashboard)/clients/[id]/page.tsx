import { ClientDetailPage } from '@/components/pages/client-detail';

export default function Page({ params }: { params: { id: string } }) {
  return <ClientDetailPage clientId={params.id} />;
}
