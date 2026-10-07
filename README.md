# Smart Sender

Take-home frontend application for managing webhooks with login, session handling, CSRF protection, and list/edit flows. The backend is simulated with MSW.

## Stack

- React
- TypeScript
- Vite
- MUI
- React Router
- MSW
- Vitest
- Testing Library

## Run

```bash
npm install
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

## Test credentials

From the mock auth handler:

- Email: `test@example.com`
- Password: `password123`

## Architecture

```text
src/
├── app/             # router, providers, app shell
├── pages/           # route-level composition
├── features/        # feature UI, hooks, API calls
├── shared/          # small shared helpers/types
├── infrastructure/  # apiClient, CSRF, session rotate
└── mocks/           # MSW handlers and in-memory state
```

- Feature-specific logic stays inside `features/*`.
- Transport concerns (HTTP client, CSRF, session rotate, expiration) live in `infrastructure`.
- MSW mocks the backend for local development and tests.
- Pages compose features for routes.
- No global state manager: auth context plus local/URL state is enough for this app size.

## Important decisions

### Session

- `device_session_token` is not stored in `localStorage`.
- Fingerprint is stored in `localStorage`.
- Session token exists only in the mock in-memory/cookie model.
- `401` triggers a shared rotate request.
- Concurrent `401` responses share one rotate.
- Rotate retry happens at most once.
- After a failed rotate/retry, the session is treated as ended and the user is logged out locally.

### CSRF

- `GET /csrf` runs before the first mutating request.
- CSRF token is kept in memory.
- `POST` / `PUT` send `X-CSRF-TOKEN`.
- `419` triggers one CSRF refresh + one retry.
- `/csrf` itself is fetched with plain `fetch` to avoid a client/csrf dependency cycle.

### URL state

- `page` and `search` live in the URL and are the source of truth.
- Browser Back/Forward restore list state automatically.
- `limit` stays an internal constant (`10`).

### Mock backend

- MSW handlers simulate auth, CSRF, and webhooks.
- There are 27 webhook records.
- Mock state lives only in memory and resets on reload.
- Manual logout calls `POST /auth/token/revoke`; automatic session expiration only clears local auth state.
