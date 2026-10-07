import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../../infrastructure/api/client.ts'
import type { ValidationError } from '../../../shared/api/validationError.ts'
import { useAuth } from '../model/useAuth.ts'

const FORM_FIELDS = ['email', 'password'] as const

type FormField = (typeof FORM_FIELDS)[number]

type FieldErrors = Partial<Record<FormField, string>>

function isValidationError(body: unknown): body is ValidationError {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return false
  }

  const error = body.error

  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'ValidationException' &&
    'payload' in error &&
    typeof error.payload === 'object' &&
    error.payload !== null
  )
}

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

  const fieldErrors: FieldErrors = {}
  const unknownErrors: string[] = []

  if (isValidationError(body)) {
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
  } else if (
    typeof body === 'object' &&
    body !== null &&
    'errors' in body &&
    typeof body.errors === 'object' &&
    body.errors !== null
  ) {
    for (const [field, message] of Object.entries(
      body.errors as Record<string, unknown>,
    )) {
      if (typeof message !== 'string') {
        continue
      }

      if (FORM_FIELDS.includes(field as FormField)) {
        fieldErrors[field as FormField] = message
      } else {
        unknownErrors.push(message)
      }
    }
  } else {
    return {
      fieldErrors: {},
      formError: 'Invalid credentials',
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
      navigate('/webhooks')
    } catch (error) {
      const nextErrors = await readLoginErrors(error)
      setFieldErrors(nextErrors.fieldErrors)
      setFormError(nextErrors.formError)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, sm: 8 }, px: 2 }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          p: { xs: 3, sm: 4 },
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Login
          </Typography>
          <Typography color="text.secondary">
            Sign in to manage your webhooks.
          </Typography>
        </Box>

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

        <Button type="submit" variant="contained" disabled={isLoading} fullWidth>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </Paper>
    </Container>
  )
}
