/** @import { Renderer, ResolvedResource, RenderContext, ResolvedField, ResolvedRecord } from '@hyphae/core' */

import { esc, tag, page } from './html.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a simple HTML table.
 * @param {string[]} headers
 * @param {string[][]} rows  Each row is an array of cell HTML strings (not escaped)
 * @returns {string}
 */
function table(headers, rows) {
  const thead = tag('thead', {}, tag('tr', {}, headers.map(h => tag('th', {}, esc(h))).join('')));
  const tbody = tag('tbody', {}, rows.map(row =>
    tag('tr', {}, row.map(cell => tag('td', {}, cell)).join(''))
  ).join(''));
  return tag('table', {}, thead + tbody);
}

/**
 * Build a breadcrumb / nav bar from anchor pairs.
 * @param {Array<{href:string,label:string}>} links
 * @returns {string}
 */
function nav(links) {
  return tag('nav', {}, links.map(l => tag('a', { href: l.href }, esc(l.label))).join(''));
}

// ── renderers per resource type ───────────────────────────────────────────────

/**
 * @param {ResolvedResource} resource
 * @returns {string}
 */
function renderProjectList(resource) {
  const projects = resource.projects ?? [];
  const rows = projects.map(p => [
    tag('a', { href: `/${esc(p.slug)}` }, esc(p.label)),
    esc(p.slug),
  ]);
  const body = tag('h1', {}, 'Projects')
    + nav([{ href: '/_projects', label: 'Projects' }])
    + table(['Label', 'Slug'], rows);
  return page('Projects', body);
}

/**
 * @param {ResolvedResource} resource
 * @returns {string}
 */
function renderProject(resource) {
  const p = resource.project;
  let body = tag('h1', {}, esc(p.label));
  if (p.description) body += tag('p', {}, esc(p.description));
  body += nav([{ href: `/${p.slug}/_collections`, label: 'Collections' }]);

  if (resource.collections && resource.collections.length > 0) {
    const rows = resource.collections.map(c => [
      tag('a', { href: `/${esc(p.slug)}/${esc(c.slug)}` }, esc(c.label)),
      esc(c.slug),
      esc(c.description ?? ''),
    ]);
    body += table(['Label', 'Slug', 'Description'], rows);
  }

  return page(p.label, body);
}

/**
 * @param {ResolvedResource} resource
 * @returns {string}
 */
function renderCollectionList(resource) {
  const p = resource.project;
  const collections = resource.collections ?? [];
  const title = `${p.label}: Collections`;
  const rows = collections.map(c => [
    tag('a', { href: `/${esc(p.slug)}/${esc(c.slug)}` }, esc(c.label)),
    esc(c.slug),
    esc(c.description ?? ''),
  ]);
  const body = tag('h1', {}, esc(title))
    + nav([{ href: `/_projects`, label: 'Projects' }, { href: `/${p.slug}`, label: p.label }])
    + table(['Label', 'Slug', 'Description'], rows);
  return page(title, body);
}

/**
 * @param {ResolvedResource} resource
 * @returns {string}
 */
function renderCollection(resource) {
  const p = resource.project;
  const c = /** @type {import('@hyphae/core').Collection} */ (resource.collection);
  let body = tag('h1', {}, esc(c.label));
  if (c.description) body += tag('p', {}, esc(c.description));
  body += nav([
    { href: `/_projects`, label: 'Projects' },
    { href: `/${p.slug}`, label: p.label },
    { href: `/${p.slug}/_collections`, label: 'Collections' },
    { href: `/${p.slug}/${c.slug}`, label: 'Records' },
  ]);

  const fields = resource.resolvedFields ?? c.fields.map(f => ({ ...f }));
  const rows = fields.map(f => [
    esc(f.id),
    esc(f.label),
    esc(f.type),
    esc(f.required ? 'Yes' : 'No'),
    f.termIri ? tag('a', { href: f.termIri }, esc(f.termIri)) : '',
  ]);
  body += table(['ID', 'Label', 'Type', 'Required', 'Term IRI'], rows);
  return page(c.label, body);
}

/**
 * @param {ResolvedResource} resource
 * @returns {string}
 */
