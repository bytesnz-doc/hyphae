import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorageAdapter } from '../src/index.js';

const project = {
  id: 'p1',
  slug: 'test-project',
  label: 'Test Project',
  ontologies: [],
  collections: [],
  storageAdapter: 'memory',
  storageConfig: {},
  renderers: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const collection = {
  id: 'c1',
  projectId: 'p1',
  slug: 'birds',
  label: 'Birds',
  fields: [],
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function makeRecord(id, data) {
  return {
    id,
    collectionId: 'c1',
    projectId: 'p1',
    data,
    meta: { createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', version: 1 },
  };
}

describe('MemoryStorageAdapter', () => {
  let adapter;

  before(async () => {
    adapter = new MemoryStorageAdapter();
    await adapter.connect({});
  });

  it('saves and retrieves a project', async () => {
    await adapter.saveProject(project);
    const result = await adapter.getProject('p1');
    assert.equal(result?.slug, 'test-project');
  });

  it('lists projects', async () => {
    const list = await adapter.listProjects();
    assert.equal(list.length, 1);
  });

  it('deletes a project', async () => {
    const p2 = { ...project, id: 'p2', slug: 'p2' };
    await adapter.saveProject(p2);
    await adapter.deleteProject('p2');
    assert.equal(await adapter.getProject('p2'), null);
  });

  it('saves and retrieves a collection', async () => {
    await adapter.saveCollection(collection);
    const result = await adapter.getCollection('c1', 'p1');
    assert.equal(result?.slug, 'birds');
  });

  it('saves and queries records', async () => {
    await adapter.saveRecord(makeRecord('r1', { name: 'Tui', count: 3 }));
    await adapter.saveRecord(makeRecord('r2', { name: 'Kiwi', count: 1 }));
    await adapter.saveRecord(makeRecord('r3', { name: 'Kākāpō', count: 5 }));

    const { data, total } = await adapter.queryRecords({}, 'c1', 'p1');
    assert.equal(total, 3);
    assert.equal(data.length, 3);
  });

  it('filters records with $eq', async () => {
    const { data } = await adapter.queryRecords(
      { filter: { type: 'condition', path: 'name', operator: '$eq', value: 'Tui' } },
      'c1', 'p1',
    );
    assert.equal(data.length, 1);
    assert.equal(data[0]?.data['name'], 'Tui');
  });

  it('filters records with $gt', async () => {
    const { data } = await adapter.queryRecords(
      { filter: { type: 'condition', path: 'count', operator: '$gt', value: 2 } },
      'c1', 'p1',
    );
    assert.equal(data.length, 2);
  });

  it('filters records with $and', async () => {
    const { data } = await adapter.queryRecords(
      {
        filter: {
          type: 'and',
          filters: [
            { type: 'condition', path: 'count', operator: '$gte', value: 1 },
            { type: 'condition', path: 'count', operator: '$lte', value: 3 },
          ],
        },
      },
      'c1', 'p1',
    );
    assert.equal(data.length, 2);
  });

  it('filters records with $not', async () => {
    const { data } = await adapter.queryRecords(
      { filter: { type: 'not', filter: { type: 'condition', path: 'name', operator: '$eq', value: 'Tui' } } },
      'c1', 'p1',
    );
    assert.equal(data.length, 2);
  });

  it('sorts records ascending', async () => {
    const { data } = await adapter.queryRecords(
      { sort: [{ field: 'count', direction: 'asc' }] },
      'c1', 'p1',
    );
    assert.equal(data[0]?.data['count'], 1);
    assert.equal(data[2]?.data['count'], 5);
  });

  it('paginates records', async () => {
    const { data, total } = await adapter.queryRecords(
      { page: { number: 1, size: 2 } },
      'c1', 'p1',
    );
    assert.equal(total, 3);
    assert.equal(data.length, 2);
  });

  it('deletes a record', async () => {
    await adapter.deleteRecord('r1', 'c1', 'p1');
    assert.equal(await adapter.getRecord('r1', 'c1', 'p1'), null);
  });

  it('transaction runs fn and returns result', async () => {
    const result = await adapter.transaction(async () => 42);
    assert.equal(result, 42);
  });
});

