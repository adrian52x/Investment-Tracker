# Investment Tracker

A minimalist, offline-first PWA for tracking personal stock investments across
two accounts — **SaxoBank** (DKK, aktiesparekonto) and **Revolut** (USD). All
data is stored locally on the device in IndexedDB.

## Architecture

**Transactions are the single source of truth.** There is no stored balance —
cash, holdings, and P/L are derived by reducing over an append-only transaction
log (event sourcing), so edits and deletes recompute everything automatically.

- [src/lib/types.ts](src/lib/types.ts) — data model
- [src/lib/calc.ts](src/lib/calc.ts) — pure reducer (`summarize`) and
  validation; no I/O, fully unit-tested
- [src/lib/repository.ts](src/lib/repository.ts) — `TransactionRepository`
  interface; swap the Dexie implementation for a Postgres-backed API in v2
  without touching UI or business logic
- [src/lib/dexie-repository.ts](src/lib/dexie-repository.ts) — IndexedDB
  implementation (Dexie)
- [src/lib/backup.ts](src/lib/backup.ts) — JSON export/import

## Commands

```bash
npm run dev     # dev server
npm test        # reducer unit tests (vitest), includes the acceptance test
npm run build   # production build
npm start       # serve the production build
```

## PWA / iOS install

Serve the production build over HTTPS, open it in Safari on iPhone, then
**Share → Add to Home Screen**. The app launches full-screen and works fully
offline: a hand-rolled service worker ([public/sw.js](public/sw.js)) precaches
the app shell and runtime-caches static assets. The service worker only
registers in production builds.

When shipping UI changes, bump the `CACHE` version string in
[public/sw.js](public/sw.js) so installed clients refresh their cache.

## Backup

Data lives only on the device. Use the download icon on the Overview screen to
export a JSON backup, and the same sheet to restore one (restore replaces all
existing data).
