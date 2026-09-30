# Rural Healthcare Platform

A JavaScript MERN, multilingual-ready, offline-first rural healthcare MVP.

## Features

- React + Vite PWA
- Tailwind CSS v3
- Node.js + Express + MongoDB/Mongoose
- Dexie/IndexedDB offline persistence
- Offline healthcare knowledge retrieval
- Deterministic LOW/MODERATE/CRITICAL triage foundation
- PHC and community-health-worker directory
- Offline conversation history
- Idempotent synchronization queue
- Online/offline/sync status
- No login required

## Run

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Configure `MONGODB_URI` when MongoDB is available. The API also has a development in-memory fallback.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open `http://localhost:5173`.
7. API health: `http://localhost:4000/api/health`.

To seed MongoDB with demonstration data:

```bash
npm --workspace apps/api run seed
```

## Verification

Run the complete local verification after dependencies are installed:

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

The source tree was statically validated in the build environment. Dependency installation could not be completed in that environment because the npm registry operation timed out, so the commands above must still be executed on a networked development machine before deployment.

## Architecture

See `docs/architecture.md`, `docs/offline-sync.md`, `docs/rag.md`, and `docs/testing.md`.

## Safety

This is a software demonstration, not a diagnostic system. Demonstration knowledge and triage rules must be replaced or clinically reviewed before real-world deployment. Directory records must also be verified locally.