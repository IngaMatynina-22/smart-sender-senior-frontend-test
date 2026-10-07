import { Pagination } from '@mui/material'

type WebhooksPaginationProps = {
  page: number
  pages: number
  onChange: (page: number) => void
}

export function WebhooksPagination({
  page,
  pages,
  onChange,
}: WebhooksPaginationProps) {
  return (
    <Pagination
      page={page}
      count={pages}
      onChange={(_, value) => onChange(value)}
    />
  )
}
