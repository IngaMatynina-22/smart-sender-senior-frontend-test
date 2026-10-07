import { useState, type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from '@mui/material'
import { useSearchParams } from 'react-router'
import { useWebhook } from '../features/webhooks/model/useWebhook.ts'
import { useWebhooks } from '../features/webhooks/model/useWebhooks.ts'
import type { Webhook } from '../features/webhooks/model/types.ts'
import { WebhookForm } from '../features/webhooks/ui/WebhookForm.tsx'
import { WebhooksPagination } from '../features/webhooks/ui/WebhooksPagination.tsx'
import { WebhooksSearch } from '../features/webhooks/ui/WebhooksSearch.tsx'
import { WebhooksTable } from '../features/webhooks/ui/WebhooksTable.tsx'

const LIMIT = 10

function parsePage(value: string | null): number {
  if (value === null || value.trim() === '') {
    return 1
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

function buildWebhooksSearchParams(page: number, search: string): URLSearchParams {
  const params = new URLSearchParams()
  params.set('page', String(page))

  if (search !== '') {
    params.set('search', search)
  }

  return params
}

type EditWebhookDialogProps = {
  webhookId: number
  onClose: () => void
  onSaved: () => void
}

function EditWebhookDialog({
  webhookId,
  onClose,
  onSaved,
}: EditWebhookDialogProps) {
  const { data, isLoading, error } = useWebhook(webhookId)

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit webhook</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 4,
            }}
          >
            <CircularProgress />
            <Typography color="text.secondary">Loading webhook...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error.response.status === 404
              ? 'Webhook not found.'
              : 'Failed to load webhook.'}
          </Alert>
        ) : data ? (
          <Box sx={{ pt: 1 }}>
            <WebhookForm
              webhook={data}
              onSuccess={() => {
                onSaved()
              }}
              onCancel={onClose}
            />
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function WebhooksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const search = searchParams.get('search') ?? ''
  const [editingWebhookId, setEditingWebhookId] = useState<number | null>(null)

  const { data, isLoading, error, refetch } = useWebhooks({
    page,
    limit: LIMIT,
    search,
  })

  const handlePageChange = (nextPage: number) => {
    setSearchParams(buildWebhooksSearchParams(nextPage, search))
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchParams(buildWebhooksSearchParams(1, event.target.value))
  }

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhookId(webhook.id)
  }

  const handleCloseEdit = () => {
    setEditingWebhookId(null)
  }

  const handleSaved = () => {
    setEditingWebhookId(null)
    refetch()
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Webhooks
      </Typography>

      <Paper sx={{ p: 2 }}>
        <WebhooksSearch value={search} onChange={handleSearchChange} />

        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 6,
            }}
          >
            <CircularProgress />
            <Typography color="text.secondary">Loading webhooks...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">Failed to load webhooks.</Alert>
        ) : data === null || data.data.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No webhooks found.
          </Typography>
        ) : (
          <>
            <WebhooksTable webhooks={data.data} onEdit={handleEdit} />
            {data.paging.pages.last > 1 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                <WebhooksPagination
                  page={page}
                  pages={data.paging.pages.last}
                  onChange={handlePageChange}
                />
              </Box>
            ) : null}
          </>
        )}
      </Paper>

      {editingWebhookId !== null ? (
        <EditWebhookDialog
          webhookId={editingWebhookId}
          onClose={handleCloseEdit}
          onSaved={handleSaved}
        />
      ) : null}
    </Container>
  )
}
