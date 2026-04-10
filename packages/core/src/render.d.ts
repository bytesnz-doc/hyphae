import type { OntologyTerm } from './ontology.js';
import type { Collection, DataRecord, FieldDefinition, Project } from './model.js';
import type { PageParams } from './query.js';

/**
 * A FieldDefinition with its backing ontology term resolved (if termIri was set)
 * and, for record-level resources, the current field value attached.
 */
export interface ResolvedField extends FieldDefinition {
  term?: OntologyTerm;
  value?: unknown;
}

/** A DataRecord with all field definitions resolved and term metadata attached. */
export interface ResolvedRecord {
  record: DataRecord;
  fields: ResolvedField[];
}

export type ResolvedResourceType =
  | 'projectList'
  | 'project'
  | 'collectionList'
  | 'collection'
  | 'recordList'
  | 'record';

/**
 * The unified resource object passed to Renderer modules.
 * Always contains the project; other fields are present depending on type.
 */
export interface ResolvedResource {
  type: ResolvedResourceType;
  project: Project;
  collection?: Collection;
  resolvedFields?: ResolvedField[];
  record?: ResolvedRecord;
  records?: ResolvedRecord[];
  projects?: Project[];
  collections?: Collection[];
  /** Pagination metadata for list resources. */
  pagination?: {
    total: number;
    page: PageParams;
  };
}

/** Request metadata and project context passed to Renderer modules alongside the resource. */
export interface RenderContext {
  request: {
    url: string;
    method: string;
    headers: Record<string, string | string[]>;
    params: Record<string, string>;
    query: Record<string, string | string[]>;
  };
  project: Project;
  baseUrl: string;
}
