## UF-011: Admin creates a collection with field definitions

**Type:** User Flow
**Actor:** Admin (project-level admin role or higher)
**Trigger:** Admin submits a new collection definition with a label, slug, and field list

**Preconditions:**
- The project exists
- SF-001 and SF-004 are operational — ontology modules are loaded and term resolution is available
- The user holds the `admin` role for the project

**Steps:**
1. Admin navigates to the new collection page within a project
2. Admin enters: collection label, slug, optional description
3. Admin defines the field list. For each field:
   - Enters a field ID and human-readable label
   - Optionally enters a `termIri` to back the field with an ontology term
   - Sets field type, required/optional, and multiple-values flag
   - Sets optional constraints
4. Admin optionally sets collection-level `x-` properties:
   - `x-item-title` — field(s) to use as record title in list views
   - `x-table-fields` — ordered list of fields to show in the table
   - `x-default-page-size` — pagination default
   - `x-indexes` — fields to index
5. Admin optionally sets `extends` to inherit fields from existing collections
6. Admin submits the form
7. Server validates: slug is unique within the project, all `termIri` values reference known terms, required fields are present, field IDs are unique within the collection
8. Server creates the collection record in storage
9. Server triggers SF-004 to resolve field terms for the new collection
10. Server redirects admin to the new collection's detail page

**Success Outcome:** A new collection is created with all fields resolved. It is immediately accessible for reading and writing records.

**Error Outcomes:**
- Slug already in use within the project → Validation error
- A `termIri` cannot be resolved by any loaded module → Warning is shown; field is accepted with the raw IRI as its label. Admin can proceed or fix the IRI.
- Field IDs are not unique within the collection → Validation error listing the duplicate IDs
- Caller lacks admin permission on the project → `403 Forbidden`

**Data Involved:**
- Collection: label, slug, description, field definitions, x-properties, optional `extends` list
- Field: ID, termIri, label, description, type, required, multiple, constraints, x-computed descriptor

**Depends On:** UF-007, SF-004
