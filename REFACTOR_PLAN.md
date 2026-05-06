# HubSpot Dashboard Refactoring Plan

_Last updated: 2026-05-06_

This is the single source of truth for project improvement work. It combines completed work and the prioritized next execution steps.

## 1) Current Snapshot

- Stack: `Next.js 14`, `React 18`, `TypeScript`, App Router.
- HubSpot integration: HTTP-based (`axios` + Search API), SDK removed.
- Auth foundation: signup/signin flow + Prisma schema with RBAC-oriented models.
- Test/tooling baseline: Jest + Testing Library + lint + type-check in place.

## 2) Completed Work

### Stability and Error Handling

- [x] Standardized error handling for `metrics`, `trends`, and `activity` API routes.
- [x] Added frontend error UI to avoid silent dashboard fallbacks.

### Performance and Scalability

- [x] Removed hardcoded pagination limits in HubSpot service methods.
- [x] Added stronger retry/rate-limit handling.
- [x] Shifted aggregation/filtering to HubSpot Search API where possible.

### Frontend and UX

- [x] Added Zustand-based global state management.
- [x] Added dashboard controls (date-range filtering).

### Quality and Delivery

- [x] Added test framework coverage for core service and UI logic.
- [x] Added CI pre-checks and Dependabot automation.
- [x] Ran dependency hygiene pass via `npm audit fix`.

## 3) Priority Backlog (Execution Order)

### P0 - Immediate (this week)

- [ ] Implement environment validation at startup (fail fast on missing required variables).
- [ ] Add database artifact hygiene:
  - ignore local SQLite artifacts (`prisma/*.db`, `*.db*`),
  - document local-vs-production DB workflow.
- [ ] Standardize API error contract across endpoints:
  - required: `code`, `message`,
  - optional debug payload only in non-production.
- [ ] Sanitize/gate client-side error logs in production.
- [ ] Add auth tests for signup route:
  - success,
  - duplicate email,
  - invalid payload,
  - server error branch.

### P1 - Short-Term (2-4 weeks)

- [ ] Implement email verification and password reset flows.
- [ ] Add auth endpoint hardening:
  - rate limiting/throttling,
  - abuse protections (e.g., CAPTCHA when needed),
  - stronger password policy checks.
- [ ] Standardize validation schemas (shared `zod` contracts for API + frontend forms).
- [ ] Add structured logging with request correlation IDs.
- [ ] Document migration workflow (`prisma migrate`, seed process, rollback notes).

### P2 - Mid-Term (1-2 months)

- [ ] Complete advanced service optimizations:
  - refactor `getDashboardMetrics` for fewer API calls and lower memory use,
  - refactor `getTrendData` to rely on filtered search queries,
  - audit API route handlers to consume optimized methods.
- [ ] Add integration/contract tests for `metrics`, `trends`, and `activity`.
- [ ] Introduce observability baseline (latency metrics, error rates, HubSpot rate-limit alerts).
- [ ] Move cache from in-memory to Redis for multi-instance consistency.

### P3 - Long-Term (quarter+)

- [ ] Security posture upgrades:
  - SCA integration (Snyk or GitHub Advanced Security),
  - transitive dependency remediation policy,
  - secrets and audit controls.
- [ ] RBAC management UI and permission audit history.
- [ ] Background jobs / pre-aggregation pipeline for heavy analytics workloads.
- [ ] Multi-tenant readiness (if product direction requires it).

## 4) Major Upgrade Strategy

- [ ] Upgrade frameworks in isolated branches, one major at a time:
  - Next.js `14 -> 15 -> 16`
  - React `18 -> 19`
  - Recharts `2 -> 3`
- [ ] For each major upgrade:
  - run `lint`, `type-check`, `test`, and `build`,
  - apply migration-guide code changes,
  - expand regression tests for changed behaviors,
  - update docs/changelog with breaking changes.

## 5) Definition of Done for Production Readiness

- [ ] CI gates green: `lint`, `type-check`, `test`, `build`, security checks.
- [ ] Auth flows fully covered: signup/signin/verify/reset.
- [ ] Environment and migration workflows documented and enforced.
- [ ] Monitoring and alerting live for key API and dependency risk metrics.
