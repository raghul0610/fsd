# Testing

The repository contains three testing layers.

## Backend

- Vitest unit tests for the deterministic triage engine.
- Supertest integration tests for health, knowledge retrieval, and idempotent sync.

## Frontend

- Vitest + React Testing Library for the application shell.
- Local triage behavior is exercised independently from the API.

## End-to-end

Playwright verifies the PWA shell remains usable after the browser is taken offline and reloaded. The intended full scenario is: load online, create local data, disable connectivity, refresh, verify persistence, restore connectivity, synchronize, and verify no duplicate operation is created.

## Verification commands

```bash
npm install
npm run lint
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

The current environment could not complete `npm install` because the package registry request timed out. This is an environment/network limitation, not a reported application test failure.