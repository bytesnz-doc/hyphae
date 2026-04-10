# Module Taxonomy

Every capability in hyphae is a module — a hypha. Modules implement interfaces defined in `@hyphae/core` and are registered at startup.

## Module Types

### 1. Ontology Modules (`@hyphae/ontology-*`)

Understand a specific ontology *format* or *encoding*. Given a source (URL, file, or registry entry), an ontology module can:
- Parse and load term definitions
- Resolve a term IRI to its metadata (label, description, range, domain, cardinality)
- List all terms in the ontology
- Describe relationships between terms

| Package | Format |
|---|---|
| `@hyphae/ontology-owl` | OWL (Web Ontology Language) via RDF |
| `@hyphae/ontology-skos` | SKOS (Simple Knowledge Organization System) |
| `@hyphae/ontology-jsonschema` | JSON Schema (bridges to skemer heritage) |
| `@hyphae/ontology-rdfs` | RDFS (RDF Schema) |

### 2. Term Collections (`@hyphae/collection-*`)

Curated, pre-packaged sets of ontology terms from a specific standard. Collections reference one or more ontology modules and expose a ready-to-use vocabulary.

| Package | Standard |
|---|---|
| `@hyphae/collection-dwc` | Darwin Core (biodiversity) |
| `@hyphae/collection-schema-org` | Schema.org |
| `@hyphae/collection-dc` | Dublin Core |
| `@hyphae/collection-wgs84` | WGS84 Geo Positioning |

Each collection exposes a version number. The collection schema at a specific version is accessible via `?v=N` (see [API.md](./API.md)).

### 3. Storage Adapters (`@hyphae/storage-*`)

Implement the storage interface for a specific backend. Adapters translate hyphae's internal query model to the native query language of the backend.

| Package | Backend |
|---|---|
| `@hyphae/storage-sqlite` | SQLite (default, embedded, great for small deployments) |
| `@hyphae/storage-postgres` | PostgreSQL |
| `@hyphae/storage-couchdb` | CouchDB (excellent for offline sync) |
| `@hyphae/storage-oxigraph` | Oxigraph (RDF triple store, SPARQL) |
| `@hyphae/storage-graphdb` | GraphDB or other SPARQL endpoints |
| `@hyphae/storage-arangodb` | ArangoDB (graph + document + key-value) |
| `@hyphae/storage-memory` | In-memory (testing, ephemeral use) |

### 4. Renderers (`@hyphae/renderer-*`)

Serialise a resolved resource to a specific output format. Selected via HTTP `Accept` header or explicit configuration.

| Package | Format | MIME Type |
|---|---|---|
| `@hyphae/renderer-html` | HTML (server-rendered) | `text/html` |
| `@hyphae/renderer-json` | Plain JSON | `application/json` |
| `@hyphae/renderer-jsonapi` | JSON:API | `application/vnd.api+json` |
| `@hyphae/renderer-jsonld` | JSON-LD | `application/ld+json` |
| `@hyphae/renderer-turtle` | RDF Turtle | `text/turtle` |
| `@hyphae/renderer-rdfxml` | RDF/XML | `application/rdf+xml` |
| `@hyphae/renderer-csv` | CSV | `text/csv` |
| `@hyphae/renderer-dwca` | Darwin Core Archive | `application/zip` |

## Plugin Interface (sketch)

All modules implement a common base interface plus type-specific methods. Defined in `@hyphae/core`.

```typescript
// All modules
interface HyphaeModule {
  id: string;
  version: string;
  type: 'ontology' | 'collection' | 'storage' | 'renderer' | 'connector' | 'action';
}

// Ontology modules
interface OntologyModule extends HyphaeModule {
  type: 'ontology';
  load(source: OntologySource): Promise<void>;
  getTerm(iri: string): Promise<OntologyTerm | null>;
  listTerms(): Promise<OntologyTerm[]>;
}

// Storage adapters
interface StorageAdapter extends HyphaeModule {
  type: 'storage';
  connect(config: StorageConfig): Promise<void>;
  disconnect(): Promise<void>;
  getRecord(id: string, collectionId: string): Promise<Record | null>;
  queryRecords(query: Query, collectionId: string): Promise<Record[]>;
  saveRecord(record: Record, collectionId: string): Promise<Record>;
  deleteRecord(id: string, collectionId: string): Promise<void>;
  // Adapters that support transactions wrap multi-record patches in a single
  // atomic operation. Adapters that do not support transactions apply changes
  // sequentially and return a partial-success error if one fails.
  transaction?<T>(fn: () => Promise<T>): Promise<T>;
}

// Renderers
interface Renderer extends HyphaeModule {
  type: 'renderer';
  mimeTypes: string[];
  render(resource: ResolvedResource, context: RenderContext): Promise<string | Buffer>;
}

// Connectors
interface ConnectorModule extends HyphaeModule {
  type: 'connector';
  connect(config: ConnectorConfig): Promise<void>;
  introspect(): Promise<CollectionSchema[]>; // Proposed collection schemas derived from the external source
  sync(collections: CollectionSchema[]): Promise<void>; // Reads external data into hyphae storage
}

// Actions
interface ActionModule extends HyphaeModule {
  type: 'action';
  on: ('create' | 'update' | 'delete')[];
  run(event: RecordEvent): Promise<void>;
}
```

## 5. Connector Modules (`@hyphae/connector-*`)

Connectors map external, non-ontologised data sources into hyphae's data model. They are an optional layer that sits between an external database and the hyphae server.

| Package | Source |
|---|---|
| `@hyphae/connector-sql` | SQL databases — introspects tables/columns and maps them to hyphae collections/fields |
| `@hyphae/connector-csv` | CSV files — maps columns to fields |
| `@hyphae/connector-airtable` | Airtable bases |

A connector operates in two modes: **introspect** (proposes a collection schema from the external source structure) and **sync** (reads external data into hyphae storage). The introspect output is a starting point — the operator can review and adjust the proposed schema before committing it.

## 6. Action Modules (`@hyphae/action-*`)

Action modules attach behaviour to record CRUD events. An action declares which events it handles and exports a `run` function.

Actions can be configured to run:
- **On the server** — always available regardless of client state
- **In the browser** — runs on the client when online; queued for replay when offline (via Background Sync)

Example uses: sending a webhook on record creation, computing a derived value after an update, triggering a push notification.

```typescript
// Example action
export default {
  id: 'notify-on-create',
  version: '1.0.0',
  type: 'action',
  on: ['create'],
  async run(event: RecordEvent) {
    await fetch('/webhooks/my-endpoint', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },
} satisfies ActionModule;
```
