// @ts-check
/** @import { OntologyModule, TermCollectionModule, OntologyTerm, OntologySource } from './index.d.ts' */

/**
 * Central registry for ontology modules and term collections.
 * Registered modules are queried in registration order.
 */
export class OntologyRegistry {
  /** @type {Map<string, OntologyModule>} */
  #ontologyModules = new Map();

  /** @type {Map<string, TermCollectionModule>} */
  #termCollections = new Map();

  /**
   * Register an ontology module (e.g. OWL, SKOS, JSON Schema).
   * @param {OntologyModule} mod
   */
  registerOntologyModule(mod) {
    this.#ontologyModules.set(mod.id, mod);
  }

  /**
   * Register a pre-loaded term collection module (e.g. Darwin Core).
   * @param {TermCollectionModule} mod
   */
  registerTermCollection(mod) {
    this.#termCollections.set(mod.id, mod);
  }

  /**
   * Load an ontology from a source using the named module.
   * @param {string} moduleId
   * @param {OntologySource} source
   * @returns {Promise<void>}
   */
  async load(moduleId, source) {
    const mod = this.#ontologyModules.get(moduleId);
    if (!mod) throw new Error(`Ontology module '${moduleId}' not registered`);
    await mod.load(source);
  }

  /**
   * Resolve a term IRI — checks term collections first (fast path), then
   * ontology modules in registration order.
   * @param {string} iri
   * @returns {Promise<OntologyTerm | null>}
   */
  async resolveTerm(iri) {
    for (const col of this.#termCollections.values()) {
      const term = col.getTerm(iri);
      if (term) return term;
    }
    for (const mod of this.#ontologyModules.values()) {
      const term = await mod.getTerm(iri);
      if (term) return term;
    }
    return null;
  }

  /**
   * List all known terms across all registered modules and collections.
   * @returns {Promise<OntologyTerm[]>}
   */
  async listAllTerms() {
    /** @type {OntologyTerm[]} */
    const results = [];
    const seen = new Set();

    for (const col of this.#termCollections.values()) {
      for (const term of col.listTerms()) {
        if (!seen.has(term.iri)) {
          seen.add(term.iri);
          results.push(term);
        }
      }
    }
    for (const mod of this.#ontologyModules.values()) {
      for (const term of await mod.listTerms()) {
        if (!seen.has(term.iri)) {
          seen.add(term.iri);
          results.push(term);
        }
      }
    }
    return results;
  }
}
