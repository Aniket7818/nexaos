import { ProjectDetailPage } from '@/components/pages/project-detail'

export default function Page({ params }: { params: { id: string } }) {
  return <ProjectDetailPage projectId={params.id} />
}
