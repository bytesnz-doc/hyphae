## UF-016: User deletes a record

**Type:** User Flow
**Actor:** Contributor (own records) or Editor / Admin (any record)
**Trigger:** User confirms deletion of a record

**Preconditions:**
- The project, collection, and record exist
- The user has `delete own records` or `delete all records` permission as appropriate

**Steps:**
1. User navigates to the record detail page (UF-014) and selects "Delete"
2. Server shows a confirmation prompt
3. User confirms the deletion
4. Server checks permission: contributor can only delete their own records; editor/admin can delete any
5. Server deletes the record from storage via the storage adapter
6. Server invokes SF-005 (fire action modules) with a `delete` event
7. Server redirects the user to the collection view

**Success Outcome:** The record is permanently deleted from storage. The user is redirected to the collection view.

**Error Outcomes:**
- Caller lacks permission to delete this record → `403 Forbidden`
- Record not found → `404 Not Found` (may have already been deleted)
- Storage error → `500 Internal Server Error`; record is unchanged

**Data Involved:**
- Record: ID, collectionId, projectId (used to build the `delete` event payload)

**Depends On:** UF-013, SF-003
