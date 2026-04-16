## UF-004: Admin assigns roles to users within a project

**Type:** User Flow
**Actor:** Admin (server-level or project-level admin role)
**Trigger:** Admin opens project access settings and assigns or changes a user's role

**Preconditions:**
- The admin is authenticated and holds the `admin` role for the target project (or a server-level admin role)
- The target user account exists
- The project exists

**Steps:**
1. Admin navigates to the project's access settings page
2. Admin searches for or selects the target user
3. Admin selects a role to assign from the project's defined role set (e.g. `viewer`, `contributor`, `editor`, `admin`)
4. Admin confirms the assignment
5. Server validates that the admin has permission to manage roles for the project
6. Server records the role assignment for the user on the project
7. The updated role assignment takes effect immediately for the user's subsequent requests

**Success Outcome:** The target user is assigned the chosen role on the project. Their access permissions change accordingly on their next request.

**Error Outcomes:**
- Caller does not have admin permission for the project → `403 Forbidden`
- Target user does not exist → Error message; no assignment made
- Specified role does not exist on the project → Validation error; no assignment made
- Attempting to remove the last admin from a project → Blocked with an explanatory error message

**Data Involved:**
- Project ID
- Target user ID
- Role name
- Role assignment record: user ID, project ID, role name, assigned-by, assigned timestamp

**Depends On:** UF-002
