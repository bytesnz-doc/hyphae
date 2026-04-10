// @ts-check
/** @import { StorageAdapter, StorageConfig, Project, Collection, DataRecord, Query, QueryResult, FilterExpression, SortField, PageParams } from '@hyphae/core' */

import Database from 'better-sqlite3';

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

// ── SqliteStorageAdapter ──────────────────────────────────────────────────────

/**
 * SQLite-backed StorageAdapter using better-sqlite3.
 * @implements {StorageAdapter}
 */
export class SqliteStorageAdapter {
  /** @readonly @type {'storage'} */
  type = 'storage';

  version = '0.0.0';

  /** @type {string} */
  id;

  /** @type {import('better-sqlite3').Database | null} */
  #db = null;

  /** @param {string} [id] */
  constructor(id = 'storage-sqlite') {
    this.id = id;
  }

  /**
   * @param {StorageConfig & { filename?: string }} config
   * @returns {Promise<void>}
   */
  async connect(config) {
    const filename = typeof config.filename === 'string' ? config.filename : ':memory:';
    this.#db = new Database(filename);
    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        data TEXT NOT NULL,
        UNIQUE(project_id, slug)
      );
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);
  }

  /** @returns {Promise<void>} */
  async disconnect() {
    this.#db?.close();
    this.#db = null;
  }

  /** @returns {import('better-sqlite3').Database} */
  #getDb() {
    if (!this.#db) throw new Error('Not connected');
    return this.#db;
  }

  // ── Projects ──

  /** @param {string} id @returns {Promise<Project | null>} */
  async getProject(id) {
    const row = /** @type {{ data: string } | undefined} */ (
      this.#getDb().prepare('SELECT data FROM projects WHERE id = ?').get(id)
    );
    return row ? /** @type {Project} */ (JSON.parse(row.data)) : null;
  }

  /** @returns {Promise<Project[]>} */
  async listProjects() {
    const rows = /** @type {{ data: string }[]} */ (
      this.#getDb().prepare('SELECT data FROM projects').all()
    );
    return rows.map((r) => /** @type {Project} */ (JSON.parse(r.data)));
  }

  /** @param {Project} project @returns {Promise<Project>} */
  async saveProject(project) {
    this.#getDb()
      .prepare('INSERT OR REPLACE INTO projects (id, slug, data) VALUES (?, ?, ?)')
      .run(project.id, project.slug, JSON.stringify(project));
    return project;
  }

  /** @param {string} id @returns {Promise<void>} */
  async deleteProject(id) {
    this.#getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  // ── Collections ──

  /** @param {string} id @param {string} projectId @returns {Promise<Collection | null>} */
  async getCollection(id, projectId) {
    const row = /** @type {{ data: string } | undefined} */ (
      this.#getDb()
        .prepare('SELECT data FROM collections WHERE id = ? AND project_id = ?')
        .get(id, projectId)
    );
    return row ? /** @type {Collection} */ (JSON.parse(row.data)) : null;
  }

  /** @param {string} projectId @returns {Promise<Collection[]>} */
  async listCollections(projectId) {
    const rows = /** @type {{ data: string }[]} */ (
      this.#getDb()
        .prepare('SELECT data FROM collections WHERE project_id = ?')
        .all(projectId)
    );
    return rows.map((r) => /** @type {Collection} */ (JSON.parse(r.data)));
  }

  /** @param {Collection} collection @returns {Promise<Collection>} */
  async saveCollection(collection) {
    this.#getDb()
      .prepare(
        'INSERT OR REPLACE INTO collections (id, project_id, slug, data) VALUES (?, ?, ?, ?)',
      )
      .run(collection.id, collection.projectId, collection.slug, JSON.stringify(collection));
    return collection;
  }

  /** @param {string} id @param {string} projectId @returns {Promise<void>} */
  async deleteCollection(id, projectId) {
    this.#getDb()
      .prepare('DELETE FROM collections WHERE id = ? AND project_id = ?')
      .run(id, projectId);
  }

  // ── Records ──

  /** @param {string} id @param {string} collectionId @param {string} projectId @returns {Promise<DataRecord | null>} */
  async getRecord(id, collectionId, projectId) {
    const row = /** @type {{ data: string } | undefined} */ (
      this.#getDb()
        .prepare('SELECT data FROM records WHERE id = ? AND collection_id = ? AND project_id = ?')
        .get(id, collectionId, projectId)
    );
    return row ? /** @type {DataRecord} */ (JSON.parse(row.data)) : null;
  }

  /** @param {Query} query @param {string} collectionId @param {string} projectId @returns {Promise<QueryResult<DataRecord>>} */
  async queryRecords(query, collectionId, projectId) {
    const rows = /** @type {{ data: string }[]} */ (
      this.#getDb()
        .prepare('SELECT data FROM records WHERE collection_id = ? AND project_id = ?')
        .all(collectionId, projectId)
    );

    let results = rows.map((r) => /** @type {DataRecord} */ (JSON.parse(r.data)));

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
    this.#getDb()
      .prepare(
        'INSERT OR REPLACE INTO records (id, collection_id, project_id, data) VALUES (?, ?, ?, ?)',
      )
      .run(record.id, record.collectionId, record.projectId, JSON.stringify(record));
    return record;
  }

  /** @param {string} id @param {string} collectionId @param {string} projectId @returns {Promise<void>} */
  async deleteRecord(id, collectionId, projectId) {
    this.#getDb()
      .prepare('DELETE FROM records WHERE id = ? AND collection_id = ? AND project_id = ?')
      .run(id, collectionId, projectId);
  }

  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async transaction(fn) {
    const db = this.#getDb();
    db.exec('BEGIN');
    try {
      const result = await fn();
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}
