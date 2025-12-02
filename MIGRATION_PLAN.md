# Major Upgrade & Migration Plan

This document outlines a safe, incremental approach to upgrading major dependencies in the project such as Next.js, React, and Recharts.

## Goals

- Upgrade with minimal risk and migration friction.
- Ensure CI/build/test coverage before and after each step.
- Keep PRs limited in scope for easier review.

## Recommended approach

1. Create a new branch for each major upgrade (e.g., `chore/upgrade-next-15`, `chore/upgrade-next-16`).
2. For each major step, run the following checks:
   - `npm ci` and `npm run lint` (fix lint issues as needed)
   - `npm run type-check` (ensure no type regressions)
   - `npm run test` (adjust/update tests if required)
   - `npm run build` (validate platform-specific issues)
3. Be mindful of transitive package upgrades and update code based upon release notes.

## React 18 -> 19

- React 19 may introduce new features and deprecations; update in a branch and run your test suite.
- Expect changes to hooking mechanics, Suspense improvements, and other internals. Follow the React release notes.

## Next.js 14 -> 16

- Upgrade step-by-step through intermediate versions when possible (14 -> 15 -> 16) to reduce risk.
- Update `next.config.js` for any new configurations or flags.
- Ensure that App Router and Pages Router behavior is preserved; migrate code where Next 15/16 introduces different conventions.

## Recharts 2 -> 3

- Check breaking changes for `ResponsiveContainer`, `Area`, `Line`, and `Tooltip` components.
- Update `components/TrendChart.tsx` and tests accordingly.

## Tests & PRs

- Each major bump should have its own PR with a brief summary and test coverage for changed components.
- In CI, run `npm audit`, `npm ci`, `npm run lint`, `npm run type-check`, `npm run test`, and `npm run build` before merging.

## Timing / Effort estimate

- Short, low-risk upgrades (dev tooling): 1-2 hours.
- Major frontend upgrades (Next/React): 1-2 days per major version depending on the codebase size and tests.

## Notes

- For each major upgrade, read the migration guides and fix any new warnings/errors.
- Consider adding `@next/eslint-plugin` or appropriate ESLint rules for Next.js-specific features as part of the migration.
