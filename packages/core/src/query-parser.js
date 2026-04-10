// @ts-check
/** @import { FilterExpression, FilterOperator, Query, SortField, PageParams } from './index.d.ts' */

/**
 * Parse a flat filter[path][$op]=value query string object into a FilterExpression tree.
 *
 * Input shape (from URL query params):
 *   { 'filter[name][$eq]': 'Tui', 'filter[count][$gt]': '2' }
 *
 * Multiple conditions are ANDed together.
 *
 * @param {Record<string, string | string[]>} queryParams
 * @returns {FilterExpression | undefined}
 */
export function parseFilter(queryParams) {
  /** @type {FilterExpression[]} */
  const conditions = [];

  for (const [key, raw] of Object.entries(queryParams)) {
    const match = key.match(/^filter\[([^\]]+)\]\[(\$[a-z]+)\]$/);
    if (!match) continue;

    const path = match[1];
    const operator = /** @type {FilterOperator} */ (match[2]);
    const rawValue = Array.isArray(raw) ? raw[0] : raw;

    // Coerce $in to an array; numeric-looking values to numbers.
    let value;
    if (operator === '$in') {
      value = (Array.isArray(raw) ? raw : rawValue.split(',')).map(coerceValue);
    } else {
      value = coerceValue(rawValue ?? '');
    }

    conditions.push({ type: 'condition', path, operator, value });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { type: 'and', filters: conditions };
}

/**
 * Parse sort=-name,count into SortField[].
 * A leading '-' means descending, no prefix means ascending.
 *
 * @param {string | string[] | undefined} sortParam
 * @returns {SortField[]}
 */
export function parseSort(sortParam) {
  if (!sortParam) return [];
  const raw = Array.isArray(sortParam) ? sortParam.join(',') : sortParam;
  return raw.split(',').filter(Boolean).map((part) => {
    if (part.startsWith('-')) {
      return { field: part.slice(1), direction: /** @type {'desc'} */ ('desc') };
    }
    return { field: part, direction: /** @type {'asc'} */ ('asc') };
  });
}

/**
 * Parse page[number] and page[size] from query params.
 *
 * @param {Record<string, string | string[]>} queryParams
 * @param {number} [defaultSize]
 * @returns {PageParams}
 */
export function parsePage(queryParams, defaultSize = 20) {
  const number = parseInt(String(queryParams['page[number]'] ?? '1'), 10);
  const size = parseInt(String(queryParams['page[size]'] ?? String(defaultSize)), 10);
  return {
    number: Number.isFinite(number) && number > 0 ? number : 1,
    size: Number.isFinite(size) && size > 0 ? size : defaultSize,
  };
}

/**
 * Build a full Query from raw URL query params.
 *
 * @param {Record<string, string | string[]>} queryParams
 * @returns {Query}
 */
export function parseQuery(queryParams) {
  return {
    filter: parseFilter(queryParams),
    sort: parseSort(/** @type {string | undefined} */ (queryParams['sort'])),
    page: parsePage(queryParams),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * @param {string} raw
 * @returns {unknown}
 */
function coerceValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  const num = Number(raw);
  if (raw !== '' && !Number.isNaN(num)) return num;
  return raw;
}
