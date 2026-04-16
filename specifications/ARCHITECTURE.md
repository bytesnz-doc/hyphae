# Architecture

Synthesised from the detailed flows. This document describes what the flows actually require — not speculative upfront design.

---

## System Shape

A **monorepo of independently publishable Node.js packages** under the `@hyphae/*` scope (pnpm workspaces + Turborepo). The deployment unit is a single Fastify process (the server) backed by a storage file or service. There is no required external service — the default SQLite adapter means a deployment is one Node.js process and one file.

The client (Phase 3+) is a separate Svelte 5 SPA/PWA. It communicates with the server exclusively through the JSON:API. All server-side rendering (HTML, JSON-LD, Turtle, etc.) is handled by renderer modules on the server — the client is not required for the API to be useful.

---

## Layers & Components

### `@hyphae/core`
The shared type contracts and runtime business logic. No HTTP, no storage, no rendering.

**Owns:**
- TypeScript interfaces for all module types (`HyphaeModule`, `OntologyModule`, `StorageAdapter`, `Renderer`, `ConnectorModule`, `ActionModule`)
- TypeScript interfaces for all data entities (`Project`, `Collection`, `FieldDefinition`, `Record`, `Query`)
- Ontology registry — loaded at startup (SF-001), populated by ontology modules. Resolves a term IRI to its full metadata (SF-004)
- Project / Collection / Record Manager — CRUD, query execution, field resolution, filter parsing, pagination
- Filter parser — translates `filter[path][$op]=value` query strings into a typed `FilterExpression` tree (UF-017)
- Pagination and sort helpers

---

### `@hyphae/server`
The Fastify HTTP server. Assembles all modules at startup and wires requests to the right handlers.

**Owns:**
- `defineConfig()` — the public API for registering modules (SF-001)
- Module assembly and startup sequence (SF-001)
- URL routing per the JSON:API URL structure
- `onRequest` hook: content negotiation (SF-006) — inspects the `Accept` header and attaches the matching renderer to the request context
- Static file serving for the future PWA client assets
- Schema endpoint — `Accept: application/schema+json` + `?v=N` version parameter (UF-012)

---

### `@hyphae/access-control`
A Fastify plugin providing authentication and RBAC. Sits between the server and the core data layer.

**Owns:**
- Local auth: bcrypt password hashing, JWT issuance and validation (UF-001, UF-002)
- OAuth 2.0 / OIDC: token validation and identity mapping (UF-003)
- Account lockout after 5 consecutive failures (SF-002)
- RBAC enforcement: role resolution + permission check before every storage adapter call (SF-003)
- Role assignment management (UF-004)
- Permission model: two-dimensional (operation × scope), two levels (server-level and project-level)

---

### Ontology Modules (`@hyphae/ontology-*`)
Each module understands one ontology format. Registered into the ontology registry at startup (SF-001).

**Each module owns:**
- Parsing a specific format (OWL, SKOS, JSON Schema, RDFS)
- Resolving a term IRI to its metadata: label, description, data type, cardinality, domain, range, source ontology
- Listing all terms in the loaded ontology

**Phase 1:** `@hyphae/ontology-jsonschema` (reads JSON Schema `properties` as term definitions)
**Phase 2+:** `@hyphae/ontology-owl`, `@hyphae/ontology-skos`, `@hyphae/ontology-rdfs`

---

### Term Collections (`@hyphae/collection-*`)
Curated, pre-packaged vocabularies. Reference one or more ontology modules. Registered into the ontology registry at startup.

**Each collection owns:**
- A versioned set of terms from a specific standard
- Linking terms to the appropriate ontology module for resolution

**Phase 2+:** `@hyphae/collection-dwc` (Darwin Core), `@hyphae/collection-schema-org`, `@hyphae/collection-dc`, `@hyphae/collection-wgs84`

---

### Storage Adapters (`@hyphae/storage-*`)
The only layer that talks to a database or external data service. Everything above the adapter interface is storage-agnostic.

**Each adapter owns:**
- Implementing the `StorageAdapter` interface from `@hyphae/core`
- Translating the `FilterExpression` query model into the backend's native query language (UF-017)
- Connection management, transactions, and migrations

**Phase 1:** `@hyphae/storage-sqlite` (default), `@hyphae/storage-memory` (testing/ephemeral)
**Phase 3+:** `@hyphae/storage-postgres`, `@hyphae/storage-couchdb`, `@hyphae/storage-oxigraph`, `@hyphae/storage-arangodb`

