# Personal Inventory Management System — Frontend

PIMS Frontend is a responsive Vue application for managing personal assets,
categories, locations, and inventory images through the PIMS REST API.

> [!WARNING]
> **Assignment disclaimer:** This application was created for a job assignment
> and demonstration purposes. It is a simplified implementation and is not yet
> intended for enterprise production use. Production deployment would require
> additional security review, stronger browser-session controls, accessibility
> validation, broader automated testing, observability, performance monitoring,
> CI/CD controls, and infrastructure hardening.

## Documentation

### Frontend

- [Frontend application flow](docs/foundation/summary.md)

### Backend and API

- [Backend repository](https://github.com/Yosmerry/pims-be)
- [API contracts](https://github.com/Yosmerry/pims-be/tree/release/1.0.0-RELEASE/docs/api)
- [Backend application flow](https://github.com/Yosmerry/pims-be/blob/acb56e94a55adac3970e799a2b6225172c87fd21/docs/foundation/summary.md)
- [Entity relationship diagram](https://github.com/Yosmerry/pims-be/blob/release/1.0.0-RELEASE/docs/foundation/pims-erd.jpg)

## Implemented Scope

- Registration, login, automatic access-token refresh, and logout.
- Protected and guest-only routes.
- Responsive authenticated layout with desktop and mobile navigation.
- Category and location management with pagination.
- Inventory list, filters, sorting, pagination, detail, create, update, and
  delete flows.
- Protected inventory image gallery and image deletion.
- Multiple image selection up to five images per item.
- Browser-side JPEG/PNG conversion to WebP at 100 KB or smaller before upload.
- Standard API error translation and field-level validation messages.

## Technology

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Axios
- Element Plus
- Vitest
- ESLint, Oxlint, and Prettier

## Local Development

Requirements:

- Node.js `22.18+` or `24.12+`
- Running PIMS Backend API

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

By default, Vite proxies `/api` requests to `http://localhost:8080`. Set
`VITE_API_BASE_URL` when the backend uses another URL.

Useful checks:

```sh
npm run format
npm run lint
npm run type-check
npm run test:unit -- --run
npm run build
```

The image flow uses browser Canvas and WebP encoding support. Use a current
version of Chrome, Edge, Firefox, or Safari when testing image uploads.
