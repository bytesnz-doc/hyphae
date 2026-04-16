## UF-008: Admin deletes a project

**Type:** User Flow
**Actor:** Admin (project-level or server-level admin)
**Trigger:** Admin confirms deletion of a project

**Preconditions:**
- The project exists
- The user holds the `admin` role for the project or the server-level admin role

**Steps:**
1. Admin navigates to the project settings page
2. Admin selects "Delete project"
3. Server shows a confirmation prompt, clearly stating that all collections and records will be permanently deleted
4. Admin confirms by entering the project slug to acknowledge irreversibility
5. Server validates the confirmation input matches the project slug
6. Server deletes all records, collections, and the project record from storage
7. Server redirects admin to the project list

**Success Outcome:** The project, all its collections, and all records are permanently deleted. The slug is freed for reuse.

**Error Outcomes:**
- Confirmation input does not match the project slug → Deletion is blocked; admin is prompted to re-enter
- Caller does not have admin permission → `403 Forbidden`
- Project not found → `404 Not Found`

**Data Involved:**
- Project ID and slug (for confirmation matching)
- All collections and records belonging to the project (deleted)

**Depends On:** UF-007
