import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { Webhook } from '../model/types.ts'

type WebhooksTableProps = {
  webhooks: Webhook[]
  onEdit: (webhook: Webhook) => void
}

export function WebhooksTable({ webhooks, onEdit }: WebhooksTableProps) {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="Webhooks">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Name
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>
              URL
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Status
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: 700, color: 'text.secondary' }}
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {webhooks.map((webhook) => (
            <TableRow key={webhook.id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                {webhook.name}
              </TableCell>
              <TableCell
                sx={{
                  maxWidth: { xs: 160, sm: 360 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  title={webhook.url}
                >
                  {webhook.url}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={webhook.active ? 'Active' : 'Inactive'}
                  color={webhook.active ? 'success' : 'default'}
                  variant="outlined"
                  sx={{ borderRadius: 1.5 }}
                />
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="text"
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
