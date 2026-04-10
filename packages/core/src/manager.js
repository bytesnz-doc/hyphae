// @ts-check
/** @import { StorageAdapter, Project, Collection, DataRecord, Query, QueryResult, OntologyTerm, FieldDefinition, ResolvedField, ResolvedRecord } from './index.d.ts' */
/** @import { OntologyRegistry } from './registry.js' */

import { randomUUID } from 'node:crypto';

/**
 * Manages CRUD for Projects, Collections, and DataRecords.
 * Delegates storage to a StorageAdapter; resolves ontology terms via registry.
 */
export class HyphaeManager {
  /** @type {StorageAdapter} */
  #storage;

  /** @type {OntologyRegistry} */
  #registry;

  /**
   * @param {StorageAdapter} storage
   * @param {OntologyRegistry} registry
   */
  constructor(storage, registry) {
    this.#storage = storage;
    this.#registry = registry;
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  /** @returns {Promise<Project[]>} */
  getProjects() {
    return this.#storage.listProjects();
  }

  /**
   * @param {string} id
   * @returns {Promise<Project | null>}
   */
  getProject(id) {
    return this.#storage.getProject(id);
  }

  /**
   * @param {string} slug
   * @returns {Promise<Project | null>}
   */
  async getProjectBySlug(slug) {
    const projects = await this.#storage.listProjects();
    return projects.find((p) => p.slug === slug) ?? null;
  }

  /**
   * @param {Omit<Project, 'id' | 'createdAt' | 'updatedAt'>} data
   * @returns {Promise<Project>}
   */
  createProject(data) {
    const now = new Date().toISOString();
    return this.#storage.saveProject({
      ...data,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * @param {string} id
   * @param {Partial<Omit<Project, 'id' | 'createdAt'>>} updates
   * @returns {Promise<Project>}
   */
  async updateProject(id, updates) {
    const existing = await this.#storage.getProject(id);
    if (!existing) throw new Error(`Project '${id}' not found`);
    return this.#storage.saveProject({ ...existing, ...updates, updatedAt: new Date().toISOString() });
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  deleteProject(id) {
    return this.#storage.deleteProject(id);
  }

  // ── Collections ───────────────────────────────────────────────────────────

  /**
   * @param {string} projectId
   * @returns {Promise<Collection[]>}
   */
  getCollections(projectId) {
    return this.#storage.listCollections(projectId);
  }

  /**
   * @param {string} id
   * @param {string} projectId
   * @returns {Promise<Collection | null>}
   */
  getCollection(id, projectId) {
    return this.#storage.getCollection(id, projectId);
  }

  /**
   * @param {string} slug
   * @param {string} projectId
   * @returns {Promise<Collection | null>}
   */
  async getCollectionBySlug(slug, projectId) {
    const collections = await this.#storage.listCollections(projectId);
    return collections.find((c) => c.slug === slug) ?? null;
  }

  /**
   * @param {Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'version'>} data
   * @returns {Promise<Collection>}
   */
  createCollection(data) {
    const now = new Date().toISOString();
    return this.#storage.saveCollection({
      ...data,
      id: randomUUID(),
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * @param {string} id
   * @param {string} projectId
   * @param {Partial<Omit<Collection, 'id' | 'projectId' | 'createdAt'>>} updates
   * @returns {Promise<Collection>}
   */
  async updateCollection(id, projectId, updates) {
    const existing = await this.#storage.getCollection(id, projectId);
    if (!existing) throw new Error(`Collection '${id}' not found`);
    // Increment version if fields changed
    const fieldsChanged = updates.fields !== undefined;
    return this.#storage.saveCollection({
      ...existing,
      ...updates,
      version: fieldsChanged ? existing.version + 1 : existing.version,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * @param {string} id
   * @param {string} projectId
   * @returns {Promise<void>}
   */
  deleteCollection(id, projectId) {
    return this.#storage.deleteCollection(id, projectId);
  }

  // ── Records ───────────────────────────────────────────────────────────────

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {string} projectId
   * @returns {Promise<DataRecord | null>}
   */
  getRecord(id, collectionId, projectId) {
    return this.#storage.getRecord(id, collectionId, projectId);
  }

  /**
   * @param {Query} query
   * @param {string} collectionId
   * @param {string} projectId
   * @returns {Promise<QueryResult<DataRecord>>}
   */
  queryRecords(query, collectionId, projectId) {
    return this.#storage.queryRecords(query, collectionId, projectId);
  }

  /**
   * @param {string} collectionId
   * @param {string} projectId
   * @param {Record<string, unknown>} data
   * @param {string} [createdBy]
   * @returns {Promise<DataRecord>}
   */
  createRecord(collectionId, projectId, data, createdBy) {
    const now = new Date().toISOString();
    /** @type {DataRecord} */
    const record = {
      id: randomUUID(),
      collectionId,
      projectId,
      data,
      meta: {
        createdAt: now,
        updatedAt: now,
        version: 1,
        ...(createdBy !== undefined && { createdBy }),
      },
    };
    return this.#storage.saveRecord(record);
  }

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {string} projectId
   * @param {Record<string, unknown>} data
   * @returns {Promise<DataRecord>}
   */
  async updateRecord(id, collectionId, projectId, data) {
    const existing = await this.#storage.getRecord(id, collectionId, projectId);
    if (!existing) throw new Error(`Record '${id}' not found`);
    return this.#storage.saveRecord({
      ...existing,
      data: { ...existing.data, ...data },
      meta: { ...existing.meta, updatedAt: new Date().toISOString(), version: existing.meta.version + 1 },
    });
  }

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {string} projectId
   * @returns {Promise<void>}
   */
  deleteRecord(id, collectionId, projectId) {
    return this.#storage.deleteRecord(id, collectionId, projectId);
  }

  // ── Ontology resolution ───────────────────────────────────────────────────

  /**
   * Resolve all field definitions in a collection to ResolvedFields,
   * attaching ontology term metadata where a termIri is set.
   * @param {Collection} collection
   * @returns {Promise<ResolvedField[]>}
   */
  async resolveFields(collection) {
    return Promise.all(
      collection.fields.map(async (field) => {
        if (!field.termIri) return { ...field };
        const term = await this.#registry.resolveTerm(field.termIri);
        return term ? { ...field, term } : { ...field };
      }),
    );
  }

  /**
   * Resolve a DataRecord into a ResolvedRecord with field metadata attached.
   * @param {DataRecord} record
   * @param {Collection} collection
   * @returns {Promise<ResolvedRecord>}
   */
  async resolveRecord(record, collection) {
    const fields = await this.resolveFields(collection);
    const resolvedFields = fields.map((f) => ({
      ...f,
      value: record.data[f.id],
    }));
    return { record, fields: resolvedFields };
  }
}
