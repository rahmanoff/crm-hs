# HubSpot Dashboard Refactoring & Improvement Plan

This document outlines the roadmap for improving the HubSpot CRM dashboard application, focusing on stability, scalability, and maintainability.

---

### Phase 1: Stabilization (Immediate Fixes)

The priority is to make the application robust and prevent silent failures.

- [x] **Standardize API Error Handling for `metrics` route**: Refactor `app/api/metrics/route.ts` to propagate specific errors from the HubSpot API instead of returning default data.
- [x] **Implement Frontend Error UI**: Update `app/page.tsx` to handle backend errors gracefully, showing a dedicated error screen to the user instead of a dashboard with zeroed-out metrics.
- [x] **Standardize API Error Handling for `trends` and `activity` routes**: Apply the same error handling pattern to `app/api/trends/route.ts` and `app/api/activity/route.ts` to ensure all endpoints are consistent.

---

### Phase 2: Scalability & Performance

Address the core performance bottlenecks to ensure the application works for HubSpot accounts of all sizes.

- [x] **Remove Hardcoded Pagination Limits**: In `lib/hubspot.ts`, remove the arbitrary `pageCount` safety limits in `getContacts`, `getCompanies`, `getDeals`, etc., to allow full data fetching.
- [x] **Implement Robust Rate Limiting**: Replace the basic `setTimeout` delay with a proper exponential backoff strategy for retrying `429` rate-limited requests.
- [x] **Optimize Data Aggregation**: This is the most significant scalability improvement.
  - **Done**: Investigated and implemented HubSpot's [Search API](https://developers.hubspot.com/docs/api/crm/search) to perform calculations on their servers, which dramatically reduces the amount of data we need to transfer and process.

---

### Phase 3: Frontend Enhancements

Improve the user experience and maintainability of the frontend code.

- [x] **Introduce a Global State Manager**: For better state management as complexity grows, integrate a lightweight library like Zustand. This will help manage global state like the current user, dashboard filters, and API loading/error states.
- [x] **Add Dashboard Controls**: Implement user controls, such as a date range picker, to allow users to filter the dashboard data (e.g., "Last 30 Days," "This Quarter").

---

### Phase 4: Code Quality & Maintenance

Introduce development practices that ensure long-term stability and ease of maintenance.

- [x] **Add Unit & Integration Tests**: Implement a testing framework (e.g., Jest, React Testing Library) and add tests for critical components and API services.
  - Test the `HubSpotService` methods with mocked API responses.
  - Test React components to ensure they render correctly based on props and state.
- [ ] **Implement Environment Validation**: Add a startup check to ensure that all required environment variables (i.e., `HUBSPOT_API_KEY`) are present, and fail fast with a clear error message if they are not. (Skipped due to technical issues).

---

### Phase 5: Advanced Performance Optimization

Building on the initial scalability improvements in Phase 2, this phase will focus on hyper-optimizing data fetching logic in `lib/hubspot.ts` to minimize API calls, reduce memory usage, and improve overall dashboard loading speed.

- [ ] **Refactor `getDashboardMetrics` for Efficiency**:

  - Deprecate and remove the `countAllDeals` method.
  - Leverage `Promise.all` to run data-fetching operations concurrently instead of sequentially.
  - Replace broad data fetches (e.g., `getDeals(0)`) with targeted `searchObjects` queries. Use filters to have HubSpot perform aggregations for metrics like active, won, and lost deals, and total revenue.

- [ ] **Refactor `getTrendData` for Performance**:

  - Modify the function to use `searchObjects` with date range filters. This will offload the filtering from the application to the HubSpot API, resulting in smaller payloads and faster processing.

- [ ] **Review and Optimize API Route Handlers**:
  - After refactoring `HubSpotService`, audit the API routes (`app/api/metrics/route.ts`, etc.) to ensure they correctly utilize the new, more efficient service methods.

---

### Phase 6: Security & CI (Current Priority)

- [x] **Run `npm audit` and apply quick fixes**: I ran `npm audit fix` to patch automatically fixable vulnerabilities and validated the app's tests and type-checks.
- [x] **Add Dependabot**: configured weekly Dependabot to open PRs for dependency upgrades automatically.
- [x] **Add CI pre-checks**: Update Azure Static Web Apps workflow with `pre-checks` job to run lint, type-check, tests, and `npm audit` before deployment.
- [ ] **Add SCA (Snyk/GitHub Advanced Security)**: Recommend enabling Snyk or GitHub Advanced Security to scan for vulnerabilities and secret scanning.
- [ ] **Upgrade high-risk transitive dependencies**: Review and escalate fixes for packages like `axios`, `form-data`, and other transitive deps requiring major version updates.

---

### Phase 7: Major Upgrades & Migration (Next.js, React, Recharts)

Upgrade strategy:

1. Create a dedicated branch for each major upgrade (e.g., `chore/upgrade-next-15`, `chore/upgrade-next-16`, or `chore/upgrade-react-19`).
2. Upgrade incrementally: major upgrades should be staged from minor releases (e.g., Next 14 -> 15 -> 16) rather than jumping directly to the latest major release.
3. For each step:

- Run `npm install` for the target major (e.g., `npm install next@^15`) and execute the test suite, build, and lint tasks.
- Update code for breaking changes based on the framework's migration guide.
- Write new tests for any added/changed behavior (especially for Recharts updates & component API changes).
- Validate static & dynamic routes, edge functions, and SSR vs. SSG behaviors (if applicable).

4. Recharts migration guidance:

- Start by bumping to the next major (2.x -> 3.x) in a separate branch.
- Ensure `ResponsiveContainer` and `Tooltip` API differences are handled; tests should assert chart elements render with expected props.
- Update the test setup for `ResizeObserver` if necessary.

5. Finalize and merge each major tick with a PR that includes: README updates, migration notes, and a list of resolved issues and/or breaking changes.

Estimated effort: 1-3 days per major migration, depending on the number of breaking changes and the amount of test coverage.
