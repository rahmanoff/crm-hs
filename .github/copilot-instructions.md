# AI Coding Agent Instructions: HubSpot CRM Dashboard

## Project Overview

A Next.js 14 full-stack CRM dashboard that fetches real-time metrics from HubSpot, displaying contacts, deals, companies, and tasks with historical trends and period-based analytics.

**Key Technologies**: Next.js, React 18, TypeScript, Tailwind CSS, Prisma, NextAuth.js, Recharts, Zustand (state management)

---

## Architecture & Data Flow

### Core API Approach

- **No SDK usage**: Metrics are fetched via **Axios + HubSpot HTTP API directly** (not @hubspot/api-client) to enable pagination and full dataset handling
- **HubSpot Search API** is used for server-side filtering/aggregation where possible (e.g., date-based filters), reducing data transfer
- **Rate limiting**: `p-limit` enforces 3 requests/second with exponential backoff on `429` errors
- **Caching**: `NodeCache` with 5-minute TTL caches API responses (key pattern: `hubspot:${endpoint}:${hash(params)}`)

### Data Flow: Backend → Frontend

1. **Frontend** (`app/page.tsx`) uses `useCrmStore()` (Zustand) to manage global state
2. **API Routes** (`app/api/*/route.ts`) receive requests with query params (e.g., `?days=30&refresh=1`)
3. **HubSpot Service** (`lib/hubspot.ts`) - singleton that handles:
   - Fetching paginated data via `searchObjects()` for all pages
   - Period-based filtering using `buildBetweenFilter()`, `buildEqualsFilter()`
   - Calculating metrics (averages, sums, conversion rates)
4. **Caching layer** returns cached results unless `forceRefresh=1`
5. Routes return `{ current, previous, allOpenDeals... }` for YoY comparison

### Key Files & Their Responsibilities

| File                       | Purpose                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `lib/hubspot.ts`           | Axios-based HubSpot API client + metric calculations              |
| `lib/store.ts`             | Zustand store for UI state, loading/error, timeRange              |
| `app/api/metrics/route.ts` | Main metrics endpoint; calculates all-time vs period metrics      |
| `app/page.tsx`             | Main dashboard component; renders cards with error/loading states |
| `lib/dateUtils.ts`         | Date range builders for period filters                            |
| `lib/cache.ts`             | NodeCache singleton                                               |

---

## Developer Workflows

### Running Commands

```bash
npm run dev       # Start dev server on http://localhost:3000
npm run build     # Production build (check for TS errors)
npm run test      # Run Jest tests in __tests__/
npm run type-check # TypeScript validation without emit
npm run lint      # Next.js ESLint
npm run db:seed   # Compile and run seed script (compile to dist/ first)
npm run db:studio # Open Prisma Studio for local DB inspection
```

### Testing

- **Jest + React Testing Library** are configured
- Test files live in `__tests__/` mirroring source structure
- Mock files: `__mocks__/fileMock.js` (static assets), `__mocks__/styleMock.js` (CSS)
- **Key test patterns**:
  - Mock HubSpot API responses in `lib/hubspot.test.ts`
  - Mock fetch in component tests (see `ActivityFeed.test.tsx`)
  - Use `jest.setup.js` for global test configuration

### Build Checklist

Before pushing: `npm run lint && npm run type-check && npm run test && npm run build`

---

## Critical Conventions & Patterns

### 1. Error Handling (Standardized in Phase 1)

- **Backend**: API routes propagate real errors instead of returning defaults
  - Catch with try/catch, don't silently default to zero metrics
  - Example: `app/api/metrics/route.ts` throws if HubSpot fetch fails
- **Frontend**: `app/page.tsx` shows dedicated error UI (not zeroed dashboard)
  - Use Zustand `error` state; render `<ErrorScreen>` if present

### 2. Pagination & Data Fetching

- **All data is fetched across ALL pages** (no pagination limit)
- Use `searchObjects(objectType, filters, properties)` → yields full dataset
- Call `hubSpotService.getContacts()`, `getDeal()` etc. only for specific calculations
- Filter server-side in HubSpot Search API when possible; only aggregate on client

### 3. State Management (Zustand + Hooks)

```typescript
// In components:
const { metrics, loading, error, timeRange, setTimeRange } =
  useCrmStore();

// Store lifecycle:
// - Load initial data on mount with useEffect
// - timeRange drives all refetches (watch with useEffect)
// - Force refresh with forceRefresh=1 query param
```

### 4. Date Filtering Pattern

- Uses `getDateRange(days)` → `{ start: Date, end: Date }`
- Filters in HubSpot: `buildBetweenFilter('createdate', start, end)`
- Days=0 means "all-time"; otherwise use 30/90/custom day ranges
- Always compare `current` vs `previous` period (previous = same length, prior)

### 5. Metric Calculation Pattern

- **Period-based**: Filter by createdate/closedate; count/sum results
- **All-time**: No date filter; use all records
- **Open deals**: Filter where `dealstage !== 'closedwon' && !== 'closedlost'`
- **Conversion rate**: `wonDeals / (wonDeals + lostDeals)`
- See `lib/metrics/deals.ts` for deal-specific calculations

---

## Integration Points & Dependencies

### HubSpot API

