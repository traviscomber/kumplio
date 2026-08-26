import DocumentsPageClient from '@/app/documents/client'

export default function CanonicalDocumentsPage() {
  return (
    <div className="kumplio-work-surface">
      <DocumentsPageClient showTopNav={false} />
    </div>
  )
}
