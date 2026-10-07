# Smart Sender — тестове завдання Senior Frontend Engineer

Невеликий React-застосунок: вхід, список вебхуків і редагування. Backend імітовано через MSW за контрактом із ТЗ.

## Стек

- React + TypeScript (strict)
- Vite
- React Router
- MUI
- MSW
- Vitest

## Запуск

```bash
npm install
npm run dev
```

Застосунок відкриється на адресі Vite (зазвичай `http://localhost:5173`).

## Тести

Обов’язковий сценарій із ТЗ (два паралельні запити з `401` → один спільний `rotate` → успішні повтори):

```bash
npm test
```

Файл: `src/features/auth/api.concurrent-401.test.ts`.

## Тестові облікові дані

| Поле | Значення |
|------|----------|
| Email | `test@example.com` |
| Password | `password123` |

Капча не потрібна: клієнт надсилає непорожній `X-Captcha-Token` автоматично.

## Що реалізовано

1. **Вхід і сесія** — login → `device_session_token` (лише в пам’яті) → `/auth/token/issue` → `/v1/me` → список вебхуків. Fingerprint (32 hex) у `localStorage`. Сесія в моку (аналог HttpOnly-cookie), TTL 30 с, спільний `/auth/token/rotate` на паралельні `401`, logout через `/auth/token/revoke`.
2. **CSRF** — `GET /csrf`, заголовок `X-Requested-With: XMLHttpRequest` на всіх запитах, `X-CSRF-TOKEN` на `POST`/`PUT`, один повтор після `419`.
3. **Список вебхуків** — таблиця (назва, URL, активність), пагінація по 10, пошук за назвою, `page`/`search` у URL, стани loading / empty / error.
4. **Редагування** — модальне вікно; серверні помилки валідації біля полів.

## Ключові рішення

- **Шар API** (`infrastructure/api`) відокремлений від UI: перед будь-яким API виконується `GET /csrf` (спільний in-flight), на `POST`/`PUT` додається `X-CSRF-TOKEN`, один retry на `419`, один спільний `rotate` на паралельні `401`.
- **Сесія** — `device_session_token` лише в пам’яті; fingerprint у `localStorage`; серверна сесія лише в MSW (аналог HttpOnly-cookie). Після expire — локальний logout і повернення на login зі збереженням безпечного `next` (`/webhooks...` only).
- **Стан списку** — `page`/`search` у URL; пошук з debounce, refine через `history.replace`, пагінація через `push`; out-of-range `page` кліпиться; список оновлюється без повного blank (stale-while-revalidate).
- **Фічі** (`features/auth`, `features/webhooks`) тримають API-виклики, хуки й UI поруч; `pages` лише збирають екран; без зайвого global store.
- **MSW** — один користувач, 27 вебхуків, стан у пам’яті; CSRF на mutating-запитах до операції; помилки у форматі контракту.

## Структура

```text
src/
├── app/             # router, providers
├── pages/           # сторінки маршрутів
├── features/        # auth, webhooks (api / model / ui)
├── infrastructure/  # HTTP-клієнт, CSRF, rotate, session-expired
├── shared/          # fingerprint, типи помилок
└── mocks/           # MSW handlers і in-memory стан
```

## Незавершене

Усе з основного скоупу ТЗ реалізовано.
