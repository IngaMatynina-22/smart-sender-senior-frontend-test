import { Alert, Box, Button, TextField } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../infrastructure/api/client.ts'
import { isValidationError } from '../../../shared/api/validationError.ts'
import { updateWebhook } from '../api.ts'
import type { Webhook } from '../model/types.ts'

const FORM_FIELDS = ['name', 'url'] as const

type FormField = (typeof FORM_FIELDS)[number]

type FieldErrors = Partial<Record<FormField, string>>

type WebhookFormProps = {
  webhook: Webhook
  onSuccess: (webhook: Webhook) => void
  onCancel: () => void
}

async function readWebhookFormErrors(error: unknown): Promise<{
  fieldErrors: FieldErrors
  formError: string | null
}> {
  if (!(error instanceof ApiError) || error.response.status !== 422) {
    return {
      fieldErrors: {},
      formError: 'Failed to save webhook.',
    }
  }

  let body: unknown

  try {
    body = await error.response.json()
  } catch {
    return {
      fieldErrors: {},
      formError: 'Failed to save webhook.',
    }
  }

  if (!isValidationError(body)) {
    return {
      fieldErrors: {},
      formError: 'Failed to save webhook.',
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

export function WebhookForm({
  webhook,
  onSuccess,
  onCancel,
}: WebhookFormProps) {
  const [name, setName] = useState(webhook.name)
  const [url, setUrl] = useState(webhook.url)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    setFieldErrors({})
    setFormError(null)
    setIsSaving(true)

    try {
      const updated = await updateWebhook(webhook.id, { name, url })
      onSuccess(updated)
    } catch (error) {
      const nextErrors = await readWebhookFormErrors(error)
      setFieldErrors(nextErrors.fieldErrors)
      setFormError(nextErrors.formError)
      setIsSaving(false)
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {formError ? <Alert severity="error">{formError}</Alert> : null}

      <TextField
        label="Name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={Boolean(fieldErrors.name)}
        helperText={fieldErrors.name}
        disabled={isSaving}
        fullWidth
      />

      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        error={Boolean(fieldErrors.url)}
        helperText={fieldErrors.url}
        disabled={isSaving}
        fullWidth
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Box>
  )
}
