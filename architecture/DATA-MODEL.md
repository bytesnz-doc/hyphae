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
  type: 'string' | 'number' | 'boolean' | 'date' | 'uri' | 'geometry';
  required: boolean;
  multiple: boolean;
  constraints?: Record<string, any>; // Derived from ontology or custom
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

## URL Structure (JSON:API)

```
/projects                                               → list all projects
/projects/:projectSlug                                  → project detail
/projects/:projectSlug/collections                      → list collections in project
/projects/:projectSlug/:collectionSlug                  → collection detail + records
/projects/:projectSlug/:collectionSlug/:recordId        → single record
```

All endpoints respond according to the `Accept` header.

## Ontology Term Resolution

When a collection is assembled, each field's `termIri` is resolved through the ontology registry:
- The IRI is looked up across all loaded ontology modules
- Term metadata (label, description, range, domain, cardinality) is retrieved
- This metadata drives both the simple view (human label) and complex view (full IRI, definition, links)
