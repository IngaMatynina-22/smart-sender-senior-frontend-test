import type { ChangeEvent } from 'react'
import { Box, TextField } from '@mui/material'

type WebhooksSearchProps = {
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function WebhooksSearch({ value, onChange }: WebhooksSearchProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        label="Search webhooks"
        placeholder="Search by name"
        value={value}
        onChange={onChange}
        fullWidth
        size="small"
      />
    </Box>
  )
}
