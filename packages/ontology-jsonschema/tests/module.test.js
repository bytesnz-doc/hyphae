import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JsonSchemaOntologyModule } from '../src/index.js';

const schema = {
  $id: 'https://example.com/bird',
  title: 'Bird',
  properties: {
    scientificName: {
      type: 'string',
      title: 'Scientific Name',
      description: 'The scientific name of the species',
      'x-iri': 'http://rs.tdwg.org/dwc/terms/scientificName',
    },
    count: {
      type: 'integer',
      title: 'Individual Count',
    },
    observed: {
      type: 'string',
      format: 'date',
      title: 'Observation Date',
    },
    eventDateTime: {
      type: 'string',
      format: 'date-time',
      title: 'Event Date Time',
    },
    occurrenceUrl: {
      type: 'string',
      format: 'uri',
      title: 'Occurrence URL',
    },
    tags: {
      type: 'array',
      title: 'Tags',
      maxItems: 10,
    },
    active: {
      type: 'boolean',
      title: 'Active',
    },
  },
  required: ['scientificName'],
};

describe('JsonSchemaOntologyModule', () => {
  it('loads schema and lists terms', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const terms = await mod.listTerms();
    assert.equal(terms.length, 7);
  });

  it('maps explicit x-iri', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('http://rs.tdwg.org/dwc/terms/scientificName');
    assert.ok(term);
    assert.equal(term.label, 'Scientific Name');
    assert.equal(term.type, 'string');
  });

  it('marks required fields from schema-level required array', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('http://rs.tdwg.org/dwc/terms/scientificName');
    assert.equal(term?.required, true);
  });

  it('maps integer type to number', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('https://example.com/bird#count');
    assert.equal(term?.type, 'number');
  });

  it('maps date format to date field type', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('https://example.com/bird#observed');
    assert.equal(term?.type, 'date');
  });

  it('maps date-time format to datetime-partial', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('https://example.com/bird#eventDateTime');
    assert.equal(term?.type, 'datetime-partial');
  });

  it('maps uri format to uri field type', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('https://example.com/bird#occurrenceUrl');
    assert.equal(term?.type, 'uri');
  });

  it('sets multiple=true when maxItems > 1', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('https://example.com/bird#tags');
    assert.equal(term?.multiple, true);
  });

  it('maps boolean type', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('https://example.com/bird#active');
    assert.equal(term?.type, 'boolean');
  });

  it('returns null for unknown IRI', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    assert.equal(await mod.getTerm('https://unknown.example/term'), null);
  });

  it('can look up term by property name shorthand', async () => {
    const mod = new JsonSchemaOntologyModule();
    await mod.load({ type: 'inline', content: schema });
    const term = await mod.getTerm('count');
    assert.ok(term);
    assert.equal(term.type, 'number');
  });
});
