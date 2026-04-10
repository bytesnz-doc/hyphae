import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseFilter, parseSort, parsePage, parseQuery } from '../src/query-parser.js';

describe('parseFilter', () => {
  it('returns undefined for empty params', () => {
    assert.equal(parseFilter({}), undefined);
  });

  it('returns undefined when no filter keys present', () => {
    assert.equal(parseFilter({ sort: 'name', 'page[number]': '1' }), undefined);
  });

  it('parses a single $eq condition', () => {
    const f = parseFilter({ 'filter[name][$eq]': 'Tui' });
    assert.deepEqual(f, { type: 'condition', path: 'name', operator: '$eq', value: 'Tui' });
  });

  it('coerces numeric string to number', () => {
    const f = parseFilter({ 'filter[count][$gt]': '3' });
    assert.deepEqual(f, { type: 'condition', path: 'count', operator: '$gt', value: 3 });
  });

  it('coerces boolean strings', () => {
    const f = parseFilter({ 'filter[active][$eq]': 'true' });
    assert.deepEqual(f, { type: 'condition', path: 'active', operator: '$eq', value: true });
  });

  it('wraps multiple conditions in $and', () => {
    const f = parseFilter({ 'filter[name][$eq]': 'Tui', 'filter[count][$gt]': '1' });
    assert.equal(f?.type, 'and');
    if (f?.type !== 'and') return;
    assert.equal(f.filters.length, 2);
  });

  it('parses $in as array', () => {
    const f = parseFilter({ 'filter[status][$in]': 'a,b,c' });
    assert.deepEqual(f, { type: 'condition', path: 'status', operator: '$in', value: ['a', 'b', 'c'] });
  });
});

describe('parseSort', () => {
  it('returns empty array for undefined', () => {
    assert.deepEqual(parseSort(undefined), []);
  });

  it('parses ascending field', () => {
    assert.deepEqual(parseSort('name'), [{ field: 'name', direction: 'asc' }]);
  });

  it('parses descending field with leading -', () => {
    assert.deepEqual(parseSort('-count'), [{ field: 'count', direction: 'desc' }]);
  });

  it('parses multiple fields', () => {
    const result = parseSort('name,-count');
    assert.equal(result.length, 2);
    assert.equal(result[0]?.direction, 'asc');
    assert.equal(result[1]?.direction, 'desc');
  });
});

describe('parsePage', () => {
  it('returns defaults for empty params', () => {
    assert.deepEqual(parsePage({}), { number: 1, size: 20 });
  });

  it('parses page number and size', () => {
    assert.deepEqual(parsePage({ 'page[number]': '2', 'page[size]': '50' }), { number: 2, size: 50 });
  });

  it('falls back to defaults for invalid values', () => {
    assert.deepEqual(parsePage({ 'page[number]': 'abc', 'page[size]': '-1' }), { number: 1, size: 20 });
  });
});

describe('parseQuery', () => {
  it('returns a complete Query object', () => {
    const q = parseQuery({
      'filter[name][$eq]': 'Tui',
      sort: '-count',
      'page[number]': '2',
      'page[size]': '10',
    });
    assert.ok(q.filter);
    assert.equal(q.sort?.[0]?.direction, 'desc');
    assert.equal(q.page?.number, 2);
    assert.equal(q.page?.size, 10);
  });
});
