# Technology Architecture

This document maps the full technology stack — specific frameworks, libraries, and tooling — for each layer of hyphae. For _why_ these layers exist, see [OVERVIEW.md](./OVERVIEW.md). For the reasoning behind the major decisions, see [DECISIONS.md](./DECISIONS.md).

---

## Summary Table

| Layer | Technology | Notes |
|---|---|---|
| Language | TypeScript (strict, ESM) | All packages |
| Monorepo | pnpm workspaces + Turborepo | Build orchestration |
| Server framework | Fastify | Plugin-based, TypeScript-first |
| Client framework | Svelte 5 + Vite | Small bundle, offline-capable |
| Offline storage | TBD: RxDB or `@hyphae/client-store` (Phase 3) | See ADR-007 |
| RDF parsing | N3.js | Turtle, N-Triples, TriG, N3 |
| JSON-LD | jsonld.js | JSON-LD processing algorithm |
| RDF types | @rdfjs/types | Shared RDF.js spec interfaces |
| Default storage | better-sqlite3 | Embedded, zero-dependency |
| Maps | Leaflet | Lightweight, FOSS |
| Unit/integration tests | Node.js built-in test runner | Zero dependencies |
| UI / E2E tests | Playwright | Browser automation |
| Linting | ESLint + Prettier | Shared configs in `@hyphae/config` |
| Versioning | Changesets | Coordinated multi-package releases |

---

## Monorepo Tooling

### pnpm Workspaces

All packages live under `packages/`. The workspace root defines shared dev
dependencies and scripts.

```
pnpm-workspace.yaml  — lists packages/*
package.json         — root scripts and shared dev deps
turbo.json           — Turborepo pipeline definition
```

### Turborepo

Turborepo orchestrates builds, tests, and type-checking across packages, with
dependency-aware incremental execution. Only packages affected by a change are
rebuilt or retested.

Key pipeline tasks:

```json
{
  "pipeline": {
    "build":      { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck":  { "dependsOn": ["^build"] },
    "test":       { "dependsOn": ["^build"] },
    "lint":       {}
  }
}
```

### Shared Configuration

A `@hyphae/config` package (not published) provides shared configuration:
- `tsconfig.base.json` — extended by every package
- `.eslintrc.base.js` — shared ESLint rules
- `vitest.config.base.ts` — shared Vitest config

---

## TypeScript

- **Strict mode** throughout (`"strict": true`)
- **ESM only** — all packages use `"type": "module"` and `import`/`export`
- **TypeScript 5.x**
- Each package exports a `types` field in `package.json` pointing to generated `.d.ts` files
- Shared type definitions for the module plugin interfaces live in `@hyphae/core`

---

## Server (`@hyphae/server`)

### Framework: Fastify

