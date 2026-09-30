# Architecture

The platform is a JavaScript MERN application with an offline-first browser client.

```text
React + Vite PWA
  |
  +-- Dexie / IndexedDB
  |     +-- conversations
  |     +-- messages
  |     +-- assessments
  |     +-- knowledge
  |     +-- facilities / workers
  |     +-- syncQueue
  |
  +-- LocalKnowledgeRetriever
  +-- TriageEngine
  +-- SyncEngine
          |
          | online
          v
      Express API
          |
          v
       MongoDB
```

MongoDB is the online server-side source of truth. IndexedDB is the browser source for offline work. A development fallback in the API keeps the demonstration usable without MongoDB; production deployment should always configure `MONGODB_URI`.

There is deliberately no login in this MVP. A random device ID is generated locally to associate synchronization operations.