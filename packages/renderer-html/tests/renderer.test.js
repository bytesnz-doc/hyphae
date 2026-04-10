import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HtmlRenderer } from '../src/index.js';
import { esc } from '../src/html.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const project = {
  id: 'p1',
  slug: 'birds',
  label: 'Bird Observations',
  description: 'A project about birds',
  ontologies: [],
  collections: [],
  storageAdapter: 'mem',
  storageConfig: {},
  renderers: ['renderer-html'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const collection = {
  id: 'c1',
  projectId: 'p1',
  slug: 'sightings',
  label: 'Sightings',
  description: 'Bird sightings',
  fields: [
    { id: 'name', label: 'Common Name', type: 'string', required: true, multiple: false },
    { id: 'count', label: 'Count', type: 'number', required: false, multiple: false },
  ],
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const rawRecord = {
  id: 'r1',
  collectionId: 'c1',
  projectId: 'p1',
  data: { name: 'Tui', count: 3 },
  meta: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  },
};

const resolvedRecord = {
  record: rawRecord,
  fields: [
    { id: 'name', label: 'Common Name', type: 'string', required: true, multiple: false, value: 'Tui' },
    { id: 'count', label: 'Count', type: 'number', required: false, multiple: false, value: 3 },
  ],
};

const context = {
  request: {
    url: 'https://example.com/birds',
    method: 'GET',
    headers: {},
    params: {},
    query: {},
  },
  project,
  baseUrl: 'https://example.com',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

test('mimeTypes is ["text/html"]', () => {
  const r = new HtmlRenderer();
  assert.deepEqual(r.mimeTypes, ['text/html']);
});

test('projectList output contains project label and slug', async () => {
  const r = new HtmlRenderer();
  const html = await r.render({
    type: 'projectList',
    project,
    projects: [project],
  }, context);
  assert.ok(html.includes('Bird Observations'), 'should include project label');
  assert.ok(html.includes('birds'), 'should include project slug');
});

test('project output contains project label', async () => {
  const r = new HtmlRenderer();
  const html = await r.render({
    type: 'project',
    project,
    collections: [collection],
  }, context);
  assert.ok(html.includes('Bird Observations'));
});

test('collectionList output contains collection label', async () => {
  const r = new HtmlRenderer();
  const html = await r.render({
    type: 'collectionList',
    project,
    collections: [collection],
  }, context);
  assert.ok(html.includes('Sightings'));
});

test('collection output contains field table with field labels', async () => {
  const r = new HtmlRenderer();
  const html = await r.render({
    type: 'collection',
    project,
    collection,
  }, context);
  assert.ok(html.includes('Common Name'), 'should include field label "Common Name"');
  assert.ok(html.includes('Count'), 'should include field label "Count"');
});

test('recordList output contains record data', async () => {
  const r = new HtmlRenderer();
  const html = await r.render({
    type: 'recordList',
    project,
    collection,
    records: [resolvedRecord],
    pagination: { total: 1, page: { number: 1, size: 20 } },
  }, context);
  assert.ok(html.includes('Tui'), 'should include record value "Tui"');
});

test('record output contains field labels and values', async () => {
  const r = new HtmlRenderer();
  const html = await r.render({
    type: 'record',
    project,
    collection,
    record: resolvedRecord,
  }, context);
  assert.ok(html.includes('Common Name'), 'should include field label');
  assert.ok(html.includes('Tui'), 'should include field value');
});

test('HTML output contains valid HTML5 doctype and <html>', async () => {
  const r = new HtmlRenderer();
  const html = await r.render({
    type: 'project',
    project,
  }, context);
  assert.ok(html.startsWith('<!DOCTYPE html>'), 'should start with doctype');
  assert.ok(html.includes('<html'), 'should include <html> tag');
});

test('esc() escapes <script> to &lt;script&gt;', () => {
  assert.equal(esc('<script>'), '&lt;script&gt;');
});
