import type { OntologyRef } from './ontology.js';

// ── Access control ────────────────────────────────────────────────────────────

export type Permission = 'create' | 'read' | 'update' | 'delete';
export type PermissionScope = 'own' | 'all' | 'collection' | 'project';

export interface PermissionGrant {
  operation: Permission;
  scope: PermissionScope;
}

export interface RoleDefinition {
  id: string;
  label: string;
  permissions: PermissionGrant[];
}

// ── Field definitions ─────────────────────────────────────────────────────────

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime-partial'
  | 'uri'
  | 'geometry'
  | 'embedded';

/**
 * MongoDB-style function descriptor for a computed field value.
 * e.g. { $concat: ['$firstName', ' ', '$lastName'] }
 */
export type ComputedDescriptor = Record<string, unknown>;

export interface IndexDefinition {
  id: string;
  type: 'hash' | 'number' | 'geometry';
  keyPaths: string[];
}

export interface FieldDefinition {
  id: string;
  /** IRI of the backing ontology term, if any. */
  termIri?: string;
  label: string;
  description?: string;
  type: FieldType;
  required: boolean;
  multiple: boolean;
  /** Validation constraints derived from the ontology or set manually. */
  constraints?: Record<string, unknown>;
  /** If present, field value is derived — not entered by the user. */
  'x-computed'?: ComputedDescriptor;
}

// ── Collection ────────────────────────────────────────────────────────────────

/** Reference to a term collection module registered in a project. */
export interface CollectionRef {
  moduleId: string;
  config?: Record<string, unknown>;
}

/**
 * Collection-level UI and storage hints.
 * Stored alongside the collection definition; exposed via the schema endpoint.
 */
export interface CollectionXProperties {
  /** Field path(s) to use as the record title in list views. */
  'x-item-title'?: string | string[];
  /** JSONPath to the record ID field (default: 'id'). */
  'x-item-id'?: string;
  /** Ordered field IDs to show in table/list views. */
  'x-table-fields'?: string[];
  /** Default pagination page size. */
  'x-default-page-size'?: number;
  /** Client-side index definitions (used by offline store). */
  'x-indexes'?: IndexDefinition[];
}

export interface Collection extends CollectionXProperties {
  id: string;
  projectId: string;
  slug: string;
  label: string;
  description?: string;
  fields: FieldDefinition[];
  /** IDs of parent collections whose fields are inherited. */
  extends?: string[];
  /** Schema version number. Incremented on breaking field changes. */
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ── Project ───────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  /** URL-safe identifier, used as the first path segment. */
  slug: string;
  label: string;
  description?: string;
  ontologies: OntologyRef[];
  collections: CollectionRef[];
  /** ID of the registered StorageAdapter to use for this project. */
  storageAdapter: string;
  storageConfig: Record<string, unknown>;
  /** IDs of registered Renderer modules enabled for this project. */
  renderers: string[];
  access?: {
    /** Allow unauthenticated access. 'readonly' permits GET only. */
    public?: boolean | 'readonly';
    roles?: RoleDefinition[];
  };
  createdAt: string;
  updatedAt: string;
}

// ── Record ────────────────────────────────────────────────────────────────────

/** A single data entry within a collection. Renamed to avoid clash with global Record<K,V>. */
export interface DataRecord {
  id: string;
  collectionId: string;
  projectId: string;
  /** Field values keyed by FieldDefinition.id. */
  data: Record<string, unknown>;
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    /** Monotonically increasing version; used for conflict detection. */
    version: number;
  };
}
