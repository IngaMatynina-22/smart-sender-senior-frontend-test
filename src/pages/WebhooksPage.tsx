import { WebhooksPagination } from '../features/webhooks/ui/WebhooksPagination.tsx'
import { WebhooksSearch } from '../features/webhooks/ui/WebhooksSearch.tsx'
import { WebhooksTable } from '../features/webhooks/ui/WebhooksTable.tsx'

export function WebhooksPage() {
  return (
    <>
      <WebhooksSearch />
      <WebhooksTable />
      <WebhooksPagination />
    </>
  )
}
