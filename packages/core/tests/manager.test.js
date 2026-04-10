import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { HyphaeManager } from '../src/manager.js';
import { OntologyRegistry } from '../src/registry.js';

// ── Minimal in-memory storage adapter (no dependency on @hyphae/storage-memory) ──

class MemStore {
  type = 'storage';
  id = 'mem';
  version = '0.0.0';
  projects = new Map();
  collections = new Map();
  records = new Map();

  async connect() {}
  async disconnect() {}

  async getProject(id) { return this.projects.get(id) ?? null; }
  async listProjects() { return [...this.projects.values()]; }
  async saveProject(p) { this.projects.set(p.id, { ...p }); return p; }
  async deleteProject(id) { this.projects.delete(id); }

  #ck(id, pid) { return `${pid}::${id}`; }
  async getCollection(id, pid) { return this.collections.get(this.#ck(id, pid)) ?? null; }
  async listCollections(pid) { return [...this.collections.values()].filter(c => c.projectId === pid); }
  async saveCollection(c) { this.collections.set(this.#ck(c.id, c.projectId), { ...c }); return c; }
  async deleteCollection(id, pid) { this.collections.delete(this.#ck(id, pid)); }

  #rk(id, cid, pid) { return `${pid}::${cid}::${id}`; }
  async getRecord(id, cid, pid) { return this.records.get(this.#rk(id, cid, pid)) ?? null; }
  async queryRecords(q, cid, pid) {
    const data = [...this.records.values()].filter(r => r.collectionId === cid && r.projectId === pid);
    return { data, total: data.length, page: q.page ?? { number: 1, size: 20 } };
  }
  async saveRecord(r) { this.records.set(this.#rk(r.id, r.collectionId, r.projectId), { ...r }); return r; }
  async deleteRecord(id, cid, pid) { this.records.delete(this.#rk(id, cid, pid)); }
}

describe('HyphaeManager', () => {
  let manager;
  let projectId;
  let collectionId;

  before(async () => {
    const store = new MemStore();
    await store.connect();
    const registry = new OntologyRegistry();
    manager = new HyphaeManager(store, registry);
  });

  it('creates a project with generated id and timestamps', async () => {
    const p = await manager.createProject({
      slug: 'birds',
      label: 'Birds',
      ontologies: [],
      collections: [],
      storageAdapter: 'mem',
      storageConfig: {},
      renderers: [],
    });
    assert.ok(p.id);
    assert.ok(p.createdAt);
    projectId = p.id;
  });

  it('retrieves project by id', async () => {
    const p = await manager.getProject(projectId);
    assert.equal(p?.slug, 'birds');
  });

  it('retrieves project by slug', async () => {
    const p = await manager.getProjectBySlug('birds');
    assert.equal(p?.id, projectId);
  });

  it('updates a project', async () => {
    const p = await manager.updateProject(projectId, { label: 'Bird Observations' });
    assert.equal(p.label, 'Bird Observations');
  });

  it('creates a collection with version 1', async () => {
    const c = await manager.createCollection({
      projectId,
      slug: 'sightings',
      label: 'Sightings',
      fields: [{ id: 'name', label: 'Name', type: 'string', required: true, multiple: false }],
    });
    assert.ok(c.id);
    assert.equal(c.version, 1);
    collectionId = c.id;
  });

  it('increments collection version when fields change', async () => {
    const c = await manager.updateCollection(collectionId, projectId, {
      fields: [
        { id: 'name', label: 'Name', type: 'string', required: true, multiple: false },
        { id: 'count', label: 'Count', type: 'number', required: false, multiple: false },
      ],
    });
    assert.equal(c.version, 2);
  });

  it('creates a record with generated id', async () => {
    const r = await manager.createRecord(collectionId, projectId, { name: 'Tui', count: 3 });
    assert.ok(r.id);
    assert.equal(r.meta.version, 1);
    assert.equal(r.data['name'], 'Tui');
  });

  it('queries records', async () => {
    await manager.createRecord(collectionId, projectId, { name: 'Kiwi', count: 1 });
    const result = await manager.queryRecords({}, collectionId, projectId);
    assert.equal(result.total, 2);
  });

  it('updates a record and bumps its version', async () => {
    const { data } = await manager.queryRecords({}, collectionId, projectId);
    const record = data[0];
    const updated = await manager.updateRecord(record.id, collectionId, projectId, { count: 99 });
    assert.equal(updated.data['count'], 99);
    assert.equal(updated.meta.version, 2);
  });

  it('resolves fields for a collection (no term IRIs)', async () => {
    const c = await manager.getCollection(collectionId, projectId);
    const fields = await manager.resolveFields(c);
    assert.equal(fields.length, 2);
    assert.equal(fields[0]?.id, 'name');
  });

  it('resolves a record with field values attached', async () => {
    const { data } = await manager.queryRecords({}, collectionId, projectId);
    const collection = await manager.getCollection(collectionId, projectId);
    const resolved = await manager.resolveRecord(data[0], collection);
    assert.ok(resolved.fields.some(f => f.value !== undefined));
  });

  it('throws on updateProject with unknown id', async () => {
    await assert.rejects(() => manager.updateProject('nonexistent', { label: 'x' }), /not found/);
  });

  it('throws on updateCollection with unknown id', async () => {
    await assert.rejects(() => manager.updateCollection('nonexistent', projectId, {}), /not found/);
  });
});

describe('OntologyRegistry', () => {
  it('returns null for unknown IRI', async () => {
    const reg = new OntologyRegistry();
    assert.equal(await reg.resolveTerm('https://unknown.example/term'), null);
  });

  it('resolves a term from a registered term collection', async () => {
    const reg = new OntologyRegistry();
    reg.registerTermCollection({
      id: 'test-col',
      type: 'collection',
      version: '0.0.0',
      load: async () => {},
      getTerm: (iri) => iri === 'https://example.com/name'
        ? { iri: 'https://example.com/name', label: 'Name', type: 'string', required: false, multiple: false, sourceModuleId: 'test-col' }
        : undefined,
      listTerms: () => [],
    });
    const term = await reg.resolveTerm('https://example.com/name');
    assert.equal(term?.label, 'Name');
  });

  it('lists all terms from collections and modules', async () => {
    const reg = new OntologyRegistry();
    reg.registerTermCollection({
      id: 'col',
      type: 'collection',
      version: '0.0.0',
      load: async () => {},
      getTerm: () => undefined,
      listTerms: () => [
        { iri: 'https://example.com/a', label: 'A', type: 'string', required: false, multiple: false, sourceModuleId: 'col' },
      ],
    });
    const terms = await reg.listAllTerms();
    assert.equal(terms.length, 1);
  });
});
