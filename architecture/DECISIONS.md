# Architecture Decision Records

A log of significant architectural decisions. Each entry records the context, the decision, and the reasoning. New decisions should be appended.

---

## ADR-001: JavaScript/TypeScript Throughout

**Date:** 2026-04-09
**Status:** Accepted

**Context:** The system has both a server component and a client (PWA) component. The core data model and plugin interfaces need to be usable in both contexts.

**Decision:** Use TypeScript for all packages. Node.js for the server. Svelte for the client. pnpm workspaces as the monorepo tool.

**Reasoning:**
- Maximum code reuse between server and client (especially `@hyphae/core`)
- Single language for contributors lowers the barrier to contribution
- TypeScript provides the interface contracts needed for a plugin system
- Svelte produces small bundles, consistent with the "as small as possible" principle
- pnpm workspaces are well-suited to monorepos with many small packages

---

## ADR-002: Monorepo with Scoped Packages

**Date:** 2026-04-09
**Status:** Accepted

**Context:** The system is explicitly designed to be modular. Users should be able to install only the modules they need.

**Decision:** Structure the codebase as a monorepo under `packages/`, with each module published as a scoped npm package under `@hyphae/*`.

**Reasoning:**
- Enables independent versioning of modules
- Users can `npm install @hyphae/core @hyphae/storage-sqlite @hyphae/collection-dwc` without pulling in everything
- Monorepo tooling (pnpm + Turborepo or similar) keeps development experience cohesive

---

## ADR-003: Content Negotiation via Accept Header

**Date:** 2026-04-09
**Status:** Accepted

**Context:** The same data needs to be accessible to web browsers, API clients, semantic web tools, and export pipelines — all via the same URLs.

**Decision:** Implement HTTP content negotiation. All resource URLs respond to the `Accept` header to select the appropriate renderer.

**Reasoning:**
- Follows REST and Linked Data best practices
- Means the "API" and the "website" are the same thing
- Enables progressive enhancement: a URL is human-browsable and machine-readable simultaneously
- Aligns with how Linked Data principles work (IRIs are dereferenceable)

---

## ADR-004: Offline-First with IndexedDB

**Date:** 2026-04-09
**Status:** Accepted

**Context:** Field workers in conservation and USAR operate in environments without reliable connectivity. Offline capability is a first-class requirement.

**Decision:** The PWA client stores data locally in IndexedDB (via RxDB or Dexie.js — to be decided in Phase 3). A sync engine reconciles local and server state when connectivity is restored.

**Reasoning:**
- IndexedDB is available in all modern browsers, no native app required
- RxDB and Dexie.js are mature, well-maintained libraries
- CouchDB's native sync protocol is a natural fit for `@hyphae/storage-couchdb` deployments
- Conflict detection via record versioning keeps the sync model simple and auditable

---

## ADR-005: SQLite as Default Storage

**Date:** 2026-04-09
**Status:** Accepted

**Context:** The system should be deployable with zero external dependencies for small/personal use cases.

**Decision:** `@hyphae/storage-sqlite` is the default storage adapter, using an embedded SQLite database.

**Reasoning:**
- Zero external services required — just Node.js and a file
- Sufficient for single-user or small team deployments
- Easy to back up (it's just a file)
- Can be swapped for PostgreSQL, CouchDB, or a triple store as needs grow

---

## ADR-006: Ontology Registry as a Collection of Module Collections

**Date:** 2026-04-09
**Status:** Accepted

**Context:** Different ontology standards (OWL, SKOS, JSON Schema, RDFS) have fundamentally different structures and APIs. A single monolithic ontology handler would be brittle and hard to extend.

**Decision:** The ontology registry is itself modular — it is a collection of ontology modules (`@hyphae/ontology-*`), each handling a specific format. On top of these sit term collections (`@hyphae/collection-*`) which are curated vocabularies referencing one or more ontology modules.

**Reasoning:**
- Clean separation between "how to read an ontology format" and "which terms to use"
- New formats can be added without touching existing modules
- Term collections can mix terms from multiple ontology formats (e.g. DWC core + a custom JSON Schema extension)
- Mirrors the hyphae principle: modules are small, composable, and purposeful
