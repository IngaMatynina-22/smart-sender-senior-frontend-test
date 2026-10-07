import { TextField } from '@mui/material'

type WebhooksSearchProps = {
  value: string
  onChange: (value: string) => void
}

export function WebhooksSearch({ value, onChange }: WebhooksSearchProps) {
  return (
    <TextField
      label="Search webhooks"
      placeholder="Filter by name"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      fullWidth
      size="small"
    />
  )
}
