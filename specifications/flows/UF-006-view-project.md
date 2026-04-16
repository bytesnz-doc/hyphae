## UF-006: User views a project

**Type:** User Flow
**Actor:** Any authenticated user with at least `read` permission on the project
**Trigger:** User navigates to `/:projectSlug`

**Preconditions:**
- The project exists
- The user has at least `read` permission on the project (SF-003)

**Steps:**
1. User navigates to `/:projectSlug`
2. Server authenticates and authorises the request (SF-003)
3. Server retrieves the project record
4. Server retrieves the list of collections within the project
5. Server renders the response via the selected renderer (SF-006):
   - Project label and description
   - List of collections (name, description, record count) with links to each
6. User sees the project detail page

**Success Outcome:** The user sees the project's label, description, and a list of its collections.

**Error Outcomes:**
- Project slug not found → `404 Not Found`
- User does not have read permission → `403 Forbidden`

**Data Involved:**
- Project: ID, slug, label, description
- Collections within the project: ID, slug, label, description, record count

**Depends On:** UF-005
