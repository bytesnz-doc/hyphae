## SF-003: On every request, authenticate and authorise before storage access

**Type:** Software Flow
**Actor:** hyphae server (Fastify pre-handler hook)
**Trigger:** Any inbound HTTP request to a data endpoint

**Preconditions:**
- SF-001 has completed — modules are loaded and the server is ready
- The target project and collection (if applicable) are known from the URL

**Steps:**
1. Server inspects the request for an authentication credential:
   - `Authorization: Bearer <token>` header (JWT for local auth or OIDC)
   - Session cookie
   - No credential present (open/anonymous access)
2. If a credential is present, server validates it:
   - For JWT: verifies signature, checks expiry, extracts the user identity and claims
   - For OIDC token: validates against the configured identity provider
3. If the credential is invalid or expired, server returns `401 Unauthorized` and stops
4. Server resolves the user's role(s) for the target project (or the server-level role if no project is in scope)
5. Server evaluates the required permission for the requested operation (create / read / update / delete) against the user's resolved role set
6. If permission is denied, server returns `403 Forbidden` and stops
7. If the project is configured for open access and the operation is allowed under open access, the request proceeds without a user identity
8. Request is allowed to proceed to the route handler and storage adapter

**Success Outcome:** The request is authenticated and authorised. The resolved user identity and their permissions are attached to the request context for use by downstream handlers.

**Error Outcomes:**
- Missing credential on a non-open endpoint → `401 Unauthorized`
- Invalid or expired token → `401 Unauthorized`
- Valid user but insufficient permissions for the requested operation and scope → `403 Forbidden`
- Project not found → `404 Not Found` (before auth check reaches the role resolution step)

**Data Involved:**
- Request credential (JWT, OIDC token, or none)
- User identity and role assignments (server-level and project-level)
- Operation being performed and the scope (own records vs all records, collection, project)
- Project open-access configuration

**Depends On:** SF-001
