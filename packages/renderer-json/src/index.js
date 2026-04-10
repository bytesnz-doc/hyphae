// @ts-check
/** @import { Renderer, ResolvedResource, RenderContext, DataRecord, Collection, Project } from '@hyphae/core' */

// ── Shared URL helpers ────────────────────────────────────────────────────────

/** @param {string} baseUrl @param {Project} project @returns {string} */
function projectUrl(baseUrl, project) {
  return `${baseUrl}/${project.slug}`;
}

/** @param {string} baseUrl @param {Project} project @param {Collection} collection @returns {string} */
function collectionUrl(baseUrl, project, collection) {
  return `${projectUrl(baseUrl, project)}/${collection.slug}`;
}

/** @param {string} baseUrl @param {Project} project @param {Collection} collection @param {string} id @returns {string} */
function recordUrl(baseUrl, project, collection, id) {
  return `${collectionUrl(baseUrl, project, collection)}/${id}`;
}

// ── PlainJsonRenderer — application/json ─────────────────────────────────────

/**
 * Renders resources as straightforward JSON with no JSON:API envelope.
 * Lists include a top-level `meta` object for pagination.
 * @implements {Renderer}
 */
export class PlainJsonRenderer {
  /** @readonly @type {'renderer'} */
  type = 'renderer';
  id = 'renderer-json-plain';
  version = '0.0.0';
  mimeTypes = ['application/json'];

  /** @param {ResolvedResource} resource @param {RenderContext} _context @returns {Promise<string>} */
  async render(resource, _context) {
    return JSON.stringify(this.#serialize(resource), null, 2);
  }

  /** @param {ResolvedResource} resource @returns {unknown} */
  #serialize(resource) {
    switch (resource.type) {
      case 'record': {
        const { record, collection } = resource;
        if (!record || !collection) break;
        return { id: record.record.id, ...record.record.data, _meta: record.record.meta };
      }

      case 'recordList': {
        const { records, collection } = resource;
        if (!records || !collection) break;
        const data = records.map((r) => ({ id: r.record.id, ...r.record.data, _meta: r.record.meta }));
        /** @type {Record<string, unknown>} */
        const result = { data };
        if (resource.pagination) {
          const { total, page } = resource.pagination;
          result['meta'] = { total, page: page.number, pageSize: page.size };
        }
        return result;
      }

      case 'collection': {
        const { collection } = resource;
        if (!collection) break;
        const { id, slug, label, description, version, fields, createdAt, updatedAt } = collection;
        return { id, slug, label, description, version, fields, createdAt, updatedAt };
      }

      case 'collectionList': {
        const { collections } = resource;
        if (!collections) break;
        return {
          data: collections.map(({ id, slug, label, description, version, createdAt, updatedAt }) => ({
            id, slug, label, description, version, createdAt, updatedAt,
          })),
        };
      }

      case 'project': {
        const { id, slug, label, description, createdAt, updatedAt } = resource.project;
        return { id, slug, label, description, createdAt, updatedAt };
      }

      case 'projectList': {
        const { projects } = resource;
        if (!projects) break;
        return {
          data: projects.map(({ id, slug, label, description, createdAt, updatedAt }) => ({
            id, slug, label, description, createdAt, updatedAt,
          })),
        };
      }
    }

    return { error: `Cannot render resource type: ${resource.type}` };
  }
}

// ── JSON:API helpers ──────────────────────────────────────────────────────────

/** @param {Project} project @param {string} baseUrl @returns {object} */
function jaProject(project, baseUrl) {
  return {
    type: 'projects',
    id: project.id,
    attributes: {
      slug: project.slug,
      label: project.label,
      ...(project.description !== undefined && { description: project.description }),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    links: { self: projectUrl(baseUrl, project) },
  };
}

/** @param {Collection} collection @param {string} baseUrl @param {Project} project @returns {object} */
function jaCollection(collection, baseUrl, project) {
  return {
    type: 'collections',
    id: collection.id,
    attributes: {
      slug: collection.slug,
      label: collection.label,
      ...(collection.description !== undefined && { description: collection.description }),
      version: collection.version,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    },
    relationships: {
      project: { data: { type: 'projects', id: collection.projectId } },
    },
    links: { self: collectionUrl(baseUrl, project, collection) },
  };
}

/** @param {DataRecord} record @param {Collection} collection @param {Project} project @param {string} baseUrl @returns {object} */
function jaRecord(record, collection, project, baseUrl) {
  return {
    type: 'records',
    id: record.id,
    attributes: { ...record.data, _meta: record.meta },
    relationships: {
      collection: { data: { type: 'collections', id: collection.id } },
    },
    links: { self: recordUrl(baseUrl, project, collection, record.id) },
  };
}

// ── JsonApiRenderer — application/vnd.api+json ───────────────────────────────

/**
 * Renders resources as JSON:API documents (application/vnd.api+json).
 * Includes relationship linkage and `included` side-loading for related resources.
 * @implements {Renderer}
 */
export class JsonApiRenderer {
  /** @readonly @type {'renderer'} */
  type = 'renderer';
  id = 'renderer-jsonapi';
  version = '0.0.0';
  mimeTypes = ['application/vnd.api+json'];

  /** @param {ResolvedResource} resource @param {RenderContext} context @returns {Promise<string>} */
  async render(resource, context) {
    return JSON.stringify(this.#buildDocument(resource, context), null, 2);
  }

  /** @param {ResolvedResource} resource @param {RenderContext} context @returns {unknown} */
  #buildDocument(resource, context) {
    const { baseUrl } = context;
    const project = resource.project;

    switch (resource.type) {
      case 'record': {
        const { record, collection } = resource;
        if (!record || !collection) break;
        return {
          data: jaRecord(record.record, collection, project, baseUrl),
          included: [jaCollection(collection, baseUrl, project), jaProject(project, baseUrl)],
          links: { self: recordUrl(baseUrl, project, collection, record.record.id) },
        };
      }

      case 'recordList': {
        const { records, collection } = resource;
        if (!records || !collection) break;
        /** @type {Record<string, unknown>} */
        const doc = {
          data: records.map((r) => jaRecord(r.record, collection, project, baseUrl)),
          links: { self: collectionUrl(baseUrl, project, collection) + '/records' },
        };
        if (resource.pagination) {
          const { total, page } = resource.pagination;
          doc['meta'] = { total, page: page.number, pageSize: page.size };
        }
        return doc;
      }

      case 'collection': {
        const { collection } = resource;
        if (!collection) break;
        return {
          data: jaCollection(collection, baseUrl, project),
          included: [jaProject(project, baseUrl)],
          links: { self: collectionUrl(baseUrl, project, collection) },
        };
      }

      case 'collectionList': {
        const { collections } = resource;
        if (!collections) break;
        return {
          data: collections.map((c) => jaCollection(c, baseUrl, project)),
          included: [jaProject(project, baseUrl)],
          links: { self: projectUrl(baseUrl, project) + '/collections' },
        };
      }

      case 'project': {
        return {
          data: jaProject(project, baseUrl),
          links: { self: projectUrl(baseUrl, project) },
        };
      }

      case 'projectList': {
        const { projects } = resource;
        if (!projects) break;
        return {
          data: projects.map((p) => jaProject(p, baseUrl)),
          links: { self: baseUrl },
        };
      }
    }

    return {
      errors: [{ title: 'Unknown resource type', detail: `Cannot render resource type: ${resource.type}` }],
    };
  }
}

