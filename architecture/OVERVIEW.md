# System Overview

This document describes the overall structure of hyphae — its major components,
how they fit together, and how a request flows through the system. For the
reasoning behind key design choices, see [DECISIONS.md](./DECISIONS.md). For
the specific technology choices, see [TECHNOLOGY.md](./TECHNOLOGY.md).

---

## The Big Picture

hyphae is a modular, ontology-aware data platform. It has three main layers:

```
                       [External DBs / CSV / APIs]
                                    │
                       ┌────────────▼────────────┐
                       │  Connector Modules       │  (optional)
                       │  @hyphae/connector-*     │
                       └────────────┬────────────┘
                                    │
╔═══════════════════════════════════▼═══════════════════════════════╗
║                        CLIENT (PWA)                               ║
║  ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐      ║
║  │  Simple View  │  │  Complex View  │  │  Offline (store/ ║      ║
║  │  forms/tables │  │  IRIs, types,  │  │  IndexedDB +     ║      ║
║  │  reports      │  │  raw RDF       │  │  Sync Queue)     ║      ║
║  └───────────────┘  └────────────────┘  └──────────────────┘      ║
╚══════════════════════════╤════════════════════════════════════════╝
                           │  HTTP  ·  JSON:API  ·  Accept header
╔══════════════════════════▼════════════════════════════════════════╗
║                        SERVER                                     ║
║  ┌────────────────┐  ┌─────────────────┐  ┌───────────────┐       ║
║  │ Ontology       │  │ Project /        │  │ Renderer      ║       ║
║  │ Registry       │  │ Collection /     │  │ Engine        ║       ║
║  │                │  │ Record Manager   │  │               ║       ║
║  │ ontology-owl   │  │                  │  │ renderer-html ║       ║
║  │ ontology-skos  │  │  schema          │  │ renderer-json ║       ║
║  │ collection-dwc │  │  resolution      │  │ renderer-jsonl║       ║
║  │ collection-dc  │  │  field mapping   │  │ renderer-ttl  ║       ║
║  │                │  │  query/search    │  │ renderer-csv  ║       ║
║  └────────────────┘  └────────┬────────┘  └───────────────┘       ║
║                               │  fires events                     ║
║                    ┌──────────▼──────────┐                        ║
║                    │  Action Modules      │  (optional)            ║
║                    │  @hyphae/action-*    │                        ║
║                    └─────────────────────┘                        ║
╚══════════════════════════╤════════════════════════════════════════╝
                           │  Storage Adapter interface
╔══════════════════════════▼════════════════════════════════════════╗
║                    STORAGE BACKENDS                               ║
║   storage-sqlite  │  storage-postgres  │  storage-couchdb         ║
║   storage-arangodb │  storage-oxigraph (SPARQL)  │  storage-memory║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## Components

### 1. Client (`@hyphae/client`)

A Progressive Web App (PWA) built with Svelte. It is the end-user interface —
the part that makes ontology-backed data feel like a normal web application.

**Responsibilities:**
- Render simple, human-friendly forms for creating and editing records
- Display search results, reports, and record views
- Provide a **complex view toggle** that surfaces the ontological detail behind
  each field (IRIs, definitions, data types, source ontology)
- Cache data locally in IndexedDB (via Dexie.js) for offline use
- Queue mutations made offline and replay them on reconnection
- Install as a PWA on mobile and desktop devices

The client communicates exclusively through the server's JSON:API endpoints. It
does not access storage backends directly.

See [UI.md](./UI.md) and [OFFLINE.md](./OFFLINE.md) for detail.

---

### 2. Server (`@hyphae/server`)

A Fastify HTTP server. It is the hub of the system — assembling modules at
startup, routing requests, negotiating content types, and coordinating between
the ontology registry, the data layer, and the renderer engine.

**Responsibilities:**
- Serve the client PWA (static files)
- Expose JSON:API endpoints for all data operations
- Perform HTTP content negotiation — selecting the right renderer based on the
  `Accept` header so a single URL serves HTML, JSON-LD, Turtle, CSV, etc.
- Load and register modules (ontology, storage, renderer) at startup
- Route requests through: ontology resolution → data retrieval → rendering

The server is intentionally deployable without external services. With the
default SQLite storage adapter, the only requirement is Node.js.

---

### 3. Ontology Registry

A runtime index of loaded ontology modules and term collections. Not a
standalone package — it lives within `@hyphae/core` and is populated at startup
by the server.

**Responsibilities:**
- Accept registrations from ontology modules (`@hyphae/ontology-*`) and term
  collections (`@hyphae/collection-*`)
- Resolve a term IRI to its full metadata: label, description, data type,
  cardinality, domain, range, and source ontology
- List all available terms for a given collection
- Support mixed-collection schemas (e.g. DWC core terms + custom JSON Schema
  extensions in the same project)

**Module types that plug into the registry:**

| Module type | What it does |
|---|---|
| `ontology-*` | Understands a specific ontology format (OWL, SKOS, RDFS, JSON Schema) |
| `collection-*` | A curated, pre-packaged vocabulary (Darwin Core, Dublin Core, Schema.org) |

See [MODULES.md](./MODULES.md) for the full taxonomy and interface definitions.

---

### 4. Project / Collection / Record Manager

The core data logic layer, also in `@hyphae/core`. It manages the three
fundamental entities that users and the API interact with.

**Responsibilities:**
- CRUD operations on Projects, Collections, and Records
- Resolving a collection's field definitions by looking up each field's
  `termIri` in the ontology registry
- Translating the resolved schema into the storage adapter's query model
- Handling search, filtering, sorting, and pagination
- Enforcing field constraints derived from the ontology

See [DATA-MODEL.md](./DATA-MODEL.md) for the full type definitions and URL
structure.

---

### 5. Renderer Engine

Transforms a resolved resource (a Project, Collection, or Record with all
ontology metadata attached) into a specific output format. Renderers are
selected by the server's content negotiation layer.

**Responsibilities:**
- Accept a `ResolvedResource` and a `RenderContext` (request metadata, project
  config, etc.)
- Return the serialised output: HTML string, JSON buffer, Turtle string, etc.
- Register the MIME types they handle

Each renderer is an independent module (`@hyphae/renderer-*`). Installing only
the renderers you need keeps the deployment footprint small.

See [API.md](./API.md) for the content negotiation design and MIME type mapping.

---

### 6. Storage Adapters (`@hyphae/storage-*`)

Storage adapters are the only component that talks to a database or external
data service. Everything above the adapter interface is storage-agnostic.

**Responsibilities:**
- Implement the `StorageAdapter` interface from `@hyphae/core`
- Translate hyphae's internal query model into the native query language of the
  backend (SQL, SPARQL, CouchDB Mango, etc.)
- Handle connections, transactions, and migrations

The adapter is chosen per-project — different projects within the same hyphae
instance can use different storage backends.

---

### 7. Connector Modules (`@hyphae/connector-*`) — optional

An optional layer that maps external, non-ontologised data sources into hyphae's data model. Connectors sit outside the main request path; they are run explicitly (via CLI or admin UI) to introspect and sync external data.

Examples: `@hyphae/connector-sql` (introspects a SQL database, proposes collection schemas), `@hyphae/connector-csv`.

See [MODULES.md](./MODULES.md) for the `ConnectorModule` interface.

---

### 8. Action Modules (`@hyphae/action-*`) — optional

Event-driven scripts that are triggered by record CRUD events (create, update, delete). Actions are registered at startup and invoked by the Record Manager after a successful mutation.

Actions can run on the server (always available) or in the browser (queued when offline and replayed on reconnect).

See [MODULES.md](./MODULES.md) for the `ActionModule` interface.

Here is how an HTTP request travels through the system, using a record fetch as
an example:

```
Browser                    Server                         Storage
  │                          │                               │
  │  GET /nz-birds/obs/001   │                               │
  │  Accept: text/html       │                               │
  ├─────────────────────────►│                               │
  │                          │  1. Content negotiation       │
  │                          │     → select renderer-html    │
  │                          │                               │
  │                          │  2. Route to Record Manager   │
  │                          │                               │
  │                          │  3. Fetch record              │
  │                          ├──────────────────────────────►│
  │                          │◄──────────────────────────────┤
  │                          │     raw record data           │
  │                          │                               │
  │                          │  4. Resolve field IRIs        │
  │                          │     via Ontology Registry     │
  │                          │     → attach term metadata    │
  │                          │                               │
  │                          │  5. Pass ResolvedResource     │
  │                          │     to renderer-html          │
  │                          │     → render HTML page        │
  │                          │                               │
  │◄─────────────────────────┤                               │
  │  200 OK                  │                               │
  │  Content-Type: text/html │                               │
  │  <rendered page>         │                               │
