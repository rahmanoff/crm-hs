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

- [ ] **Add Unit & Integration Tests**: Implement a testing framework (e.g., Jest, React Testing Library) and add tests for critical components and API services.
  - Test the `HubSpotService` methods with mocked API responses.
  - Test React components to ensure they render correctly based on props and state.
- [ ] **Implement Environment Validation**: Add a startup check to ensure that all required environment variables (i.e., `HUBSPOT_API_KEY`) are present, and fail fast with a clear error message if they are not. This prevents runtime errors due to misconfiguration.
