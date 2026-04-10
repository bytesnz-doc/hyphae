// @ts-check
/** @import { OntologyModule, OntologySource, OntologyTerm, FieldType } from '@hyphae/core' */

// ── Type mapping ──────────────────────────────────────────────────────────────

/**
 * @param {string | string[] | undefined} type
 * @param {string | undefined} format
 * @returns {FieldType}
 */
function jsonSchemaTypeToFieldType(type, format) {
  const t = Array.isArray(type) ? (type.find((x) => x !== 'null') ?? 'string') : (type ?? 'string');
  if (t === 'number' || t === 'integer') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'object') return 'embedded';
  if (t === 'string') {
    if (format === 'date') return 'date';
    if (format === 'date-time') return 'datetime-partial';
    if (format === 'uri' || format === 'iri') return 'uri';
  }
  return 'string';
}

// ── Minimal JSON Schema types ─────────────────────────────────────────────────

/**
 * @typedef {Object} JsonSchemaProperty
 * @property {string | string[]} [type]
 * @property {string} [format]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [x-iri] Explicit IRI to use as the term identifier.
 * @property {string[]} [x-domain] OWL domain: IRIs of classes this property applies to.
 * @property {string[]} [x-range] OWL range: IRIs of expected value types.
 * @property {boolean} [required] Mark as required (alternative to the schema-level required array).
 * @property {number} [minItems]
 * @property {number} [maxItems] multiple is true if maxItems > 1.
 */

/**
 * @typedef {Object} JsonSchemaDoc
 * @property {string} [$id]
 * @property {string} [$schema]
 * @property {string} [title]
 * @property {string} [description]
 * @property {Record<string, JsonSchemaProperty>} [properties]
 * @property {string[]} [required]
 */

// ── JsonSchemaOntologyModule ──────────────────────────────────────────────────

/**
 * OntologyModule that loads JSON Schema definitions and exposes their
 * properties as OntologyTerms — bridging the skemer heritage.
 * @implements {OntologyModule}
 */
export class JsonSchemaOntologyModule {
  /** @readonly @type {'ontology'} */
  type = 'ontology';

  version = '0.0.0';

  /** @type {string} */
  id;

  /** Keyed by both IRI and property name for convenience lookups.
   * @type {Map<string, OntologyTerm>} */
  #terms = new Map();

  /** @param {string} [id] */
  constructor(id = 'ontology-jsonschema') {
    this.id = id;
  }

  /** @param {OntologySource} source @returns {Promise<void>} */
  async load(source) {
    /** @type {JsonSchemaDoc} */
    let schema;

    if (source.type === 'inline') {
      schema = /** @type {JsonSchemaDoc} */ (source.content);
    } else if (source.type === 'url') {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch JSON Schema from ${source.url}: ${response.statusText}`);
      }
      schema = /** @type {JsonSchemaDoc} */ (await response.json());
    } else {
      // file: avoid a hard fs dependency so callers in browser environments
      // can still use 'url' or 'inline' sources.
      const { readFileSync } = await import('node:fs');
      schema = JSON.parse(readFileSync(source.path, 'utf8'));
    }

    const schemaId = schema.$id ?? '';
    const requiredFields = new Set(schema.required ?? []);

    for (const [propName, prop] of Object.entries(schema.properties ?? {})) {
      const iri = prop['x-iri'] ?? (schemaId ? `${schemaId}#${propName}` : propName);
      const type = jsonSchemaTypeToFieldType(prop.type, prop.format);
      const multiple = prop.maxItems !== undefined ? prop.maxItems > 1 : false;

      /** @type {OntologyTerm} */
      const term = {
        iri,
        label: prop.title ?? propName,
        type,
        required: prop.required ?? requiredFields.has(propName),
        multiple,
        sourceModuleId: this.id,
        ...(prop.description !== undefined && { description: prop.description }),
        ...(prop['x-domain'] !== undefined && { domain: prop['x-domain'] }),
        ...(prop['x-range'] !== undefined && { range: prop['x-range'] }),
      };

      this.#terms.set(iri, term);
      // Also index by the bare property name so callers can look up by name.
      if (propName !== iri) {
        this.#terms.set(propName, term);
      }
    }
  }

  /** @param {string} iri @returns {Promise<OntologyTerm | null>} */
  async getTerm(iri) {
    return this.#terms.get(iri) ?? null;
  }

  /** @returns {Promise<OntologyTerm[]>} */
  async listTerms() {
    // Deduplicate — each term may be indexed twice (by IRI and property name).
    const seen = new Set();
    /** @type {OntologyTerm[]} */
    const result = [];
    for (const term of this.#terms.values()) {
      if (!seen.has(term.iri)) {
        seen.add(term.iri);
        result.push(term);
      }
    }
    return result;
  }
}

