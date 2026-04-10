# Roadmap

hyphae is in early design phase. This roadmap is intentionally phased to keep scope manageable and ensure each phase delivers something usable.

## Phase 0 — Foundation (current)
- [x] Project vision and goals documented
- [x] Architecture documented
- [ ] Core interfaces defined (`@hyphae/core` types/interfaces — TypeScript)
- [ ] Monorepo scaffolded (pnpm workspaces)
- [ ] CI/CD skeleton (GitHub Actions)

## Phase 1 — Minimal Viable Hypha
*Goal: a single working end-to-end path. One ontology, one storage adapter, one renderer.*

- [ ] `@hyphae/core` — data model + plugin interfaces
- [ ] `@hyphae/ontology-jsonschema` — simplest ontology module (bridges skemer work)
- [ ] `@hyphae/storage-sqlite` — embedded, zero-dependency storage
- [ ] `@hyphae/renderer-html` — server-rendered HTML forms and record views
- [ ] `@hyphae/renderer-json` — plain JSON output
- [ ] `@hyphae/server` — minimal HTTP server with content negotiation
- [ ] Basic project + collection + record CRUD
- [ ] Filtering — basic field-level filter support (`filter[path][$op]=value`)
- [ ] Access control — local auth + RBAC (roles defined per project)
- [ ] Example: a simple custom collection with JSON Schema

## Phase 2 — Semantic Web
*Goal: real ontology support and Darwin Core.*

- [ ] `@hyphae/ontology-owl` — OWL/RDF ontology module
- [ ] `@hyphae/ontology-skos` — SKOS module
- [ ] `@hyphae/collection-dwc` — Darwin Core term collection
- [ ] `@hyphae/renderer-jsonld` — JSON-LD output
- [ ] `@hyphae/renderer-turtle` — Turtle output
- [ ] Simple/complex view toggle in the frontend
- [ ] Subscriptions — polling (`?since=<timestamp>`) as initial delivery mechanism
- [ ] Schema API endpoint (`Accept: application/schema+json`, `?v=N` versioning)
- [ ] Reports — basic saved queries with field projection; public report URLs
- [ ] Data explorer — basic expanding list view of related records
- [ ] Example: bird observation project using Darwin Core

## Phase 3 — Offline-First PWA
*Goal: works in the field without internet.*

- [ ] `@hyphae/client` — Svelte PWA
- [ ] Service worker + offline caching
- [ ] IndexedDB local storage — **TBD between RxDB and `@hyphae/client-store`** (see ADR-007 and [TECHNOLOGY.md](./TECHNOLOGY.md))
- [ ] Sync engine with conflict detection; patch-based sync; tombstones
- [ ] Advanced sync configuration — app-level and user-level sync filters
- [ ] Custom encrypted indexes (hash, number, geometry)
- [ ] Web Worker for background sync
- [ ] `@hyphae/storage-couchdb` — for native offline sync deployments
- [ ] WebSocket subscriptions
- [ ] Push notification subscriptions
- [ ] Connector layer — `@hyphae/connector-sql` (SQL database importer)

## Phase 4 — Ecosystem
*Goal: more storage backends, more renderers, more term collections.*

- [ ] `@hyphae/storage-postgres`
- [ ] `@hyphae/storage-oxigraph` — SPARQL triple store
- [ ] `@hyphae/renderer-csv`
- [ ] `@hyphae/renderer-dwca` — Darwin Core Archive
- [ ] `@hyphae/collection-schema-org`
- [ ] Search and reporting UI
- [ ] Action modules (`@hyphae/action-*`) — event-driven scripts on record CRUD
- [ ] Encryption at rest (per-collection and per-field; Web Crypto API)
- [ ] Role-based encryption keys
- [ ] Migration tooling / DB importer — AI-assisted playbook for existing datasets
- [ ] Schema inheritance (`extends` on collections)
- [ ] Example: USAR resource/incident tracking

## Phase 5 — Federation & Integration
*Goal: hyphae instances can talk to each other and to external systems.*

- [ ] Cross-instance linking
- [ ] GBIF publishing integration
- [ ] Webhook/event system for integration with external platforms
- [ ] Admin UI for managing modules and configuration
- [ ] Advanced data explorer — graph visualisation view (nodes = records, edges = relationships)
