import { useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import { useWebhooks } from '../features/webhooks/model/useWebhooks.ts'
import { WebhooksPagination } from '../features/webhooks/ui/WebhooksPagination.tsx'
import { WebhooksTable } from '../features/webhooks/ui/WebhooksTable.tsx'

const LIMIT = 10
const SEARCH = ''

export function WebhooksPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useWebhooks({
    page,
    limit: LIMIT,
    search: SEARCH,
  })

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Webhooks
      </Typography>

      <Paper sx={{ p: 2 }}>
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
                  onChange={setPage}
                />
              </Box>
            ) : null}
          </>
        )}
      </Paper>
    </Container>
  )
}
