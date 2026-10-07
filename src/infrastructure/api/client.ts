export type ApiRequestOptions = {
  path: string
  method?: string
  body?: unknown
}

export async function apiRequest(options: ApiRequestOptions): Promise<unknown> {
  void options
  return undefined
}
