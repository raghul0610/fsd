# Offline and Synchronization

The service worker caches the application shell. Dexie persists domain data and the sync queue in IndexedDB.

Each locally generated entity has a client-generated UUID. Each queued operation has its own operation ID. The API records processed operation IDs so retrying the same operation is idempotent.

The client retries `PENDING` and `FAILED` operations up to five attempts. Failed operations remain visible in Sync Center rather than being silently discarded.

The MVP uses UPSERT synchronization. More sophisticated conflict resolution can be introduced later with entity versions and server timestamps.