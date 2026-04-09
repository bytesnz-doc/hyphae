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

### 3. Storage Adapters (`@hyphae/storage-*`)

Implement the storage interface for a specific backend. Adapters translate hyphae's internal query model to the native query language of the backend.

| Package | Backend |
|---|---|
| `@hyphae/storage-sqlite` | SQLite (default, embedded, great for small deployments) |
| `@hyphae/storage-postgres` | PostgreSQL |
| `@hyphae/storage-couchdb` | CouchDB (excellent for offline sync) |
| `@hyphae/storage-oxigraph` | Oxigraph (RDF triple store, SPARQL) |
| `@hyphae/storage-graphdb` | GraphDB or other SPARQL endpoints |
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
  type: 'ontology' | 'collection' | 'storage' | 'renderer';
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
}

// Renderers
interface Renderer extends HyphaeModule {
  type: 'renderer';
  mimeTypes: string[];
  render(resource: ResolvedResource, context: RenderContext): Promise<string | Buffer>;
}
```
