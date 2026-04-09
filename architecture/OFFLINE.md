# Offline-First Strategy

## Why Offline Matters

hyphae's primary users often work in environments without reliable internet connectivity:
- Conservation field officers in remote areas
- USAR teams in disaster zones
- Researchers at remote field stations

Offline capability is not an optional feature — it is a core requirement.

## Approach

### Progressive Web App (PWA)

The frontend is a PWA, installable on desktop and mobile. Key capabilities:
- **Service Worker** caches the application shell and static assets
- **Background Sync** queues mutations made offline and replays them when connectivity is restored
- **Install prompt** for add-to-home-screen on mobile

### Local Storage

Client-side data is stored using **IndexedDB** (via [RxDB](https://rxdb.info/) or [Dexie.js](https://dexie.org/)):
- Records created/edited offline are stored locally first
- A sync queue tracks pending mutations
- On reconnection, the sync engine reconciles local and server state

### Sync Strategy

- **Last-write-wins** as a simple default
- **Conflict detection** using record version numbers (`meta.version`)
- **Conflict resolution UI** — users are notified of conflicts and can choose which version to keep
- Storage adapters that support native sync (e.g. CouchDB) can leverage their own sync mechanisms

### Server-Side Considerations

- The server must be runnable locally (e.g. as an Electron app or local Node.js process) for fully offline deployments
- SQLite storage adapter is the default for local deployments — zero external dependencies
