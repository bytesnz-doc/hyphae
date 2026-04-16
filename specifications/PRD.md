# hyphae — Product Requirements Document

## Problem Statement

Ontology standards like Darwin Core, Schema.org, and domain-specific vocabularies
exist to make data interoperable and semantically meaningful across systems.
However, they are designed for knowledge engineers and data scientists — not for
the people who most need to collect and use that data.

A conservation field officer at the Department of Conservation NZ should not need
to understand what an IRI is to record a kiwi sighting. An urban search and rescue
(USAR) team leader should not need to know RDF to log a resource deployment.

**hyphae** is built on the premise that the complexity of ontologies should be
invisible by default and discoverable by choice. It bridges the gap between
powerful semantic data standards and the people who most need them.

---

## Actors

| Actor | Description |
|-------|-------------|
| **Field User** | The primary end user — a field officer, researcher, or practitioner who creates and looks up records. Does not need any ontology knowledge. |
| **Power User** | A user who actively wants to see and use ontological metadata — IRIs, definitions, term sources. Enabled via the complex view toggle. |
| **Developer / Integrator** | Builds on hyphae — writes ontology modules, storage adapters, or renderers; consumes the JSON:API; integrates with external systems. |
| **Project Owner** | A user who has created a project. Automatically holds full structural control of that project — creates and manages collection definitions, configures project access, and assigns roles to users and groups. Can delegate record-editing rights to users or groups without granting collection management rights. |
| **Server Admin** | Manages the hyphae deployment — configures available authentication methods, ontologies, storage adapters, renderers, and server-level roles. Automatically holds owner rights on any project. |

---

## Success Criteria

1. A field officer can create and retrieve records via a web browser without
   knowing what an IRI is.
2. A developer can define a custom collection using only a JSON Schema and have
   it served with full CRUD and content-negotiated output in under an hour.
3. The same URL serves HTML to a browser, JSON to an API client, and JSON-LD to
   a semantic web tool — distinguished solely by the `Accept` header.
4. The server deploys with zero external services: one Node.js process, one
   SQLite file.
5. All data is accessible and exportable through open, standard formats at any
   time — the user is never locked in.
6. A project owner can share record-editing access with a group of users without
   granting them the ability to modify collection definitions.

---

## Scope

### In Scope — Phase 1 (Minimal Viable Hypha)

- Core TypeScript module interfaces (`@hyphae/core` types and runtime logic)
- JSON Schema ontology module (`@hyphae/ontology-jsonschema`)
- SQLite storage adapter (`@hyphae/storage-sqlite`)
- In-memory storage adapter for testing (`@hyphae/storage-memory`)
- Server-rendered HTML renderer (`@hyphae/renderer-html`)
- JSON and JSON:API renderers (`@hyphae/renderer-json`)
- Fastify HTTP server with content negotiation (`@hyphae/server`)
- Project, Collection, and Record CRUD
- Filtering, sorting, and pagination (`filter[path][$op]=value` syntax)
- Schema endpoint (`Accept: application/schema+json`)
- Local auth (bcrypt + JWT) and RBAC (`@hyphae/access-control`)
- OAuth 2.0 / OIDC external provider authentication; server admin configures which auth methods are enabled
- Group management — users can be members of named groups; roles can be assigned to groups as well as individual users; a user's effective permissions are the union of all directly assigned and group-inherited roles
- Project ownership — the user who creates a project is automatically assigned the owner role; collection-management permissions (create/edit/delete collection definitions) are a distinct permission tier from record-editing permissions; owners can delegate collection management to specific users or groups independently
- A runnable end-to-end example project

### Out of Scope — Deferred to Later Phases

- PWA client, service worker, IndexedDB, and offline sync (Phase 3)
- OWL, SKOS, RDFS ontology modules (Phase 2)
- Darwin Core, Schema.org, Dublin Core term collections (Phase 2)
- JSON-LD, Turtle, RDF/XML, CSV, and Darwin Core Archive renderers (Phase 2+)
- Simple / complex view toggle in the frontend (Phase 2)
- WebSocket and push notification subscriptions (Phase 3)
- Data explorer and reports (Phase 2+)
- Encryption at rest and record signing (`@hyphae/security`, Phase 4)
- Connector modules for external data sources (Phase 3+)
- Cross-instance federation and GBIF publishing (Phase 5)
- Admin UI (Phase 5)

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Language / stack** | Javascript+JSDoc (strict, ESM), Node.js | Maximum code reuse between server and client; single language for contributors; TypeScript contracts required for the plugin system |
| **Monorepo** | pnpm workspaces + Turborepo | Each module published independently under `@hyphae/*`; incremental builds |
| **Server framework** | Fastify | Plugin/decorator architecture mirrors hyphae's own module system; TypeScript-first; fast |
| **Client framework** | Svelte 5 + Vite (Phase 3+) | Small compiled bundle; no virtual DOM; offline-capable |
| **Auth approach** | Local auth (bcrypt + JWT) for small/offline deployments; OAuth 2.0 / OIDC for external providers; open access configurable per project | Flexible enough for air-gapped field deployments and multi-tenant cloud deployments |
| **Default persistence** | SQLite via `better-sqlite3` | Zero external services; single file; easy backup; swappable via the `StorageAdapter` interface |
| **RDF libraries** | N3.js (Turtle/N-Triples/TriG/N3 parse + serialise), jsonld.js (JSON-LD processing), @rdfjs/types (shared interfaces) | Well-maintained FOSS; standards-compliant; covers all text-based RDF formats |
| **Maps** | Leaflet | Lightweight; FOSS; no API key required; OpenStreetMap tiles |
| **Testing** | Node.js built-in test runner (`node:test`) for unit and integration; Playwright for E2E (Phase 3+) | Zero extra dependencies for test running; aligns with "as small as possible" principle |
| **Linting / formatting** | ESLint + Prettier (shared config in `@hyphae/config`) | Consistency across all packages |
| **Versioning** | Changesets | Coordinated multi-package releases |
| **Libraries to avoid** | Dexie.js (increasingly coupled to Dexie Cloud commercial service); any framework that cannot be used server-side and client-side | FOSS principle; no commercial lock-in |
