import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlainJsonRenderer, JsonApiRenderer } from '../src/index.js';

const project = {
  id: 'p1',
  slug: 'birds',
  label: 'Bird Observations',
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
  slug: 'sightings',
  label: 'Sightings',
  fields: [],
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const rawRecord = {
  id: 'r1',
  collectionId: 'c1',
  projectId: 'p1',
  data: { name: 'Tui', count: 3 },
  meta: { createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', version: 1 },
};

const context = {
  request: { url: '/birds/sightings/r1', method: 'GET', headers: {}, params: {}, query: {} },
  project,
  baseUrl: 'https://example.com',
};

function makeResource(overrides) {
  return { type: 'record', project, ...overrides };
}

// ── PlainJsonRenderer ─────────────────────────────────────────────────────────

describe('PlainJsonRenderer', () => {
  const renderer = new PlainJsonRenderer();

  it('has correct mimeTypes', () => {
    assert.deepEqual(renderer.mimeTypes, ['application/json']);
  });

  it('renders a single record as flat JSON', async () => {
    const resource = makeResource({
      type: 'record',
      collection,
      record: { record: rawRecord, fields: [] },
    });
    const output = JSON.parse(await renderer.render(resource, context));
    assert.equal(output['id'], 'r1');
    assert.equal(output['name'], 'Tui');
    assert.ok(output['_meta']);
  });

  it('renders a record list with meta', async () => {
    const resource = makeResource({
      type: 'recordList',
      collection,
      records: [{ record: rawRecord, fields: [] }],
      pagination: { total: 5, page: { number: 1, size: 20 } },
    });
    const output = JSON.parse(await renderer.render(resource, context));
    assert.equal(output['data'].length, 1);
    assert.equal(output['meta']['total'], 5);
  });

  it('renders a project list', async () => {
    const resource = makeResource({ type: 'projectList', projects: [project] });
    const output = JSON.parse(await renderer.render(resource, context));
    assert.equal(output['data'][0]['slug'], 'birds');
  });
});

// ── JsonApiRenderer ───────────────────────────────────────────────────────────

describe('JsonApiRenderer', () => {
  const renderer = new JsonApiRenderer();

  it('has correct mimeTypes', () => {
    assert.deepEqual(renderer.mimeTypes, ['application/vnd.api+json']);
  });

  it('renders a record with JSON:API envelope', async () => {
    const resource = makeResource({
      type: 'record',
      collection,
      record: { record: rawRecord, fields: [] },
    });
    const output = JSON.parse(await renderer.render(resource, context));
    assert.equal(output['data']['type'], 'records');
    assert.equal(output['data']['id'], 'r1');
    assert.equal(output['data']['attributes']['name'], 'Tui');
    assert.ok(output['included']);
    assert.ok(output['links']);
  });

  it('renders a record list with data array', async () => {
    const resource = makeResource({
      type: 'recordList',
      collection,
      records: [{ record: rawRecord, fields: [] }],
      pagination: { total: 1, page: { number: 1, size: 20 } },
    });
    const output = JSON.parse(await renderer.render(resource, context));
    assert.equal(output['data'].length, 1);
    assert.equal(output['meta']['total'], 1);
  });

  it('renders a project', async () => {
    const resource = makeResource({ type: 'project' });
    const output = JSON.parse(await renderer.render(resource, context));
    assert.equal(output['data']['type'], 'projects');
    assert.equal(output['data']['id'], 'p1');
  });

  it('renders a collection list with included project', async () => {
    const resource = makeResource({ type: 'collectionList', collections: [collection] });
    const output = JSON.parse(await renderer.render(resource, context));
    assert.ok(output['included'].some((i) => i['type'] === 'projects'));
  });
});

