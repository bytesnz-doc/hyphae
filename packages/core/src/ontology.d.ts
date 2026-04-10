/** The data types a field can hold. */
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
 * A term from an ontology — the resolved metadata behind a field definition.
 */
export interface OntologyTerm {
  /** The globally unique IRI for this term. */
  iri: string;
  label: string;
  description?: string;
  type: FieldType;
  required?: boolean;
  multiple?: boolean;
  /** IRIs of classes/properties this term applies to. */
  domain?: string[];
  /** IRIs of expected value types. */
  range?: string[];
  /** ID of the ontology module that loaded this term. */
  sourceModuleId: string;
}

/** How an ontology module can be pointed at a vocabulary. */
export type OntologySource =
  | { type: 'url'; url: string }
  | { type: 'file'; path: string }
  | { type: 'inline'; content: unknown };

/** Reference to an ontology module registered in a project. */
export interface OntologyRef {
  moduleId: string;
  source: OntologySource;
}
