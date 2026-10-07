import { useEffect, useState } from 'react'
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../features/auth/model/useAuth.ts'
import { useWebhook } from '../features/webhooks/model/useWebhook.ts'
import { useWebhooks } from '../features/webhooks/model/useWebhooks.ts'
import type { Webhook } from '../features/webhooks/model/types.ts'
import { WebhookForm } from '../features/webhooks/ui/WebhookForm.tsx'
import { WebhooksPagination } from '../features/webhooks/ui/WebhooksPagination.tsx'
import { WebhooksSearch } from '../features/webhooks/ui/WebhooksSearch.tsx'
import { WebhooksTable } from '../features/webhooks/ui/WebhooksTable.tsx'

const LIMIT = 10
const SEARCH_DEBOUNCE_MS = 300

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
            <CircularProgress size={32} />
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
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const searchFromUrl = searchParams.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [editingWebhookId, setEditingWebhookId] = useState<number | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setSearchInput(searchFromUrl)
  }, [searchFromUrl])

  useEffect(() => {
    if (searchInput === searchFromUrl) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      // First transition into search pushes history; refinements replace.
      setSearchParams(buildWebhooksSearchParams(1, searchInput), {
        replace: searchFromUrl !== '',
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput, searchFromUrl, setSearchParams])

  const { data, dataQuery, isLoading, isInitialLoading, error, refetch } =
    useWebhooks({
      page,
      limit: LIMIT,
      search: searchFromUrl,
    })

  useEffect(() => {
    if (
      isLoading ||
      data === null ||
      dataQuery === null ||
      dataQuery.page !== page ||
      dataQuery.search !== searchFromUrl
    ) {
      return
    }

    const lastPage = data.paging.pages.last

    if (page > lastPage) {
      setSearchParams(buildWebhooksSearchParams(lastPage, searchFromUrl), {
        replace: true,
      })
    }
  }, [data, dataQuery, isLoading, page, searchFromUrl, setSearchParams])

  const handlePageChange = (nextPage: number) => {
    setSearchParams(buildWebhooksSearchParams(nextPage, searchFromUrl))
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

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const total = data?.paging.results.total
  const showPagination = data !== null && data.paging.pages.last > 1
  const isRefreshing = isLoading && data !== null
  const hasRows = data !== null && data.data.length > 0

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: (theme) =>
          `linear-gradient(180deg, ${theme.palette.background.default} 0%, #EAF1F3 100%)`,
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: { xs: 64, sm: 72 } }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              color="primary"
              sx={{ letterSpacing: '0.12em', fontWeight: 700, lineHeight: 1.2 }}
            >
              Smart Sender
            </Typography>
            <Typography variant="h5" component="h1" noWrap>
              Webhooks
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', flexShrink: 0 }}
          >
            {user ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                {user.email}
              </Typography>
            ) : null}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                void handleLogout()
              }}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2.5, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {isRefreshing ? (
            <LinearProgress
              sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
            />
          ) : null}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              mb: 2.5,
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            <Box sx={{ flex: 1, maxWidth: 420 }}>
              <WebhooksSearch value={searchInput} onChange={setSearchInput} />
            </Box>
            {typeof total === 'number' && !error ? (
              <Typography color="text.secondary" variant="body2">
                {total} result{total === 1 ? '' : 's'}
              </Typography>
            ) : null}
          </Stack>

          {isInitialLoading ? (
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
          ) : error && !hasRows ? (
            <Stack spacing={2} sx={{ py: 2 }}>
              <Alert severity="error">Failed to load webhooks.</Alert>
              <Box>
                <Button variant="outlined" onClick={refetch}>
                  Try again
                </Button>
              </Box>
            </Stack>
          ) : !hasRows ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No webhooks found.
              </Typography>
              <Typography color="text.secondary">
                {searchFromUrl
                  ? 'Try another name or clear the search.'
                  : 'There are no webhooks to show yet.'}
              </Typography>
            </Box>
          ) : (
            <>
              {error ? (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small" onClick={refetch}>
                      Retry
                    </Button>
                  }
                >
                  Failed to load webhooks.
                </Alert>
              ) : null}
              <Box sx={{ opacity: isRefreshing ? 0.72 : 1, transition: 'opacity 120ms' }}>
                <WebhooksTable webhooks={data.data} onEdit={handleEdit} />
              </Box>
              {showPagination ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                  <WebhooksPagination
                    page={Math.min(page, data.paging.pages.last)}
                    pages={data.paging.pages.last}
                    onChange={handlePageChange}
                  />
                </Box>
              ) : null}
            </>
          )}
        </Paper>
      </Container>

      {editingWebhookId !== null ? (
        <EditWebhookDialog
          webhookId={editingWebhookId}
          onClose={handleCloseEdit}
          onSaved={handleSaved}
        />
      ) : null}
    </Box>
  )
}
