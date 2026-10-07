import { badRequestResponse } from './errors.ts'

const REQUESTED_WITH_HEADER = 'X-Requested-With'
const REQUESTED_WITH_VALUE = 'XMLHttpRequest'

export function validateRequestedWith(request: Request) {
  if (request.headers.get(REQUESTED_WITH_HEADER) !== REQUESTED_WITH_VALUE) {
    return badRequestResponse('Missing X-Requested-With header.')
  }

  return null
}
