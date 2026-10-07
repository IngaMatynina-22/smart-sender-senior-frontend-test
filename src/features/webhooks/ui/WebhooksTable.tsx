import {
  Button,
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
    <TableContainer>
      <Table>
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
            <TableRow key={webhook.id}>
              <TableCell>{webhook.name}</TableCell>
              <TableCell>{webhook.url}</TableCell>
              <TableCell>{webhook.active ? 'Active' : 'Inactive'}</TableCell>
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
