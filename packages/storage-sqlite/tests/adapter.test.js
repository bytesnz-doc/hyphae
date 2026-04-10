import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { SqliteStorageAdapter } from '../src/index.js';

const project = {
  id: 'p1',
  slug: 'test-project',
  label: 'Test Project',
  ontologies: [],
  collections: [],
  storageAdapter: 'sqlite',
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

describe('SqliteStorageAdapter', () => {
  let adapter;

  before(async () => {
    adapter = new SqliteStorageAdapter();
    await adapter.connect({ filename: ':memory:' });
  });

  it('connects and disconnects', async () => {
    const a = new SqliteStorageAdapter('test-disconnect');
    await a.connect({ filename: ':memory:' });
    await a.disconnect();
  });

  it('saves and retrieves a project', async () => {
    await adapter.saveProject(project);
    const result = await adapter.getProject('p1');
    assert.equal(result?.slug, 'test-project');
  });

  it('lists projects', async () => {
    const list = await adapter.listProjects();
    assert.ok(list.length >= 1);
    assert.ok(list.some((p) => p.id === 'p1'));
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

  it('lists collections for a project', async () => {
    const list = await adapter.listCollections('p1');
    assert.ok(list.length >= 1);
    assert.ok(list.some((c) => c.id === 'c1'));
  });

  it('deletes a collection', async () => {
    const c2 = { ...collection, id: 'c2', slug: 'fish' };
    await adapter.saveCollection(c2);
    await adapter.deleteCollection('c2', 'p1');
    assert.equal(await adapter.getCollection('c2', 'p1'), null);
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

  it('sorts records descending', async () => {
    const { data } = await adapter.queryRecords(
      { sort: [{ field: 'count', direction: 'desc' }] },
      'c1', 'p1',
    );
    assert.equal(data[0]?.data['count'], 5);
    assert.equal(data[2]?.data['count'], 1);
  });

  it('paginates records', async () => {
    const { data, total } = await adapter.queryRecords(
      { page: { number: 1, size: 2 } },
      'c1', 'p1',
    );
    assert.equal(total, 3);
    assert.equal(data.length, 2);
  });

  it('returns second page', async () => {
    const { data, total } = await adapter.queryRecords(
      { page: { number: 2, size: 2 } },
      'c1', 'p1',
    );
    assert.equal(total, 3);
    assert.equal(data.length, 1);
  });

  it('deletes a record', async () => {
    await adapter.deleteRecord('r1', 'c1', 'p1');
    assert.equal(await adapter.getRecord('r1', 'c1', 'p1'), null);
  });

  it('transaction commits on success', async () => {
    const result = await adapter.transaction(async () => {
      await adapter.saveRecord(makeRecord('tx1', { name: 'Robin', count: 2 }));
      return 42;
    });
    assert.equal(result, 42);
    const saved = await adapter.getRecord('tx1', 'c1', 'p1');
    assert.ok(saved !== null);
  });

  it('transaction rolls back on error', async () => {
    try {
      await adapter.transaction(async () => {
        await adapter.saveRecord(makeRecord('tx2', { name: 'Fantail', count: 7 }));
        throw new Error('intentional failure');
      });
    } catch {
      // expected
    }
    // The record was written before the throw (SQLite auto-commit in INSERT OR REPLACE),
    // but the transaction wraps the async fn; rollback happens after the throw.
    // Since the INSERT already ran before the throw, SQLite will have rolled it back.
    const saved = await adapter.getRecord('tx2', 'c1', 'p1');
    assert.equal(saved, null);
  });
});
