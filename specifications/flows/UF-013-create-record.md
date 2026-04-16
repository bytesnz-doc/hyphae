## UF-013: User creates a record via form

**Type:** User Flow
**Actor:** Field User, Contributor, or Editor
**Trigger:** User submits a new record form for a collection

**Preconditions:**
- The project and collection exist
- SF-004 has resolved the collection's field definitions (so the form can be generated)
- The user has at least `create own records` permission for the collection

**Steps:**
1. User navigates to the create record page for a collection (`POST /:projectSlug/:collectionSlug` via the form link)
2. Server renders a create form generated from the collection's resolved field definitions:
   - Field labels from ontology term metadata (or custom label overrides)
   - Appropriate input controls for each field type (text, number, date picker, map picker, select, etc.)
   - Help text from the ontology term description
3. User fills in the form fields
4. User submits the form
5. Server validates the submitted data against the collection's field definitions:
   - Required fields are present
   - Values match declared field types
   - Constraint rules (e.g. min/max, allowed values) are satisfied
6. Server assigns a server-generated record ID
7. Server stores the record via the storage adapter with `meta.createdAt`, `meta.updatedAt`, `meta.createdBy`, and `meta.version = 1`
8. Server invokes SF-005 (fire action modules) with a `create` event
9. Server redirects the user to the new record's detail page

**Success Outcome:** A new record is stored in the collection. The user is redirected to the record detail view. The record's ID, version, and timestamps are set.

**Error Outcomes:**
- Required field is missing → Form re-displays with field-level validation errors in plain language
- Field value does not match declared type → Form re-displays with a type mismatch error
- Constraint violation (e.g. value out of allowed range) → Form re-displays with constraint guidance
- Caller lacks create permission → `403 Forbidden`
- Storage error → `500 Internal Server Error`; no partial record is committed

**Data Involved:**
- Submitted field values keyed by field ID
- New record: ID, collectionId, projectId, data map, meta (createdAt, updatedAt, createdBy, version)

**Depends On:** UF-011, SF-003