---

### Renderers (`@hyphae/renderer-*`)
Transform a `ResolvedResource` (record + attached ontology metadata) into a specific output format. Selected by the content negotiation hook (SF-006).

**Each renderer owns:**
- Registering the MIME types it handles
- Accepting a `ResolvedResource` and a `RenderContext` and returning serialised output

**Phase 1:** `@hyphae/renderer-html` (server-rendered HTML forms, record views, lists), `@hyphae/renderer-json` (plain JSON + JSON:API)
**Phase 2+:** `@hyphae/renderer-jsonld`, `@hyphae/renderer-turtle`, `@hyphae/renderer-rdfxml`, `@hyphae/renderer-csv`, `@hyphae/renderer-dwca`

---

### Action Modules (`@hyphae/action-*`) — optional
Event-driven scripts triggered by record CRUD events (SF-005). Optional; registered at startup.

---

### Connector Modules (`@hyphae/connector-*`) — optional, Phase 3+
Map external data sources into hyphae's data model (UF-027, UF-028). Operate outside the main request path; run explicitly via CLI or admin UI.

---

### `@hyphae/security` — optional, Phase 4+
Client-side keypair management, record signing (SF-009, SF-010), and field-level encryption (SF-011). Does not modify core server or storage adapter behaviour; hooks into the auth flow and record mutation pipeline.

---

## Flow → Component Mapping

| Flow type | Component path |
|-----------|----------------|
| All user flows | `@hyphae/server` (routing) → `@hyphae/access-control` (SF-003 auth + RBAC) → `@hyphae/core` (business logic) → storage adapter |
| All responses | `@hyphae/core` resolves data → `@hyphae/server` invokes SF-006 (content negotiation) → renderer module serialises output |
| SF-001 (startup) | `@hyphae/server` assembles all modules from config |
| SF-004 (ontology resolution) | `@hyphae/core` (ontology registry) → ontology modules |
| SF-005 (action modules) | `@hyphae/core` (record manager fires event after storage commit) → action modules |
| SF-006 (content negotiation) | `@hyphae/server` (onRequest hook) → renderer modules |
| SF-002 (account lockout) | `@hyphae/access-control` (auth layer) |

---

## Key Patterns

1. **Every user flow is gated by SF-003.** Authentication and RBAC are enforced in a Fastify pre-handler hook before any route handler or storage call runs.

2. **Every response is gated by SF-006.** The content negotiation hook runs on every request and attaches the selected renderer before the route handler executes. No renderer is selected inside a route handler.

3. **Renderers receive a `ResolvedResource`, not raw data.** The route handler assembles a `ResolvedResource` (record data + full ontology metadata) and passes it to the renderer. Renderers never query the ontology registry directly.

4. **All storage access goes through the `StorageAdapter` interface.** `@hyphae/core` and above never call a database directly. This makes every layer above the adapter testable with `@hyphae/storage-memory`.

5. **SF-004 runs on collection load, not per record.** Resolved collection schemas are cached in memory. Individual record views do not trigger ontology resolution.

6. **Action modules fire after a committed mutation, never before.** An action module error does not reverse the committed record mutation. The mutation's HTTP response is not affected by action module failures.

7. **Filter values are type-coerced and validated before reaching the storage adapter.** Invalid filter values return `400 Bad Request` at the server layer; the storage adapter never receives an ill-typed query.

8. **The server deploys with zero external services.** With `@hyphae/storage-sqlite`, the only runtime requirement is Node.js. No database server, no queue, no cache.

---

## Out of Scope (Current Phase)

- PWA client, service worker, IndexedDB, sync engine, and offline operation (Phase 3)
- OWL, SKOS, RDFS ontology modules (Phase 2)
- Darwin Core, Schema.org, Dublin Core, WGS84 term collections (Phase 2)
- JSON-LD, Turtle, RDF/XML, CSV, and Darwin Core Archive renderers (Phase 2+)
- Simple / complex view toggle in the frontend (Phase 2)
- Subscription delivery: WebSocket and push notifications (Phase 3)
- Data explorer and reports (Phase 2+)
- Encryption at rest and record signing (`@hyphae/security`, Phase 4)
- Connector modules for external data source import (Phase 3+)
- Cross-instance federation and GBIF publishing (Phase 5)
- Admin UI (Phase 5)
