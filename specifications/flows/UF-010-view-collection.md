## UF-010: User views a collection

**Type:** User Flow
**Actor:** Any authenticated user with at least `read` permission on the project
**Trigger:** User navigates to `/:projectSlug/:collectionSlug`

**Preconditions:**
- The project and collection exist
- SF-004 has resolved the collection's field definitions
- The user has at least `read` permission on the project

**Steps:**
1. User navigates to `/:projectSlug/:collectionSlug`
2. Server authenticates and authorises the request (SF-003)
3. Server retrieves the collection definition (with resolved field metadata from SF-004)
4. Server retrieves the first page of records using the collection's default page size
5. Server renders the response via the selected renderer (SF-006):
   - Collection label and description
   - A table or list of records using the fields nominated in `x-table-fields`
   - Pagination controls
6. User sees the collection with its records

**Success Outcome:** The user sees the collection's label, its field definitions, and a paginated table of records.

**Error Outcomes:**
- Project or collection not found → `404 Not Found`
- User lacks read permission → `403 Forbidden`
- Collection has no records → Empty state with the collection definition visible and a prompt to create the first record

**Data Involved:**
- Collection: label, description, resolved field definitions
- Records: first page of data, keyed by field ID
- `x-table-fields`: ordered list of field IDs to display in the table view

**Depends On:** UF-009, SF-004
