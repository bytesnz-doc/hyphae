## SF-004: On collection load, resolve ontology terms for field definitions

**Type:** Software Flow
**Actor:** hyphae core (Project / Collection / Record Manager)
**Trigger:** A collection is accessed for the first time after startup, or a collection definition is created or updated

**Preconditions:**
- SF-001 has completed — ontology modules and term collections are registered in the ontology registry
- The collection definition exists and contains one or more field definitions, some of which may declare a `termIri`

**Steps:**
1. Core iterates over each field definition in the collection
2. For each field that declares a `termIri`, core queries the ontology registry to resolve the IRI
3. The ontology registry delegates to the registered ontology modules, returning the first match:
   - Human-readable label (`rdfs:label` or schema equivalent)
   - Description / definition (`rdfs:comment`, `skos:definition`)
   - Data type and cardinality constraints
   - Domain and range
   - Source ontology reference
4. The resolved metadata is merged with the field definition:
   - If the field has no explicit label, the term's label is used
   - If the field has no explicit description, the term's description is used
   - Data type and constraints are derived from the term metadata unless explicitly overridden in the field definition
5. Fields without a `termIri` (custom fields) are used as-is, relying entirely on their inline definition
6. The fully resolved collection schema (fields with all metadata attached) is cached in memory for the lifetime of the server process

**Success Outcome:** Every field in the collection has a fully resolved definition — label, description, data type, constraints. Fields backed by ontology terms carry full term metadata. The resolved schema is available to the record manager, renderers, and the schema endpoint.

**Error Outcomes:**
- A `termIri` cannot be resolved by any loaded ontology module → Field is included with a warning; the raw IRI is used as the label so data is not blocked. The warning is logged at startup for the admin to address.
- The ontology registry has no modules that understand the format of the referenced term → Same warning behaviour as above

**Data Involved:**
- Collection field definitions (IDs, termIris, any explicit overrides)
- Ontology registry (loaded term metadata, keyed by IRI)
- Resolved collection schema (in-memory cache)

**Depends On:** SF-001