function renderRecordList(resource) {
  const p = resource.project;
  const c = /** @type {import('@hyphae/core').Collection} */ (resource.collection);
  const records = resource.records ?? [];
  const pagination = resource.pagination;
  const title = `${c.label} Records`;

  let body = tag('h1', {}, esc(title));
  body += nav([
    { href: `/_projects`, label: 'Projects' },
    { href: `/${p.slug}`, label: p.label },
    { href: `/${p.slug}/_collections`, label: 'Collections' },
    { href: `/${p.slug}/${c.slug}`, label: c.label },
  ]);

  if (pagination) {
    const { total, page: pg } = pagination;
    const from = (pg.number - 1) * pg.size + 1;
    const to = Math.min(pg.number * pg.size, total);
    body += tag('p', { class: 'info' }, `Showing ${from}–${to} of ${total}`);
  }

  // Determine columns
  const tableFieldIds = c['x-table-fields'];
  const fields = c.fields;
  const displayFields = tableFieldIds
    ? fields.filter(f => tableFieldIds.includes(f.id))
    : fields;

  const headers = ['ID', ...displayFields.map(f => f.label)];
  const rows = records.map(rr => {
    const { record } = rr;
    const idCell = tag('a', {
      href: `/${esc(p.slug)}/${esc(c.slug)}/${esc(record.id)}`,
    }, esc(record.id));
    const cells = displayFields.map(f => esc(record.data[f.id] ?? ''));
    return [idCell, ...cells];
  });

  body += table(headers, rows);

  if (pagination) {
    const { page: pg } = pagination;
    const links = [];
    if (pg.number > 1) links.push(tag('a', { href: `?page=${pg.number - 1}` }, '← Previous'));
    // We show next only if there are more pages
    if (resource.records && resource.records.length === pg.size) {
      links.push(tag('a', { href: `?page=${pg.number + 1}` }, 'Next →'));
    }
    if (links.length) body += tag('nav', {}, links.join(' '));
  }

  return page(title, body);
}

/**
 * @param {ResolvedResource} resource
 * @returns {string}
 */
function renderRecord(resource) {
  const p = resource.project;
  const c = /** @type {import('@hyphae/core').Collection} */ (resource.collection);
  const rr = /** @type {ResolvedRecord} */ (resource.record);
  const { record } = rr;

  let body = tag('h1', {}, `Record: ${esc(record.id)}`);
  body += nav([
    { href: `/_projects`, label: 'Projects' },
    { href: `/${p.slug}`, label: p.label },
    { href: `/${p.slug}/_collections`, label: 'Collections' },
    { href: `/${p.slug}/${c.slug}`, label: c.label },
  ]);

  const fields = rr.fields ?? c.fields.map(f => ({ ...f }));
  let dlContent = '';
  for (const f of fields) {
    const value = f.value ?? record.data[f.id];
    let dd = esc(value ?? '');
    if (f.term?.iri) {
      dd += tag('br', {}) + tag('small', {}, tag('a', { href: f.term.iri }, esc(f.term.iri)));
    }
    dlContent += tag('dt', {}, esc(f.label)) + tag('dd', {}, dd);
  }
  body += tag('dl', {}, dlContent);
  body += nav([
    { href: `/${p.slug}/${c.slug}/${record.id}/edit`, label: 'Edit' },
    { href: `/${p.slug}/${c.slug}`, label: 'Back to list' },
  ]);

  return page(`Record: ${record.id}`, body);
}

// ── HtmlRenderer ──────────────────────────────────────────────────────────────

/** @implements {Renderer} */
export class HtmlRenderer {
  id = 'renderer-html';
  version = '0.0.0';
  type = /** @type {'renderer'} */ ('renderer');
  mimeTypes = ['text/html'];

  /**
   * @param {ResolvedResource} resource
   * @param {RenderContext} _context
   * @returns {Promise<string>}
   */
  async render(resource, _context) {
    switch (resource.type) {
      case 'projectList':  return renderProjectList(resource);
      case 'project':      return renderProject(resource);
      case 'collectionList': return renderCollectionList(resource);
      case 'collection':   return renderCollection(resource);
      case 'recordList':   return renderRecordList(resource);
      case 'record':       return renderRecord(resource);
      default:
        return page('Error', tag('p', {}, 'Unknown resource type'));
    }
  }
}