```

The same request with `Accept: application/ld+json` follows an identical path
but selects `renderer-jsonld` at step 1, producing JSON-LD output instead.

---

## Module Assembly

At startup, the server assembles the active module set from configuration.
A minimal configuration might look like:

```typescript
// hyphae.config.ts
import { defineConfig } from '@hyphae/server';
import { SQLiteAdapter } from '@hyphae/storage-sqlite';
import { OWLOntologyModule } from '@hyphae/ontology-owl';
import { DarwinCoreCollection } from '@hyphae/collection-dwc';
import { HTMLRenderer } from '@hyphae/renderer-html';
import { JSONLDRenderer } from '@hyphae/renderer-jsonld';

export default defineConfig({
  storage: new SQLiteAdapter({ path: './data/hyphae.db' }),
  ontologies: [new OWLOntologyModule()],
  collections: [new DarwinCoreCollection()],
  renderers: [new HTMLRenderer(), new JSONLDRenderer()],
});
```

Modules register themselves with the server on startup. The ontology registry
is populated, storage is connected, and renderers are indexed by MIME type.
Nothing is hardwired — swap any module for another that implements the same
interface.

---

## Key Concepts at a Glance

| Concept | What it is |
|---|---|
| **Project** | Top-level container. Defines which ontologies, storage, and renderers are in use |
| **Collection** | A named set of records within a project (like a table or dataset). Fields are backed by ontology terms |
| **Record** | A single data entry in a collection |
| **Term** | A field definition backed by an ontology IRI (e.g. `dwc:scientificName`) |
| **Ontology module** | Knows how to parse and query a specific ontology format (OWL, SKOS, JSON Schema…) |
| **Term collection** | A curated vocabulary — a ready-to-use set of terms from a standard (Darwin Core, Dublin Core…) |
| **Storage adapter** | Translates hyphae's query model to a specific backend (SQLite, PostgreSQL, SPARQL…) |
| **Renderer** | Serialises a resolved resource to a specific format (HTML, JSON-LD, Turtle, CSV…) |
| **Connector** | Maps an external data source (SQL DB, CSV, Airtable…) into hyphae's data model |
| **Action** | An event-driven script triggered by record CRUD events |
| **Simple view** | The default UI: human-readable labels, no ontology jargon |
| **Complex view** | Toggle-on UI: adds IRIs, definitions, data types, and raw RDF view |

---

## Further Reading

| Document | Go there for… |
|---|---|
| [VISION.md](./VISION.md) | The problem, goals, and guiding principles |
| [MODULES.md](./MODULES.md) | Full module taxonomy and TypeScript interface contracts |
| [DATA-MODEL.md](./DATA-MODEL.md) | Project / Collection / Record types and URL structure |
| [API.md](./API.md) | Content negotiation, JSON:API design, filtering, and subscriptions |
| [TECHNOLOGY.md](./TECHNOLOGY.md) | Specific frameworks, libraries, and tooling |
| [OFFLINE.md](./OFFLINE.md) | PWA, IndexedDB, and sync strategy |
| [UI.md](./UI.md) | Simple/complex view, data explorer, and reports |
| [ACCESS-CONTROL.md](./ACCESS-CONTROL.md) | Authentication, RBAC, and permission model |
| [SECURITY.md](./SECURITY.md) | Encryption at rest and key model |
| [ROADMAP.md](./ROADMAP.md) | Phased development plan |
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records |
