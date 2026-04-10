// @ts-check
/** @import { StorageAdapter, StorageConfig, Project, Collection, DataRecord, Query, QueryResult, FilterExpression, SortField, PageParams } from '@hyphae/core' */

// ── Query helpers ─────────────────────────────────────────────────────────────

/**
 * @param {Record<string, unknown>} data
 * @param {string} path
 * @returns {unknown}
 */
function getNestedValue(data, path) {
  const parts = path.split('.');
  /** @type {unknown} */
  let current = data;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = /** @type {Record<string, unknown>} */ (current)[part];
  }
  return current;
}

/**
 * @param {unknown} value
 * @param {string} operator
 * @param {unknown} filterValue
 * @returns {boolean}
 */
function applyOperator(value, operator, filterValue) {
  switch (operator) {
    case '$eq': return value === filterValue;
    case '$lt': return typeof value === 'number' && typeof filterValue === 'number' && value < filterValue;
    case '$gt': return typeof value === 'number' && typeof filterValue === 'number' && value > filterValue;
    case '$lte': return typeof value === 'number' && typeof filterValue === 'number' && value <= filterValue;
    case '$gte': return typeof value === 'number' && typeof filterValue === 'number' && value >= filterValue;
    case '$in': return Array.isArray(filterValue) && filterValue.includes(value);
    case '$has': return Array.isArray(value) && value.includes(filterValue);
    case '$like': {
      if (typeof value !== 'string' || typeof filterValue !== 'string') return false;
      const pattern = '^' + filterValue.replace(/%/g, '.*').replace(/_/g, '.') + '$';
      return new RegExp(pattern).test(value);
    }
    case '$ilike': {
      if (typeof value !== 'string' || typeof filterValue !== 'string') return false;
      const pattern = '^' + filterValue.replace(/%/g, '.*').replace(/_/g, '.') + '$';
      return new RegExp(pattern, 'i').test(value);
    }
    case '$fuzzy':
      return typeof value === 'string' && typeof filterValue === 'string' &&
        value.toLowerCase().includes(filterValue.toLowerCase());
    case '$starts':
      return typeof value === 'string' && typeof filterValue === 'string' && value.startsWith(filterValue);
    case '$ends':
      return typeof value === 'string' && typeof filterValue === 'string' && value.endsWith(filterValue);
    default:
      return false;
  }
}

/**
 * @param {DataRecord} record
 * @param {FilterExpression} filter
 * @returns {boolean}
 */
function applyFilter(record, filter) {
  switch (filter.type) {
    case 'condition':
      return applyOperator(getNestedValue(record.data, filter.path), filter.operator, filter.value);
    case 'and':
      return filter.filters.every((f) => applyFilter(record, f));
    case 'or':
      return filter.filters.some((f) => applyFilter(record, f));
    case 'not':
      return !applyFilter(record, filter.filter);
  }
}

/**
 * @param {DataRecord[]} records
 * @param {SortField[]} sort
 * @returns {DataRecord[]}
 */
function sortRecords(records, sort) {
  return [...records].sort((a, b) => {
    for (const { field, direction } of sort) {
      const aVal = getNestedValue(a.data, field);
      const bVal = getNestedValue(b.data, field);
      if (aVal === bVal) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return direction === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

// ── MemoryStorageAdapter ──────────────────────────────────────────────────────

/**
 * In-memory StorageAdapter — for testing and ephemeral use.
 * @implements {StorageAdapter}
 */
export class MemoryStorageAdapter {
  /** @readonly @type {'storage'} */
  type = 'storage';

  version = '0.0.0';

  /** @type {string} */
  id;

  /** @type {Map<string, Project>} */
  #projects = new Map();

  /** @type {Map<string, Collection>} */
  #collections = new Map();

  /** @type {Map<string, DataRecord>} */
  #records = new Map();

  /** @param {string} [id] */
  constructor(id = 'storage-memory') {
    this.id = id;
  }

  /** @param {StorageConfig} _config @returns {Promise<void>} */
  async connect(_config) {}

  /** @returns {Promise<void>} */
  async disconnect() {}

  // ── Projects ──

  /** @param {string} id @returns {Promise<Project | null>} */
  async getProject(id) {
    return this.#projects.get(id) ?? null;
  }

  /** @returns {Promise<Project[]>} */
  async listProjects() {
    return Array.from(this.#projects.values());
  }

  /** @param {Project} project @returns {Promise<Project>} */
  async saveProject(project) {
    this.#projects.set(project.id, { ...project });
    return project;
  }

  /** @param {string} id @returns {Promise<void>} */
  async deleteProject(id) {
    this.#projects.delete(id);
  }

  // ── Collections ──

  /**
   * @param {string} id
   * @param {string} projectId
   * @returns {string}
   */
  #collectionKey(id, projectId) {
    return `${projectId}::${id}`;
  }

  /** @param {string} id @param {string} projectId @returns {Promise<Collection | null>} */
  async getCollection(id, projectId) {
    return this.#collections.get(this.#collectionKey(id, projectId)) ?? null;
  }

  /** @param {string} projectId @returns {Promise<Collection[]>} */
  async listCollections(projectId) {
    return Array.from(this.#collections.values()).filter((c) => c.projectId === projectId);
  }

  /** @param {Collection} collection @returns {Promise<Collection>} */
  async saveCollection(collection) {
    this.#collections.set(this.#collectionKey(collection.id, collection.projectId), { ...collection });
    return collection;
  }

  /** @param {string} id @param {string} projectId @returns {Promise<void>} */
  async deleteCollection(id, projectId) {
    this.#collections.delete(this.#collectionKey(id, projectId));
  }

  // ── Records ──

  /**
   * @param {string} id
   * @param {string} collectionId
   * @param {string} projectId
   * @returns {string}
   */
  #recordKey(id, collectionId, projectId) {
    return `${projectId}::${collectionId}::${id}`;
  }

  /** @param {string} id @param {string} collectionId @param {string} projectId @returns {Promise<DataRecord | null>} */
  async getRecord(id, collectionId, projectId) {
    return this.#records.get(this.#recordKey(id, collectionId, projectId)) ?? null;
  }

  /** @param {Query} query @param {string} collectionId @param {string} projectId @returns {Promise<QueryResult<DataRecord>>} */
  async queryRecords(query, collectionId, projectId) {
    let results = Array.from(this.#records.values()).filter(
      (r) => r.collectionId === collectionId && r.projectId === projectId,
    );

    if (query.filter) {
      const filter = query.filter;
      results = results.filter((r) => applyFilter(r, filter));
    }

    if (query.sort?.length) {
      results = sortRecords(results, query.sort);
    }

    const total = results.length;
    /** @type {PageParams} */
    const page = query.page ?? { number: 1, size: 20 };
    const start = (page.number - 1) * page.size;

    return { data: results.slice(start, start + page.size), total, page };
  }

  /** @param {DataRecord} record @returns {Promise<DataRecord>} */
  async saveRecord(record) {
    this.#records.set(this.#recordKey(record.id, record.collectionId, record.projectId), { ...record });
    return record;
  }

  /** @param {string} id @param {string} collectionId @param {string} projectId @returns {Promise<void>} */
  async deleteRecord(id, collectionId, projectId) {
    this.#records.delete(this.#recordKey(id, collectionId, projectId));
  }

  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async transaction(fn) {
    return fn();
  }
}
