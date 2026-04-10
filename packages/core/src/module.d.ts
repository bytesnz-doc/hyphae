import type { OntologySource, OntologyTerm } from './ontology.js';
import type { Collection, DataRecord, FieldDefinition, Project } from './model.js';
import type { Query, QueryResult } from './query.js';
import type { ResolvedResource, RenderContext } from './render.js';

// ── Base ──────────────────────────────────────────────────────────────────────

export interface HyphaeModule {
  id: string;
  version: string;
  type: 'ontology' | 'collection' | 'storage' | 'renderer' | 'connector' | 'action';
}

// ── Ontology module ───────────────────────────────────────────────────────────

/** Understands a specific ontology format (OWL, SKOS, JSON Schema, RDFS…). */
export interface OntologyModule extends HyphaeModule {
  type: 'ontology';
  load(source: OntologySource): Promise<void>;
  getTerm(iri: string): Promise<OntologyTerm | null>;
  listTerms(): Promise<OntologyTerm[]>;
}

// ── Term collection module ────────────────────────────────────────────────────

/** A curated, pre-packaged vocabulary (Darwin Core, Dublin Core, Schema.org…). */
export interface TermCollectionModule extends HyphaeModule {
  type: 'collection';
  load(): Promise<void>;
  getTerm(iri: string): OntologyTerm | undefined;
  listTerms(): OntologyTerm[];
}

// ── Storage adapter ───────────────────────────────────────────────────────────

export type StorageConfig = Record<string, unknown>;

export interface StorageAdapter extends HyphaeModule {
  type: 'storage';
  connect(config: StorageConfig): Promise<void>;
  disconnect(): Promise<void>;

  // Projects
  getProject(id: string): Promise<Project | null>;
  listProjects(): Promise<Project[]>;
  saveProject(project: Project): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Collections
  getCollection(id: string, projectId: string): Promise<Collection | null>;
  listCollections(projectId: string): Promise<Collection[]>;
  saveCollection(collection: Collection): Promise<Collection>;
  deleteCollection(id: string, projectId: string): Promise<void>;

  // Records
  getRecord(id: string, collectionId: string, projectId: string): Promise<DataRecord | null>;
  queryRecords(query: Query, collectionId: string, projectId: string): Promise<QueryResult<DataRecord>>;
  saveRecord(record: DataRecord): Promise<DataRecord>;
  deleteRecord(id: string, collectionId: string, projectId: string): Promise<void>;

  /**
   * Wrap multiple operations in an atomic transaction.
   * Adapters that don't support transactions apply changes sequentially
   * and return a partial-success error if one fails.
   */
  transaction?<T>(fn: () => Promise<T>): Promise<T>;
}

// ── Renderer ──────────────────────────────────────────────────────────────────

export interface Renderer extends HyphaeModule {
  type: 'renderer';
  /** MIME types this renderer handles, in preference order. */
  mimeTypes: string[];
  render(resource: ResolvedResource, context: RenderContext): Promise<string | Uint8Array>;
}

// ── Connector module ──────────────────────────────────────────────────────────

export interface SyncResult {
  created: number;
  updated: number;
  deleted: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Maps an external non-ontologised data source into hyphae's data model.
 * connect → introspect (proposed schemas) → sync (import data).
 */
export interface ConnectorModule extends HyphaeModule {
  type: 'connector';
  connect(config: StorageConfig): Promise<void>;
  disconnect(): Promise<void>;
  /** Inspect the external source and return proposed Collection schemas. */
  introspect(): Promise<Collection[]>;
  /** Pull data from the external source into the given storage adapter. */
  sync(target: StorageAdapter, projectId: string): Promise<SyncResult>;
}

// ── Action module ─────────────────────────────────────────────────────────────

export interface RecordEvent {
  type: 'create' | 'update' | 'delete';
  record: DataRecord;
  /** Set on update events. */
  previousRecord?: DataRecord;
  collection: Collection;
  project: Project;
  userId?: string;
  /** True when event was triggered during an offline sync replay. */
  isReplay: boolean;
}

/**
 * A script triggered by record CRUD events.
 * Can run on the server or in the browser (when the action target is 'client').
 */
export interface ActionModule extends HyphaeModule {
  type: 'action';
  /** Which record events trigger this action. */
  on: ('create' | 'update' | 'delete')[];
  /** Where the action runs. 'client' actions are queued when offline. */
  target: 'server' | 'client' | 'both';
  run(event: RecordEvent): Promise<void>;
}

// ── Field definition helper types ─────────────────────────────────────────────

/** Re-exported for convenience when defining field constraints. */
export type { FieldDefinition, FieldType } from './model.js';
