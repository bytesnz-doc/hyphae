## UF-014: User views a record

**Type:** User Flow
**Actor:** Any authenticated user with at least `read` permission on the project
**Trigger:** User navigates to `/:projectSlug/:collectionSlug/:recordId`

**Preconditions:**
- The project, collection, and record exist
- SF-004 has resolved the collection's field definitions

**Steps:**
1. User navigates to `/:projectSlug/:collectionSlug/:recordId`
2. Server authenticates and authorises the request (SF-003)
3. Server retrieves the raw record from storage
4. Server resolves the record's field values against the collection's resolved field definitions, attaching ontology metadata to each field (label, description, data type) — producing a `ResolvedResource`
5. Server passes the `ResolvedResource` to the selected renderer via SF-006
6. Renderer produces the output:
   - **Simple view (default):** human-readable field labels and formatted values; no IRIs
   - **Complex view (if toggled):** field labels with IRIs shown alongside, term definitions, links to the term's entry in the source ontology

**Success Outcome:** The user sees the record's field values with human-readable labels. In complex view, ontology metadata is also visible.

**Error Outcomes:**
- Record not found → `404 Not Found`
- Collection or project not found → `404 Not Found`
- Caller lacks read permission → `403 Forbidden`

**Data Involved:**
- Record: ID, collectionId, data map, meta
- Resolved field definitions: label, description, data type, termIri, source ontology reference
- `RenderContext`: simple vs complex view preference, project config

**Depends On:** UF-013, SF-006
