# Core Data Model

## Entities

### Project
The top-level unit. A project defines:
- Which ontologies and term collections are in use
- Which storage adapter to use
- Which renderers are enabled
- Access control settings
- Display configuration (labels, descriptions, UI hints)

```typescript
interface Project {
  id: string;
  slug: string;                      // URL-safe identifier
  label: string;                     // Human-readable name
  description?: string;
  ontologies: OntologyRef[];         // Loaded ontology modules
  collections: CollectionRef[];      // Term collections in scope
  storageAdapter: string;            // Module ID
  storageConfig: Record<string, any>;
  renderers: string[];               // Enabled renderer module IDs
  createdAt: string;                 // ISO 8601
  updatedAt: string;
}
```

### Collection (within a Project)
A named set of records within a project, analogous to a table, dataset, or layer. Maps to a set of ontology terms that define its fields.

```typescript
interface Collection {
  id: string;
  projectId: string;
  slug: string;
  label: string;
  description?: string;
  fields: FieldDefinition[];         // Resolved from ontology terms
  createdAt: string;
  updatedAt: string;
}

interface FieldDefinition {
  id: string;
  termIri?: string;                  // IRI of the backing ontology term (if any)
  label: string;                     // Human-readable label (simple view)
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime-partial' | 'uri' | 'geometry' | 'embedded';
  required: boolean;
  multiple: boolean;
  constraints?: Record<string, any>; // Derived from ontology or custom
  'x-computed'?: ComputedDescriptor; // If present, value is derived (not user-entered)
}
```

### Record
A single data entry within a collection.

```typescript
interface Record {
  id: string;
  collectionId: string;
  projectId: string;
  data: Record<string, any>;         // Field values keyed by FieldDefinition.id
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    version: number;
  };
}
```

## URL Structure

See [API.md](./API.md) for the full URL structure.

## Field Types

| Type | Description |
|---|---|
| `string` | Plain text |
| `number` | Integer or float |
| `boolean` | True/false |
| `date` | Full ISO 8601 date (`YYYY-MM-DD`) |
| `datetime-partial` | Partial/floating-precision ISO 8601 datetime — may be just a year (`2024`), year+month (`2024-06`), or a full timestamp. Displayed locale-appropriately. |
| `uri` | IRI/URL reference |
| `geometry` | GeoJSON geometry |
| `embedded` | Nested sub-object; structure defined by a referenced collection or inline schema |

## Schema x-properties

Collection-level metadata that controls storage and UI behaviour. These are stored alongside the collection definition and are accessible via the schema endpoint.

| Property | Description |
|---|---|
| `x-item-title` | Field path (or array of paths) to use as the record title in list views |
| `x-item-id` | JSONPath to the record's ID field (defaults to `id`) |
| `x-table-fields` | Ordered list of field IDs to display in table/list views |
| `x-default-page-size` | Default pagination page size for this collection |
| `x-indexes` | Index definitions for the client store (see [OFFLINE.md](./OFFLINE.md)) |

`x-computed` on a `FieldDefinition` marks the field as derived. Its value is computed by the server (or client-side action) using a function descriptor rather than being entered by the user directly.

## Schema Inheritance

A collection can extend one or more other collections:

```typescript
interface Collection {
  // ...
  extends?: string[];  // IDs of parent collections; fields are inherited in order
}
```

The collection inherits all fields from its parents. Custom fields are added on top of the inherited set. Field IDs must be unique across the merged set; a child field with the same ID as a parent field overrides it.

The `x-was` property on a field can record the original field ID if a field was renamed during migration, preserving provenance.

## Schema Versioning

Collections carry a version number. The schema at a specific version is accessible via the `?v=N` query parameter on the schema endpoint. This enables gradual migrations: old clients can continue using `?v=1` while new clients use `?v=2`.

## Ontology Term Resolution

When a collection is assembled, each field's `termIri` is resolved through the ontology registry:
- The IRI is looked up across all loaded ontology modules
- Term metadata (label, description, range, domain, cardinality) is retrieved
- This metadata drives both the simple view (human label) and complex view (full IRI, definition, links)
