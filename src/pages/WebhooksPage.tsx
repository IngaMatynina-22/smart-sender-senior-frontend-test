import { type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import { useSearchParams } from 'react-router'
import { useWebhooks } from '../features/webhooks/model/useWebhooks.ts'
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

export function WebhooksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const search = searchParams.get('search') ?? ''

  const { data, isLoading, error } = useWebhooks({
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
            <WebhooksTable webhooks={data.data} />
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
    </Container>
  )
}
