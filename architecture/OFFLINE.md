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

- **Patch-based sync** — only changed fields are sent to the server, not full records
- **Last-write-wins** as a simple default
- **Conflict detection** using record version numbers (`meta.version`)
- **Conflict resolution UI** — users are notified of conflicts and can choose which version to keep
- Storage adapters that support native sync (e.g. CouchDB) can leverage their own sync mechanisms

### Server-Side Considerations

- The server must be runnable locally (e.g. as an Electron app or local Node.js process) for fully offline deployments
- SQLite storage adapter is the default for local deployments — zero external dependencies

## Sync Configuration

Sync is configurable at two levels:

**App-level**: the project/collection definition specifies which collections are syncable and any mandatory sync filters. This is set by the project administrator and cannot be overridden by end users.

**User-level**: within the bounds defined at app level, individual users can choose which subsets to sync. For example: "sync only incidents from the last 7 days" or "sync only my assigned tasks".

Collection sync filters can reference other synced collections. For example: "sync assignments where incident is in the set of synced incidents". This keeps relational consistency in the local store without requiring a full dataset sync.

## Custom Indexes

hyphae does not use IndexedDB's built-in indexes. Built-in indexes operate on plaintext and are incompatible with field-level encryption. Instead, hyphae maintains its own index structures within IndexedDB:

| Index type | Used for |
|---|---|
| Hash | Equality lookups |
| Number | Range queries |
| Geometry | Spatial queries (bounding box, radius) |

Index definitions are declared in the collection config via `x-indexes` (see [DATA-MODEL.md](./DATA-MODEL.md)). The client store builds and updates these indexes as records are written.

## Web Worker

Sync runs in a dedicated **Web Worker**, off the main thread. This prevents sync operations (which can involve many IndexedDB reads and writes plus network requests) from blocking the UI. The worker communicates with the main thread via `postMessage`.

## Tombstones

Records created offline are assigned a temporary local ID. When the record is synced to the server it receives a permanent server-assigned ID. A tombstone entry maps the old local ID to the new server ID and triggers an update of all local references (e.g. related records that reference the old ID by a foreign-key-style field).