- **Endpoint**: `https://api.hubapi.com`
- **Auth**: `Authorization: Bearer <HUBSPOT_API_KEY>` header
- **Key endpoints used**:
  - `POST /crm/v3/objects/{objectType}/search` (HubSpot Search API)
  - `GET /crm/v3/objects/contacts` (if needed for pagination fallback)
- **Rate limit**: 3 calls/second; 429 triggers exponential backoff

### NextAuth.js + Prisma (Phase 5: Authentication)

**Current Status**: NextAuth.js scaffolded; `CustomPrismaAdapter` in `lib/auth/CustomPrismaAdapter.ts` needs activation

**Implementation Checklist**:

1. Enable `CustomPrismaAdapter` in `app/api/auth/[...nextauth]/route.ts`
2. Activate user auth providers (email/password, OAuth, etc.)
3. Add `useSession()` hook guard to `app/page.tsx` (redirect unauthenticated users)
4. Implement role-based access control (RBAC):
   - User model supports `roles` and `permissions` in `prisma/schema.prisma`
   - Add middleware to check user roles before dashboard access
5. Protect API routes with session validation (pattern: `app/api/auth-protected/route.ts`)
6. Add sign-in/sign-out UI flows

**Key Files**:

- `app/api/auth/[...nextauth]/route.ts` - NextAuth config
- `lib/auth/CustomPrismaAdapter.ts` - Prisma adapter bridge
- `prisma/schema.prisma` - User, Account, Session models

### Environment Variables (Required)

```bash
HUBSPOT_API_KEY=<your-private-app-token-or-api-key>
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000 (dev)
DATABASE_URL=file:./dev.db (SQLite default)
```

---

## Common Patterns & Anti-Patterns

### ✅ DO

- Use `forceRefresh=1` query param to bypass cache during debugging
- Fetch all pages via `searchObjects()` pagination loop
- Calculate metrics server-side when possible (HubSpot Search API)
- Compare `current` vs `previous` periods for trends
- Show loading skeleton UI while data loads
- Wrap date-range logic in `getDateRange()` + `buildBetweenFilter()`

### ❌ DON'T

- Don't use `@hubspot/api-client` SDK—use Axios directly
- Don't hardcode pagination limits; fetch all pages
- Don't return default/zero metrics on error; propagate the error
- Don't calculate metrics client-side if HubSpot Search API can do it
- Don't cache without respecting `forceRefresh` flag
- Don't forget `export const dynamic = 'force-dynamic'` in API routes

---

## Refactoring & Upgrade Notes (Phases Completed)

- **Phase 1 (Stabilization)**: ✅ Standardized error handling; frontend error UI
- **Phase 2 (Scalability)**: ✅ Removed pagination limits; HubSpot Search API; exponential backoff
- **Phase 3 (Frontend)**: ✅ Zustand state manager; date range picker
- **Phase 4 (Testing)**: ✅ Jest + React Testing Library in place
- **Phase 5 (Authentication - IN PROGRESS)**: NextAuth.js setup; user roles/permissions; protected routes
- **Phase 6 (Optimization)**: Pending—further data fetching optimization
- **Upcoming upgrades** (see MIGRATION_PLAN.md): React 18→19, Next 14→16, Recharts 2→3

---

## Debugging Tips

1. **API response missing data?** Check cache with `forceRefresh=1` query param
2. **Rate limit errors?** Verify `p-limit(3)` and exponential backoff in `retryRequest()`
3. **Date filters not working?** Check `buildBetweenFilter()` in `lib/dateUtils.ts`; confirm dates are ISO strings
4. **Component not updating?** Check Zustand store subscription in `useEffect`; verify actions are called
5. **Tests failing?** Check `jest.setup.js` for DOM environment; mock fetch/axios in test files

---

## Key Decisions & Why

1. **Axios over SDK**: Direct API calls → pagination flexibility + full dataset handling
2. **HubSpot Search API**: Server-side filtering reduces data transfer by ~90%
3. **Zustand (not Redux)**: Lightweight, minimal boilerplate for dashboard state
4. **NodeCache (not Redis)**: Serverless-friendly; TTL auto-purges stale data
5. **Prisma + SQLite**: Local auth; easier dev experience; scales if migrated to PostgreSQL

---

## First Task Recommendations for Agents

### For Authentication Implementation (Phase 5 - Current Priority)

1. Review `lib/auth/CustomPrismaAdapter.ts` to understand the auth bridge to Prisma
2. Check `app/api/auth/[...nextauth]/route.ts` for existing NextAuth.js configuration
3. Inspect `prisma/schema.prisma` for User, Account, Session models
4. Add `getServerSession()` import and validate in `app/page.tsx` (use `redirect()` if unauthenticated)
5. Implement protected API routes: wrap logic in `getServerSession()` check, return 401 if unauthorized
6. Add sign-in/sign-out UI components and wire to NextAuth providers
7. Test auth flow: `npm run dev` → sign-in → verify session → check protected routes
8. Document role/permission patterns once RBAC is working

### For Other Features

1. Read `REFACTOR_PLAN.md` + `MIGRATION_PLAN.md` to understand project direction
2. Understand data flow: trace a single metric from HubSpot → API → Store → Component
3. Review `lib/hubspot.ts` (`searchObjects()` function) to understand pagination
4. Check `app/api/metrics/route.ts` error handling pattern before adding new endpoints
5. Use `npm run dev` + browser DevTools to test locally; use `forceRefresh=1` to bypass cache
