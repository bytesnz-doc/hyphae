## UF-015: User updates a record

**Type:** User Flow
**Actor:** Contributor (own records) or Editor / Admin (any record)
**Trigger:** User submits the edit form for an existing record

**Preconditions:**
- The project, collection, and record exist
- SF-004 has resolved the collection's field definitions
- The user has `update own records` or `update all records` permission as appropriate

**Steps:**
1. User navigates to the record edit page (`PATCH /:projectSlug/:collectionSlug/:recordId` via the edit link on UF-014)
2. Server retrieves the existing record and renders an edit form pre-populated with current values
3. User modifies one or more field values and submits the form
4. Server validates the submitted values:
   - Required fields remain present
   - Values match declared field types
   - Constraint rules are satisfied
5. Server checks permission: contributor can only update records they created; editor/admin can update any
6. Server increments `meta.version` and sets `meta.updatedAt`
7. Server writes the updated record to storage via the storage adapter
8. Server invokes SF-005 (fire action modules) with an `update` event
9. Server redirects the user to the updated record's detail page

**Success Outcome:** The record is updated in storage. Version number and `updatedAt` timestamp are incremented. The user is redirected to the record detail view.

**Error Outcomes:**
- Validation failures → Form re-displays with field-level errors (same as UF-013)
- Caller lacks permission to update this record → `403 Forbidden`
- Record not found → `404 Not Found`
- Storage error → `500 Internal Server Error`; original record is unchanged

**Data Involved:**
- Updated field values (only changed fields need to be submitted, but the full record is validated)
- Record meta: version (incremented), updatedAt (set to now)

**Depends On:** UF-013, SF-003
