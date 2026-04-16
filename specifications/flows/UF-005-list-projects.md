## UF-005: User lists all projects

**Type:** User Flow
**Actor:** Any authenticated user (or anonymous user if the server allows open access)
**Trigger:** User navigates to the hyphae instance root or the `/_projects` URL

**Preconditions:**
- SF-001 has completed
- The user is authenticated, or the instance is configured for open read access

**Steps:**
1. User navigates to `/_projects` (or the root URL if configured to show the project list)
2. Server authenticates and authorises the request (SF-003)
3. Server retrieves all projects the requesting user has at least `read` permission for
4. Server renders the list via the selected renderer (SF-006), showing for each project: label, description, and a link to the project detail
5. User sees the list of accessible projects

**Success Outcome:** The user sees a list of all projects they can access. Each item links to the project detail.

**Error Outcomes:**
- User is unauthenticated on a non-open instance → `401 Unauthorized` / redirect to login
- No projects are accessible to the user → An empty state message is shown

**Data Involved:**
- List of projects the user has read access to: ID, slug, label, description

**Depends On:** SF-003, SF-006