[Fastify](https://fastify.dev/) is the HTTP framework for the hyphae server. It
was chosen because its plugin/decorator architecture mirrors hyphae's own module
system — storage adapters, renderers, and ontology registries are all registered
as Fastify plugins.

Key Fastify features in use:

| Feature | Use |
|---|---|
| Plugin system | Registers storage adapters, renderers, ontology registry |
| Content type parser | Parses incoming `Content-Type` (JSON, JSON-LD, Turtle, etc.) |
| Schema validation | JSON Schema validation on incoming request bodies |
| Hooks | Pre-handler hooks for authentication, content negotiation |
| `@fastify/static` | Serves the built client PWA |

### Content Negotiation

A Fastify `onRequest` hook inspects the `Accept` header and selects the
appropriate renderer. Renderer modules register their MIME types on startup;
the hook resolves the best match using standard `q`-value priority.

### JSON:API

The server follows [JSON:API 1.1](https://jsonapi.org/) for collection and
record endpoints. See [API.md](./API.md) for the full URL structure and content
negotiation design.

All routes respond to content negotiation — the same URL returns HTML, JSON,
JSON-LD, Turtle, etc. depending on `Accept`.

---

## RDF and Ontology Libraries

### N3.js

[N3.js](https://github.com/rdfjs/N3.js) is used for parsing and serialising RDF
in all text-based formats:

| Format | Support |
|---|---|
| Turtle | Parse + Serialise |
| N-Triples | Parse + Serialise |
| N-Quads | Parse + Serialise |
| TriG | Parse + Serialise |
| N3 (superset of Turtle) | Parse + Serialise |

N3.js is the default implementation inside `@hyphae/ontology-owl`,
`@hyphae/ontology-rdfs`, `@hyphae/ontology-skos`, and the
`@hyphae/renderer-turtle` renderer.

### jsonld.js

[jsonld.js](https://github.com/digitalbazaar/jsonld.js) implements the
[JSON-LD 1.1 Processing Algorithms](https://www.w3.org/TR/json-ld11-api/). It
is used in:

- `@hyphae/renderer-jsonld` — serialising records as JSON-LD
- `@hyphae/ontology-owl` — loading OWL ontologies expressed as JSON-LD
- `@hyphae/core` — building `@context` objects from registered term collections

### @rdfjs/types

[@rdfjs/types](https://github.com/rdfjs/types) provides the TypeScript
interfaces for the [RDF.js specification](https://rdf.js.org/) — `Term`,
`NamedNode`, `BlankNode`, `Literal`, `Quad`, `DataFactory`, etc.

All hyphae ontology modules and storage adapters that deal with RDF use these
interfaces, keeping the RDF layer interoperable and swappable.

---

## Storage Layer

### Default: better-sqlite3

[better-sqlite3](https://github.com/WiseLibs/better-sqlite3) provides the
SQLite storage adapter (`@hyphae/storage-sqlite`). It uses a synchronous API
(unusual for Node.js, but appropriate for SQLite) which simplifies the adapter
code considerably.

### Storage Adapter Interface

All adapters implement the `StorageAdapter` interface from `@hyphae/core`.
Specific adapters bring their own dependencies:

| Package | Key Dependency |
|---|---|
| `@hyphae/storage-sqlite` | `better-sqlite3` |
| `@hyphae/storage-postgres` | `pg` (node-postgres) |
| `@hyphae/storage-couchdb` | `nano` |
| `@hyphae/storage-oxigraph` | `oxigraph` (WASM build) |
| `@hyphae/storage-arangodb` | `arangojs` (graph + document + key-value; used by on-location) |
| `@hyphae/storage-memory` | none |

---

## Client (`@hyphae/client`)

### Framework: Svelte 5 + Vite

The frontend PWA is built with [Svelte 5](https://svelte.dev/) and bundled by
[Vite](https://vitejs.dev/). Svelte compiles to minimal vanilla JS — no virtual
DOM, no runtime framework overhead — which aligns with the "as small as
possible" principle.

SvelteKit is **not** used. The client is a pure SPA (single-page app) that
communicates with the `@hyphae/server` API. This keeps the client/server
boundary clean and lets the server be deployed independently.

### Offline: TBD (Dexie.js / RxDB / `@hyphae/client-store`)

The offline store library decision is **deferred to Phase 3**. See ADR-007 in [DECISIONS.md](./DECISIONS.md).

The two leading options are:

- **RxDB** — mature, reactive, good offline support; reactivity features overlap somewhat with Svelte's own reactivity model
- **`@hyphae/client-store`** — a custom lightweight IndexedDB store inspired by the [skemer-store](https://github.com/skemer-store) design; would provide full control over custom encrypted indexes, configurable per-collection sync, and patch-based sync without coupling to a commercial cloud service

The original selection of Dexie.js is revisited because Dexie.js is increasingly coupled to **Dexie Cloud** (a commercial sync service), which conflicts with hyphae's offline-first and FOSS principles.

Regardless of which library is chosen, the public interface exposed to the rest of `@hyphae/client` should match the skemer-store client API shape: `fetch`, `fetchSchema`, `subscribe`.

### Service Worker

The service worker is generated by [Vite PWA plugin](https://vite-pwa-org.netlify.app/)
(`vite-plugin-pwa`, using Workbox under the hood). It:

- Pre-caches the application shell and static assets at install time
- Uses a network-first strategy for API requests with IndexedDB fallback
- Registers a Background Sync tag for queued mutations

### Maps: Leaflet

[Leaflet](https://leafletjs.com/) handles map display and geographic field
inputs (location pickers). It is loaded lazily — only included in bundles when
a collection uses geographic terms (e.g. `dwc:decimalLatitude`).

Default tile layer is [OpenStreetMap](https://www.openstreetmap.org/) — no API
key required, consistent with the FOSS principle.

### Design System

A minimal utility-first CSS approach using a small, curated subset of
[Open Props](https://open-props.style/) CSS custom properties. No full CSS
framework is bundled — component styles are scoped within Svelte files.

---

## Testing

### Unit and Integration Tests: Node.js Built-in Test Runner

hyphae uses the [Node.js built-in test runner](https://nodejs.org/api/test.html)
(`node:test`) for all unit and integration tests. It requires no additional
dependencies, is TypeScript-compatible via `--import tsx` (or `--experimental-strip-types`
in Node 22+), and aligns with the "as small as possible" principle.

Test conventions:

- Unit tests live alongside source files as `*.test.ts`
- Integration tests (e.g. storage adapters against a real database) live in
  `tests/integration/` within the package
- The `@hyphae/storage-memory` adapter is used to test anything above the
  storage layer without a real backend
- Tests are run via `node --test` and orchestrated across packages by Turborepo

Coverage is collected with Node's built-in `--experimental-test-coverage` flag
(V8 provider).

### UI / End-to-End Tests: Playwright

[Playwright](https://playwright.dev/) handles browser-level UI and end-to-end
tests for `@hyphae/client`. Tests live in `packages/client/tests/e2e/`.

Key uses:

- Testing the simple/complex view toggle
- Offline behaviour (using Playwright's network interception)
- Form submission and validation flows
- PWA install and service worker behaviour

---

## Linting and Formatting

- **ESLint** with `@typescript-eslint` for TypeScript linting
- **Prettier** for code formatting (enforced in CI)
- Both are configured in `@hyphae/config` and extended per-package

---

## Versioning and Publishing

[Changesets](https://github.com/changesets/changesets) manages versioning
across the monorepo. Contributors add a changeset file (`.changeset/*.md`) with
their PR describing the change and the semver impact. On release:

1. Changesets bumps affected package versions
2. Updates `CHANGELOG.md` files per package
3. Publishes changed packages to npm under the `@hyphae` scope

---

## Runtime Requirements

| Context | Minimum requirement |
|---|---|
| Server (hosted) | Node.js 20 LTS or later |
| Server (local/offline) | Node.js 20 LTS or later |
| Client (browser) | Modern evergreen browser (Chrome 90+, Firefox 90+, Safari 15+) |
| Client (mobile) | iOS 15+, Android 9+ |

Node.js 20+ is required for stable ESM support and the native `fetch` API
(used by `@hyphae/server` and `@hyphae/core`).
