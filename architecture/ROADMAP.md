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
- [ ] Example: a simple custom collection with JSON Schema

## Phase 2 — Semantic Web
*Goal: real ontology support and Darwin Core.*

- [ ] `@hyphae/ontology-owl` — OWL/RDF ontology module
- [ ] `@hyphae/ontology-skos` — SKOS module
- [ ] `@hyphae/collection-dwc` — Darwin Core term collection
- [ ] `@hyphae/renderer-jsonld` — JSON-LD output
- [ ] `@hyphae/renderer-turtle` — Turtle output
- [ ] Simple/complex view toggle in the frontend
- [ ] Example: bird observation project using Darwin Core

## Phase 3 — Offline-First PWA
*Goal: works in the field without internet.*

- [ ] `@hyphae/client` — Svelte PWA
- [ ] Service worker + offline caching
- [ ] IndexedDB local storage (RxDB or Dexie.js)
- [ ] Sync engine with conflict detection
- [ ] `@hyphae/storage-couchdb` — for native offline sync deployments

## Phase 4 — Ecosystem
*Goal: more storage backends, more renderers, more term collections.*

- [ ] `@hyphae/storage-postgres`
- [ ] `@hyphae/storage-oxigraph` — SPARQL triple store
- [ ] `@hyphae/renderer-csv`
- [ ] `@hyphae/renderer-dwca` — Darwin Core Archive
- [ ] `@hyphae/collection-schema-org`
- [ ] Search and reporting UI
- [ ] Example: USAR resource/incident tracking

## Phase 5 — Federation & Integration
*Goal: hyphae instances can talk to each other and to external systems.*

- [ ] Cross-instance linking
- [ ] GBIF publishing integration
- [ ] Webhook/event system for integration with external platforms
- [ ] Admin UI for managing modules and configuration
