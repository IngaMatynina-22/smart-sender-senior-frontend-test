import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { Webhook } from '../model/types.ts'

type WebhooksTableProps = {
  webhooks: Webhook[]
  onEdit: (webhook: Webhook) => void
}

export function WebhooksTable({ webhooks, onEdit }: WebhooksTableProps) {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>URL</TableCell>
            <TableCell>Active</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {webhooks.map((webhook) => (
            <TableRow key={webhook.id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{webhook.name}</TableCell>
              <TableCell
                sx={{
                  maxWidth: { xs: 160, sm: 360 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {webhook.url}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={webhook.active ? 'Active' : 'Inactive'}
                  color={webhook.active ? 'success' : 'default'}
                  variant={webhook.active ? 'filled' : 'outlined'}
                />
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  onClick={() => onEdit(webhook)}
                  aria-label={`Edit ${webhook.name}`}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
