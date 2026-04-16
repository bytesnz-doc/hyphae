## UF-009: User lists collections in a project

**Type:** User Flow
**Actor:** Any authenticated user with at least `read` permission on the project
**Trigger:** User navigates to `/:projectSlug/_collections`

**Preconditions:**
- The project exists and SF-001 has completed
- The user has at least `read` permission on the project

**Steps:**
1. User navigates to `/:projectSlug/_collections`
2. Server authenticates and authorises the request (SF-003)
3. Server retrieves all collections defined within the project
4. Server renders the response via the selected renderer (SF-006):
   - Collection label, description, and a link to each collection
5. User sees the list of collections

**Success Outcome:** The user sees all collections in the project, each with a label, description, and link.

**Error Outcomes:**
- Project not found → `404 Not Found`
- User lacks read permission on the project → `403 Forbidden`
- Project has no collections → Empty state message

**Data Involved:**
- Collections: ID, slug, label, description

**Depends On:** UF-005
