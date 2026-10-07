import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '../../../infrastructure/api/client.ts'
import { isValidationError } from '../../../shared/api/validationError.ts'
import { getSafePostLoginPath } from '../../../shared/lib/safeRedirect.ts'
import { useAuth } from '../model/useAuth.ts'

const FORM_FIELDS = ['email', 'password'] as const

type FormField = (typeof FORM_FIELDS)[number]

type FieldErrors = Partial<Record<FormField, string>>

async function readLoginErrors(error: unknown): Promise<{
  fieldErrors: FieldErrors
  formError: string | null
}> {
  if (!(error instanceof ApiError) || error.response.status !== 422) {
    return {
      fieldErrors: {},
      formError: 'Something went wrong',
    }
  }

  let body: unknown

  try {
    body = await error.response.json()
  } catch {
    return {
      fieldErrors: {},
      formError: 'Something went wrong',
    }
  }

  if (!isValidationError(body)) {
    return {
      fieldErrors: {},
      formError: 'Invalid credentials',
    }
  }

  const fieldErrors: FieldErrors = {}
  const unknownErrors: string[] = []

  for (const [field, messages] of Object.entries(body.error.payload)) {
    const message = messages[0]

    if (!message) {
      continue
    }

    if (FORM_FIELDS.includes(field as FormField)) {
      fieldErrors[field as FormField] = message
    } else {
      unknownErrors.push(message)
    }
  }

  return {
    fieldErrors,
    formError: unknownErrors[0] ?? null,
  }
}

export function LoginForm() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isLoading) {
      return
    }

    setFieldErrors({})
    setFormError(null)

    try {
      await login(email, password)
      navigate(getSafePostLoginPath(searchParams.get('next')), { replace: true })
    } catch (error) {
      const nextErrors = await readLoginErrors(error)
      setFieldErrors(nextErrors.fieldErrors)
      setFormError(nextErrors.formError)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 4,
        background: (theme) =>
          `radial-gradient(1200px 500px at 10% -10%, ${theme.palette.primary.main}14, transparent 55%),
           radial-gradient(900px 420px at 100% 0%, ${theme.palette.secondary.main}18, transparent 50%),
           ${theme.palette.background.default}`,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          p: { xs: 3, sm: 4 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={0.75}>
          <Typography
            variant="overline"
            color="primary"
            sx={{ letterSpacing: '0.14em', fontWeight: 700 }}
          >
            Smart Sender
          </Typography>
          <Typography variant="h4" component="h1">
            Sign in
          </Typography>
          <Typography color="text.secondary">
            Manage webhook endpoints for your workspace.
          </Typography>
        </Stack>

        {formError ? <Alert severity="error">{formError}</Alert> : null}

        <TextField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email}
          disabled={isLoading}
          autoComplete="email"
          fullWidth
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password}
          disabled={isLoading}
          autoComplete="current-password"
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </Paper>
    </Box>
  )
}
